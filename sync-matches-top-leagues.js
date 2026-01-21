import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, 'server', '.env') });

import { query } from './server/config/database.js';

const API_FOOTBALL_BASE_URL = 'https://v3.football.api-sports.io';
const API_KEY = process.env.API_FOOTBALL_KEY;

async function fetchFromApiFootball(endpoint, params = {}) {
  const url = new URL(`${API_FOOTBALL_BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  });

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': 'v3.football.api-sports.io'
    }
  });

  if (!response.ok) {
    throw new Error(`API-Football error: ${response.status}`);
  }

  const data = await response.json();
  return data.response || [];
}

async function syncMatchesForTopLeagues() {
  console.log('⚽ Syncing matches from top leagues with Moroccan players...\n');

  try {
    // Top European leagues - use 2024 season (2024/2025) 
    // Note: API-Football has real-world data. System shows 2026 but we query real-world dates (2025)
    const leaguesToSync = [
      { id: 2, name: 'Champions League', season: 2024 },     // UEFA Champions League
      { id: 3, name: 'Europa League', season: 2024 },        // UEFA Europa League
      { id: 39, name: 'Premier League', season: 2024 },      // England
      { id: 140, name: 'La Liga', season: 2024 },            // Spain
      { id: 78, name: 'Bundesliga', season: 2024 },          // Germany
      { id: 61, name: 'Ligue 1', season: 2024 },             // France
      { id: 135, name: 'Serie A', season: 2024 },            // Italy
      { id: 88, name: 'Eredivisie', season: 2024 },          // Netherlands
      { id: 253, name: 'MLS', season: 2024 },                // USA
      { id: 94, name: 'Primeira Liga', season: 2024 },       // Portugal
      { id: 203, name: 'Super Lig', season: 2024 },          // Turkey
      { id: 307, name: 'Saudi Pro League', season: 2024 },   // Saudi Arabia
    ];

    console.log('\n💡 Using season 2024 (2024/2025)');
    console.log('💡 Querying real-world current dates (January 2025)');
    console.log('💡 Now includes Champions League and Europa League!');
    console.log('💡 Fetching recent and upcoming fixtures\n');

    let totalMatches = 0;
    let addedMatches = 0;
    let updatedMatches = 0;

    for (const league of leaguesToSync) {
      console.log(`\n🏆 Fetching fixtures for ${league.name}...`);
      
      // Use real-world current date (January 21, 2025) not system date (2026)
      const fromDate = '2025-01-15';  // Week ago
      const toDate = '2025-01-28';    // Week ahead
      
      console.log(`  Searching from ${fromDate} to ${toDate}...`);
      
      const fixtures = await fetchFromApiFootball('/fixtures', {
        league: league.id,
        season: league.season,
        from: fromDate,
        to: toDate,
        timezone: 'UTC'
      });

      console.log(`  ✅ Found ${fixtures.length} fixtures`);
      totalMatches += fixtures.length;

      // Ensure league exists
      await ensureLeagueExists(league.id);

      for (const fixture of fixtures) {
        const fixtureId = `af-${fixture.fixture.id}`;

        // Ensure teams exist
        await ensureTeamExists(fixture.teams.home, league.id);
        await ensureTeamExists(fixture.teams.away, league.id);

        // Get team IDs from our database
        const homeTeamResult = await query(
          'SELECT id FROM teams WHERE api_football_id = $1',
          [fixture.teams.home.id]
        );
        const awayTeamResult = await query(
          'SELECT id FROM teams WHERE api_football_id = $1',
          [fixture.teams.away.id]
        );
        const leagueResult = await query(
          'SELECT id FROM leagues WHERE api_football_id = $1',
          [league.id]
        );

        if (homeTeamResult.rows.length === 0 || awayTeamResult.rows.length === 0 || leagueResult.rows.length === 0) {
          continue;
        }

        const homeTeamId = homeTeamResult.rows[0].id;
        const awayTeamId = awayTeamResult.rows[0].id;
        const leagueId = leagueResult.rows[0].id;

        // Map status
        const status = mapFixtureStatus(fixture.fixture.status.short);

        // Check if match exists
        const existingMatch = await query(
          'SELECT id FROM matches WHERE id = $1',
          [fixtureId]
        );

        if (existingMatch.rows.length > 0) {
          // Update
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
          // Insert
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

        // Link Moroccan players
        await linkMoroccanPlayersToMatch(fixtureId, homeTeamId, awayTeamId);
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n✅ Match sync completed!');
    console.log(`📈 Total fixtures processed: ${totalMatches}`);
    console.log(`  ✅ Added: ${addedMatches}`);
    console.log(`  🔄 Updated: ${updatedMatches}`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

async function ensureLeagueExists(leagueApiId) {
  const existing = await query(
    'SELECT id FROM leagues WHERE api_football_id = $1',
    [leagueApiId]
  );

  if (existing.rows.length === 0) {
    // Fetch league details
    const leagues = await fetchFromApiFootball('/leagues', { id: leagueApiId });
    if (leagues.length > 0) {
      const leagueData = leagues[0].league;
      const leagueId = `af-league-${leagueApiId}`;
      await query(`
        INSERT INTO leagues (id, name, short_name, country, logo, api_football_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `, [
        leagueId,
        leagueData.name,
        leagueData.name.substring(0, 10),
        leagues[0].country.name,
        leagueData.logo,
        leagueApiId
      ]);
    }
  }
}

async function ensureTeamExists(teamData, leagueApiId) {
  const existing = await query(
    'SELECT id FROM teams WHERE api_football_id = $1',
    [teamData.id]
  );

  if (existing.rows.length === 0) {
    // Get league ID
    const leagueResult = await query(
      'SELECT id FROM leagues WHERE api_football_id = $1',
      [leagueApiId]
    );
    const leagueId = leagueResult.rows.length > 0 ? leagueResult.rows[0].id : null;

    const teamId = `af-team-${teamData.id}`;
    await query(`
      INSERT INTO teams (id, name, short_name, logo, api_football_id, league_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET 
        logo = EXCLUDED.logo,
        api_football_id = EXCLUDED.api_football_id
    `, [
      teamId,
      teamData.name,
      teamData.name.substring(0, 10),
      teamData.logo,
      teamData.id,
      leagueId
    ]);
  }
}

async function linkMoroccanPlayersToMatch(matchId, homeTeamId, awayTeamId) {
  const playersResult = await query(`
    SELECT id, name FROM players 
    WHERE (team_id = $1 OR team_id = $2) 
    AND nationality = 'Morocco'
  `, [homeTeamId, awayTeamId]);

  for (const player of playersResult.rows) {
    await query(`
      INSERT INTO match_players (match_id, player_id)
      VALUES ($1, $2)
      ON CONFLICT (match_id, player_id) DO NOTHING
    `, [matchId, player.id]);
  }

  if (playersResult.rows.length > 0) {
    console.log(`  🇲🇦 Linked ${playersResult.rows.length} Moroccan player(s): ${playersResult.rows.map(p => p.name).join(', ')}`);
  }
}

function mapFixtureStatus(apiStatus) {
  const statusMap = {
    'TBD': 'scheduled', 'NS': 'scheduled', 'PST': 'scheduled',
    '1H': 'live', 'HT': 'live', '2H': 'live', 'ET': 'live', 'BT': 'live', 'P': 'live', 'SUSP': 'live', 'INT': 'live',
    'FT': 'finished', 'AET': 'finished', 'PEN': 'finished',
    'CANC': 'cancelled', 'ABD': 'cancelled', 'AWD': 'finished', 'WO': 'finished'
  };
  return statusMap[apiStatus] || 'scheduled';
}

syncMatchesForTopLeagues();
