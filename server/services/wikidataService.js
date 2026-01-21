import fetch from 'node-fetch';
import { query } from '../config/database.js';

const WIKIDATA_SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';

/**
 * Fetch Moroccan football players from Wikidata with pagination
 */
export async function fetchMoroccanPlayersFromWikidata(offset = 0) {
  // SPARQL query to get Moroccan football players with their LATEST teams and leagues
  const sparqlQuery = `
    SELECT DISTINCT ?player ?playerLabel ?positionLabel ?teamLabel ?team ?leagueLabel ?league ?teamCountryLabel ?dateOfBirth ?image ?startTime
    WHERE {
      ?player wdt:P31 wd:Q5;                    # instance of human
              wdt:P106 wd:Q937857;              # occupation: football player
              wdt:P27 wd:Q1028;                 # country of citizenship: Morocco
              wdt:P21 wd:Q6581097.              # sex or gender: male
      
      OPTIONAL { 
        ?player p:P54 ?teamStatement.           # member of sports team statement
        ?teamStatement ps:P54 ?team.            # get the team value
        
        # Get start time to find the latest team
        OPTIONAL { ?teamStatement pq:P580 ?startTime. }
        
        # Exclude teams with end times in the past (retired/transferred)
        OPTIONAL { ?teamStatement pq:P582 ?endTime. }
        FILTER(!BOUND(?endTime) || ?endTime > NOW())
        
        OPTIONAL { ?team wdt:P118 ?league. }    # league
        OPTIONAL { ?team wdt:P17 ?teamCountry. } # team country
      }
      OPTIONAL { ?player wdt:P413 ?position. }  # position played
      OPTIONAL { ?player wdt:P569 ?dateOfBirth. } # date of birth
      OPTIONAL { ?player wdt:P18 ?image. }      # image
      
      # Get active and recent players (born after 1980)
      FILTER(?dateOfBirth > "1980-01-01"^^xsd:dateTime)
      
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,fr,ar". }
    }
    ORDER BY ?playerLabel DESC(?startTime)
    LIMIT 200
    OFFSET ${offset}
  `;

  const url = `${WIKIDATA_SPARQL_ENDPOINT}?query=${encodeURIComponent(sparqlQuery)}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/sparql-results+json',
        'User-Agent': 'MoroccanMatchTracker/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Wikidata API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform Wikidata results to our format
    const players = data.results.bindings.map(binding => ({
      wikidataId: binding.player.value.split('/').pop(),
      name: binding.playerLabel?.value || 'Unknown',
      position: binding.positionLabel?.value || 'Unknown',
      currentTeam: binding.teamLabel?.value || null,
      teamWikidataId: binding.team?.value?.split('/').pop() || null,
      league: binding.leagueLabel?.value || null,
      leagueWikidataId: binding.league?.value?.split('/').pop() || null,
      teamCountry: binding.teamCountryLabel?.value || null,
      dateOfBirth: binding.dateOfBirth?.value || null,
      imageUrl: binding.image?.value || null,
      startTime: binding.startTime?.value || null,
    }));
    
    // Group by player and keep only the latest team (highest startTime)
    const playerMap = new Map();
    players.forEach(player => {
      const existing = playerMap.get(player.wikidataId);
      if (!existing) {
        playerMap.set(player.wikidataId, player);
      } else {
        // Keep player with latest startTime (or with team if existing has no team)
        const existingTime = existing.startTime ? new Date(existing.startTime).getTime() : 0;
        const newTime = player.startTime ? new Date(player.startTime).getTime() : 0;
        
        if (newTime > existingTime || (!existing.currentTeam && player.currentTeam)) {
          playerMap.set(player.wikidataId, player);
        }
      }
    });
    
    const uniquePlayers = Array.from(playerMap.values());

    console.log(`✅ Fetched ${uniquePlayers.length} Moroccan players from Wikidata (offset: ${offset})`);
    return uniquePlayers;

  } catch (error) {
    console.error('❌ Error fetching from Wikidata:', error.message);
    throw error;
  }
}

/**
 * Fetch all Moroccan players by paginating through results
 */
export async function fetchAllMoroccanPlayers() {
  let allPlayers = [];
  let offset = 0;
  let hasMore = true;
  let retries = 0;
  const maxRetries = 3;

  console.log('📥 Fetching all Moroccan players from Wikidata...\n');

  while (hasMore) {
    try {
      const players = await fetchMoroccanPlayersFromWikidata(offset);
      
      if (players.length === 0) {
        hasMore = false;
      } else {
        allPlayers = allPlayers.concat(players);
        offset += 200;
        retries = 0; // Reset retries on success
        
        // Add delay to avoid rate limiting
        if (hasMore && players.length === 200) {
          console.log('⏳ Waiting 5 seconds before next batch...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        } else {
          hasMore = false;
        }
      }
    } catch (error) {
      if (retries < maxRetries && error.message.includes('Timeout')) {
        retries++;
        console.log(`⚠️  Timeout error. Retry ${retries}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10s before retry
      } else {
        console.error(`❌ Failed after ${retries} retries:`, error.message);
        console.log(`✅ Proceeding with ${allPlayers.length} players fetched so far...`);
        hasMore = false;
      }
    }
  }

  // Remove duplicates by wikidataId
  const uniquePlayers = Array.from(
    new Map(allPlayers.map(p => [p.wikidataId, p])).values()
  );

  console.log(`\n✅ Total unique players fetched: ${uniquePlayers.length}`);
  return uniquePlayers;
}

