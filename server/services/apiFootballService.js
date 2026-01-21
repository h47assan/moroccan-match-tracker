import fetch from 'node-fetch';
import { query } from '../config/database.js';

const API_FOOTBALL_BASE_URL = 'https://v3.football.api-sports.io';
const API_KEY = process.env.API_FOOTBALL_KEY;

/**
 * Make a request to API-Football
 */
async function fetchFromApiFootball(endpoint, params = {}) {
  const url = new URL(`${API_FOOTBALL_BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  });

  console.log(`🔍 Fetching from API-Football: ${endpoint}`);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': 'v3.football.api-sports.io'
    }
  });

  if (!response.ok) {
    throw new Error(`API-Football error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  // Check API response
  if (!data.response) {
    throw new Error('Invalid API-Football response format');
  }

  console.log(`✅ Received ${data.response.length} items from API-Football`);
  return data.response;
}

/**
 * Get fixtures for a specific team
 */
export async function getTeamFixtures(teamId, season = new Date().getFullYear(), last = 20) {
  try {
    return await fetchFromApiFootball('/fixtures', {
      team: teamId,
      season: season,
      last: last
    });
  } catch (error) {
    console.error(`Error fetching fixtures for team ${teamId}:`, error.message);
    return [];
  }
}

/**
 * Get upcoming fixtures for a specific team
 */
export async function getTeamUpcomingFixtures(teamId, next = 10) {
  try {
    return await fetchFromApiFootball('/fixtures', {
      team: teamId,
      next: next
    });
  } catch (error) {
    console.error(`Error fetching upcoming fixtures for team ${teamId}:`, error.message);
    return [];
  }
}

/**
 * Get fixtures by date
 */
export async function getFixturesByDate(date) {
  try {
    return await fetchFromApiFootball('/fixtures', {
      date: date // Format: YYYY-MM-DD
    });
  } catch (error) {
    console.error(`Error fetching fixtures for date ${date}:`, error.message);
    return [];
  }
}

/**
 * Get live fixtures
 */
export async function getLiveFixtures() {
  try {
    return await fetchFromApiFootball('/fixtures', {
      live: 'all'
    });
  } catch (error) {
    console.error('Error fetching live fixtures:', error.message);
    return [];
  }
}

/**
 * Get fixture lineups (to check if Moroccan players are playing)
 */
export async function getFixtureLineups(fixtureId) {
  try {
    return await fetchFromApiFootball('/fixtures/lineups', {
      fixture: fixtureId
    });
  } catch (error) {
    console.error(`Error fetching lineups for fixture ${fixtureId}:`, error.message);
    return [];
  }
}

/**
 * Get players for a specific team from API-Football
 */
export async function getTeamPlayers(teamId) {
  try {
    return await fetchFromApiFootball('/players', {
      team: teamId,
      season: 2024 // Current season
    });
  } catch (error) {
    console.error(`Error fetching players for team ${teamId}:`, error.message);
    return [];
  }
}

/**
 * Get players for a specific fixture/match
 */
export async function getFixturePlayers(fixtureId) {
  try {
    return await fetchFromApiFootball('/fixtures/players', {
      fixture: fixtureId
    });
  } catch (error) {
    console.error(`Error fetching players for fixture ${fixtureId}:`, error.message);
    return [];
  }
}

/**
 * Search for a team by name
 */
export async function searchTeam(teamName) {
  try {
    return await fetchFromApiFootball('/teams', {
      search: teamName
    });
  } catch (error) {
    console.error(`Error searching team ${teamName}:`, error.message);
    return [];
  }
}

/**
 * Get league standings
 */
export async function getLeagueStandings(leagueId, season = new Date().getFullYear()) {
  try {
    return await fetchFromApiFootball('/standings', {
      league: leagueId,
      season: season
    });
  } catch (error) {
    console.error(`Error fetching standings for league ${leagueId}:`, error.message);
    return [];
  }
}

/**
 * Sync fixtures for all teams that have Moroccan players
 */
export async function syncMoroccanPlayerFixtures() {
  console.log('🔄 Starting fixture sync for Moroccan players...\n');

  try {
    // Get all teams that have Moroccan players
    const teamsResult = await query(`
      SELECT DISTINCT t.id, t.name, t.api_football_id
      FROM teams t
      JOIN players p ON t.id = p.team_id
      WHERE p.nationality = 'Morocco'
      AND t.api_football_id IS NOT NULL
    `);

    console.log(`📊 Found ${teamsResult.rows.length} teams with Moroccan players\n`);

    let totalMatches = 0;
    let addedMatches = 0;
    let updatedMatches = 0;

    for (const team of teamsResult.rows) {
      console.log(`\n🔍 Fetching fixtures for ${team.name}...`);
      
      // Get next 10 upcoming fixtures for this team
      const fixtures = await getTeamUpcomingFixtures(team.api_football_id, 10);
      totalMatches += fixtures.length;

      for (const fixture of fixtures) {
        const fixtureId = `af-${fixture.fixture.id}`;
        const homeTeamApiId = fixture.teams.home.id;
        const awayTeamApiId = fixture.teams.away.id;
        const leagueApiId = fixture.league.id;

        // Ensure teams exist in database
        await ensureTeamExists(fixture.teams.home);
        await ensureTeamExists(fixture.teams.away);

        // Ensure league exists in database
        await ensureLeagueExists(fixture.league);

        // Get team IDs from our database
        const homeTeamResult = await query(
          'SELECT id FROM teams WHERE api_football_id = $1',
          [homeTeamApiId]
        );
        const awayTeamResult = await query(
          'SELECT id FROM teams WHERE api_football_id = $1',
          [awayTeamApiId]
        );
        const leagueResult = await query(
          'SELECT id FROM leagues WHERE api_football_id = $1',
          [leagueApiId]
        );

        if (homeTeamResult.rows.length === 0 || awayTeamResult.rows.length === 0) {
          console.log(`⚠️  Skipping fixture ${fixtureId}: Teams not found in database`);
          continue;
        }

        const homeTeamId = homeTeamResult.rows[0].id;
        const awayTeamId = awayTeamResult.rows[0].id;
        const leagueId = leagueResult.rows[0].id;

        // Map status
        const status = mapFixtureStatus(fixture.fixture.status.short);

        // Check if match already exists
        const existingMatch = await query(
          'SELECT id FROM matches WHERE id = $1',
          [fixtureId]
        );

        if (existingMatch.rows.length > 0) {
          // Update existing match
          await query(`
            UPDATE matches 
            SET home_score = $1, away_score = $2, status = $3, 
                kickoff_time = $4, venue = $5, updated_at = CURRENT_TIMESTAMP
            WHERE id = $6
          `, [
            fixture.goals.home,
            fixture.goals.away,
            status,
            new Date(fixture.fixture.date),
            fixture.fixture.venue?.name,
            fixtureId
          ]);
          updatedMatches++;
        } else {
          // Insert new match
          await query(`
            INSERT INTO matches 
            (id, home_team_id, away_team_id, league_id, kickoff_time, status, 
             home_score, away_score, venue, api_football_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `, [
            fixtureId,
            homeTeamId,
            awayTeamId,
            leagueId,
            new Date(fixture.fixture.date),
            status,
            fixture.goals.home,
            fixture.goals.away,
            fixture.fixture.venue?.name,
            fixture.fixture.id
          ]);
          addedMatches++;
        }

        // Link Moroccan players to this match
        await linkMoroccanPlayersToMatch(fixtureId, homeTeamId, awayTeamId);
      }

      // Rate limiting - wait 1 second between teams
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n✅ Fixture sync completed!');
    console.log(`📈 Total fixtures processed: ${totalMatches}`);
    console.log(`  ✅ Added: ${addedMatches}`);
    console.log(`  🔄 Updated: ${updatedMatches}`);

    return { totalMatches, addedMatches, updatedMatches };
  } catch (error) {
    console.error('❌ Error syncing fixtures:', error.message);
    throw error;
  }
}

/**
 * Helper: Ensure team exists in database
 */
async function ensureTeamExists(teamData) {
  const existingTeam = await query(
    'SELECT id FROM teams WHERE api_football_id = $1',
    [teamData.id]
  );

  if (existingTeam.rows.length === 0) {
    const teamId = `af-team-${teamData.id}`;
    await query(`
      INSERT INTO teams (id, name, short_name, logo, api_football_id)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO NOTHING
    `, [
      teamId,
      teamData.name,
      teamData.name.substring(0, 3).toUpperCase(),
      teamData.logo,
      teamData.id
    ]);
  }
}

/**
 * Helper: Ensure league exists in database
 */
async function ensureLeagueExists(leagueData) {
  const existingLeague = await query(
    'SELECT id FROM leagues WHERE api_football_id = $1',
    [leagueData.id]
  );

  if (existingLeague.rows.length === 0) {
    const leagueId = `af-league-${leagueData.id}`;
    await query(`
      INSERT INTO leagues (id, name, short_name, country, logo, api_football_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO NOTHING
    `, [
      leagueId,
      leagueData.name,
      leagueData.name.substring(0, 3).toUpperCase(),
      leagueData.country,
      leagueData.logo,
      leagueData.id
    ]);
  }
}

/**
 * Helper: Link Moroccan players from both teams to the match
 */
async function linkMoroccanPlayersToMatch(matchId, homeTeamId, awayTeamId) {
  // Get the team names from the match teams
  const matchTeamsResult = await query(`
    SELECT id, name, short_name FROM teams WHERE id IN ($1, $2)
  `, [homeTeamId, awayTeamId]);

  if (matchTeamsResult.rows.length === 0) return;

  // Normalize function for comparison (remove diacritics, spaces, lowercase)
  const normalize = (str) => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9]/g, ''); // Remove non-alphanumeric
  };

  // Find Moroccan players whose team names match (fuzzy)
  const allPlayers = await query(`
    SELECT p.id, p.name, t.name as team_name, t.short_name as team_short_name
    FROM players p
    JOIN teams t ON p.team_id = t.id
    WHERE p.nationality = 'Morocco'
  `);

  const playersToLink = [];
  
  for (const matchTeam of matchTeamsResult.rows) {
    const normalizedMatchName = normalize(matchTeam.name);
    const normalizedMatchShort = normalize(matchTeam.short_name);
    
    for (const player of allPlayers.rows) {
      const normalizedPlayerTeamName = normalize(player.team_name);
      const normalizedPlayerTeamShort = normalize(player.team_short_name);
      
      // Check if names match (full name or short name)
      if (normalizedMatchName === normalizedPlayerTeamName ||
          normalizedMatchShort === normalizedPlayerTeamShort ||
          normalizedMatchName.includes(normalizedPlayerTeamShort) ||
          normalizedPlayerTeamName.includes(normalizedMatchShort)) {
        playersToLink.push(player.id);
      }
    }
  }

  // Link unique players to the match
  const uniquePlayers = [...new Set(playersToLink)];
  for (const playerId of uniquePlayers) {
    await query(`
      INSERT INTO match_players (match_id, player_id)
      VALUES ($1, $2)
      ON CONFLICT (match_id, player_id) DO NOTHING
    `, [matchId, playerId]);
  }
  
  if (uniquePlayers.length > 0) {
    console.log(`    ✅ Linked ${uniquePlayers.length} Moroccan players to match ${matchId}`);
  }
}

/**
 * Helper: Map API-Football status to our status
 */
function mapFixtureStatus(apiStatus) {
  const statusMap = {
    'TBD': 'scheduled',
    'NS': 'scheduled',
    'PST': 'scheduled',
    '1H': 'live',
    'HT': 'live',
    '2H': 'live',
    'ET': 'live',
    'BT': 'live',
    'P': 'live',
    'SUSP': 'live',
    'INT': 'live',
    'FT': 'finished',
    'AET': 'finished',
    'PEN': 'finished',
    'CANC': 'cancelled',
    'ABD': 'cancelled',
    'AWD': 'finished',
    'WO': 'finished'
  };

  return statusMap[apiStatus] || 'scheduled';
}

export default {
  getTeamFixtures,
  getTeamUpcomingFixtures,
  getFixturesByDate,
  getLiveFixtures,
  getFixtureLineups,
  getFixturePlayers,
  searchTeam,
  getLeagueStandings,
  syncMoroccanPlayerFixtures
};