/**
 * Get or create team in database
 * FIXED: Properly normalize team names to avoid duplicates
 */
async function getOrCreateTeam(teamName, teamWikidataId, league, teamCountry) {
  if (!teamName) return null;

  try {
    // Normalize the team name to handle variations
    const normalizedName = normalizeTeamName(teamName);

    // Check if team exists (by normalized name or exact match)
    let existingTeam = await query(
      `SELECT id FROM teams 
       WHERE LOWER(name) = LOWER($1) 
       OR LOWER(short_name) = LOWER($2)
       OR LOWER(name) LIKE LOWER($3)
       LIMIT 1`,
      [teamName, teamName.substring(0, 10), `%${normalizedName}%`]
    );

    if (existingTeam.rows.length > 0) {
      return existingTeam.rows[0].id;
    }

    // CRITICAL FIX: Check for variations of Saudi teams and other common duplicates
    const variationMatches = {
      'al hilal': ['al-hilal', 'al hilal saudi fc', 'al hilal fc'],
      'al ahli': ['al-ahli', 'al ahli jeddah', 'al-ahli jeddah', 'al ahli fc'],
      'al ittihad': ['al-ittihad', 'al ittihad fc'],
    };

    for (const [key, variations] of Object.entries(variationMatches)) {
      if (normalizedName.includes(key)) {
        for (const variation of variations) {
          const match = await query(
            'SELECT id FROM teams WHERE LOWER(name) LIKE LOWER($1)',
            [`%${variation}%`]
          );
          if (match.rows.length > 0) {
            console.log(`  ✅ Found existing team using variation: ${variation} for ${teamName}`);
            return match.rows[0].id;
          }
        }
      }
    }

    // Get or create league first (make it optional - don't fail if no league)
    let leagueId = null;
    if (league) {
      try {
        const existingLeague = await query(
          'SELECT id FROM leagues WHERE LOWER(name) = LOWER($1)',
          [league]
        );

        if (existingLeague.rows.length > 0) {
          leagueId = existingLeague.rows[0].id;
        } else {
          // Create new league
          const shortName = league.length > 20 ? league.substring(0, 20) : league;
          const newLeague = await query(
            `INSERT INTO leagues (name, short_name, country, logo)
             VALUES ($1, $2, $3, '🏆')
             RETURNING id`,
            [league, shortName, teamCountry || 'Unknown']
          );
          leagueId = newLeague.rows[0].id;
          console.log(`  ✅ Created league: ${league}`);
        }
      } catch (leagueError) {
        console.log(`  ⚠️ Could not create league "${league}": ${leagueError.message}`);
        // Continue without league
      }
    }

    // Create new team (even if no league)
    const shortName = normalizedName.substring(0, 10);
    const newTeam = await query(
      `INSERT INTO teams (name, short_name, league_id, logo)
       VALUES ($1, $2, $3, '⚽')
       RETURNING id`,
      [teamName, shortName, leagueId]
    );

    console.log(`  ✅ Created team: ${teamName}${league ? ` (${league})` : ''}${teamCountry ? ` - ${teamCountry}` : ''}`);
    return newTeam.rows[0].id;

  } catch (error) {
    console.error(`  ❌ Error with team "${teamName}":`, error.message);
    console.error(`     League: ${league}, Country: ${teamCountry}`);
    return null;
  }
}

/**
 * Normalize team name to handle Saudi/European naming variations
 */
function normalizeTeamName(name) {
  return name
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ýÿ]/g, 'y')
    .replace(/ç/g, 'c')
    .replace(/[,.\-&]/g, '')
    .trim();
}

/**
 * Sync Wikidata players to database
 */
export async function syncPlayersToDatabase(wikidataPlayers) {
  let added = 0;
  let updated = 0;
  let skipped = 0;

  console.log(`\n🔄 Syncing ${wikidataPlayers.length} players to database...\n`);

  for (const player of wikidataPlayers) {
    try {
      // Check if player already exists by name
      const existingPlayer = await query(
        'SELECT id FROM players WHERE name = $1',
        [player.name]
      );

      if (existingPlayer.rows.length > 0) {
        // Update existing player with new data
        let teamId = null;
        if (player.currentTeam) {
          teamId = await getOrCreateTeam(
            player.currentTeam, 
            player.teamWikidataId,
            player.league,
            player.teamCountry
          );
        }

        await query(
          `UPDATE players 
           SET image_url = COALESCE($1, image_url),
               date_of_birth = COALESCE($2, date_of_birth),
               team_id = COALESCE($3, team_id),
               position = COALESCE($4, position),
               updated_at = CURRENT_TIMESTAMP
           WHERE name = $5`,
          [player.imageUrl, player.dateOfBirth, teamId, mapPosition(player.position), player.name]
        );
        updated++;
        if (updated % 10 === 0) console.log(`  Updated ${updated} players...`);
      } else {
        // Get or create team
        let teamId = null;
        if (player.currentTeam) {
          teamId = await getOrCreateTeam(
            player.currentTeam,
            player.teamWikidataId,
            player.league,
            player.teamCountry
          );
        }

        // Map position from Wikidata format to our format
        const mappedPosition = mapPosition(player.position);

        // Insert new player - add ALL players, not just notable ones
        try {
          await query(
            `INSERT INTO players (id, name, position, team_id, image_url, date_of_birth, nationality)
             VALUES ($1, $2, $3, $4, $5, $6, 'Morocco')
             ON CONFLICT (id) DO UPDATE SET
               image_url = COALESCE(EXCLUDED.image_url, players.image_url),
               team_id = COALESCE(EXCLUDED.team_id, players.team_id),
               updated_at = CURRENT_TIMESTAMP`,
            [
              player.wikidataId,
              player.name,
              mappedPosition,
              teamId,
              player.imageUrl,
              player.dateOfBirth
            ]
          );
          added++;
          if (added % 10 === 0) console.log(`  Added ${added} players...`);
        } catch (insertError) {
          skipped++;
        }
      }
    } catch (error) {
      console.error(`  ❌ Error syncing player ${player.name}:`, error.message);
      skipped++;
    }
  }

  return { added, updated, skipped };
}

/**
 * Map Wikidata position to our position format
 */
function mapPosition(wikidataPosition) {
  const positionMap = {
    'goalkeeper': 'GK',
    'defender': 'CB',
    'midfielder': 'CM',
    'forward': 'ST',
    'attacking midfielder': 'AM',
    'defensive midfielder': 'DM',
    'right back': 'RB',
    'left back': 'LB',
    'centre-back': 'CB',
    'winger': 'RW',
    'striker': 'ST',
  };

  const normalized = wikidataPosition?.toLowerCase() || '';
  
  for (const [key, value] of Object.entries(positionMap)) {
    if (normalized.includes(key)) {
      return value;
    }
  }

  return 'MF'; // Default to midfielder
}

/**
 * Find and link players to their teams
 */
export async function linkPlayersToTeams() {
  // Get all players without teams
  const playersWithoutTeams = await query(
    'SELECT id, name FROM players WHERE team_id IS NULL'
  );

  let linked = 0;

  for (const player of playersWithoutTeams.rows) {
    // Try to find team from Wikidata
    const wikidataPlayers = await fetchMoroccanPlayersFromWikidata();
    const wikidataMatch = wikidataPlayers.find(wp => wp.name === player.name);

    if (wikidataMatch?.currentTeam) {
      const teamMatch = await query(
        'SELECT id FROM teams WHERE name ILIKE $1 OR short_name ILIKE $1',
        [`%${wikidataMatch.currentTeam}%`]
      );

      if (teamMatch.rows.length > 0) {
        await query(
          'UPDATE players SET team_id = $1 WHERE id = $2',
          [teamMatch.rows[0].id, player.id]
        );
        linked++;
        console.log(`✅ Linked ${player.name} to ${wikidataMatch.currentTeam}`);
      }
    }
  }

  return linked;
}
