import fetch from 'node-fetch';
import { query } from './server/config/database.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, './server/.env') });

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
    throw new Error(`API-Football error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.response) {
    throw new Error('Invalid API-Football response format');
  }

  return data.response;
}

/**
 * Calculate similarity score between two strings (Levenshtein-like)
 */
function calculateSimilarity(str1, str2) {
  const s1 = str1.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const s2 = str2.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.95;
  
  let matches = 0;
  for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
    if (s1[i] === s2[i]) matches++;
  }
  
  return matches / Math.max(s1.length, s2.length);
}

/**
 * Find or create a player from API-Football data
 */
async function findOrCreatePlayer(playerData, teamId) {
  try {
    // Try to find existing player by name and team
    const existingPlayer = await query(
      `SELECT id FROM players WHERE LOWER(name) = LOWER($1) AND team_id = $2`,
      [playerData.player.name, teamId]
    );

    if (existingPlayer.rows.length > 0) {
      return existingPlayer.rows[0].id;
    }

    // Create new player
    const playerId = `af-player-${playerData.player.id}`;
    await query(
      `INSERT INTO players (id, name, position, team_id, nationality)
       VALUES ($1, $2, $3, $4, 'Morocco')
       ON CONFLICT (id) DO UPDATE SET 
         name = EXCLUDED.name,
         position = EXCLUDED.position
       RETURNING id`,
      [playerId, playerData.player.name, playerData.statistics[0]?.games?.position || 'Unknown', teamId]
    );

    return playerId;
  } catch (error) {
    console.error(`Error finding/creating player:`, error.message);
    return null;
  }
}

/**
 * Sync fixture lineups and link Moroccan players
 */
async function syncFixtureLineups() {
  console.log('🔄 Starting fixture lineup sync for Moroccan players...\n');

  try {
    // Get all matches with api_football_id (ordered by recent)
    const matchesResult = await query(`
      SELECT m.id, m.api_football_id, m.home_team_id, m.away_team_id
      FROM matches m
      WHERE m.api_football_id IS NOT NULL
      ORDER BY m.kickoff_time DESC
      LIMIT 100
    `);

    console.log(`📊 Found ${matchesResult.rows.length} matches to process\n`);

    let processedMatches = 0;
    let linkedPlayers = 0;

    for (const match of matchesResult.rows) {
      try {
        console.log(`\n🔍 Processing match ${match.id}...`);

        // Fetch lineups from API-Football
        const lineups = await fetchFromApiFootball('/fixtures/lineups', {
          fixture: match.api_football_id
        });

        if (!lineups || lineups.length === 0) {
          console.log(`  ⚠️  No lineups available`);
          continue;
        }

        processedMatches++;

        // Get team api_football_ids for this match
        const teamResult = await query(
          `SELECT api_football_id FROM teams WHERE id IN ($1, $2)`,
          [match.home_team_id, match.away_team_id]
        );

        const teamApiIds = teamResult.rows.map(r => r.api_football_id);

        // Process lineups from both teams
        for (const lineup of lineups) {
          const teamId = lineup.team.id;

          if (!teamApiIds.includes(teamId)) {
            continue; // Team not in our match
          }

          // Get our database team ID
          const dbTeamResult = await query(
            `SELECT id FROM teams WHERE api_football_id = $1`,
            [teamId]
          );

          if (dbTeamResult.rows.length === 0) continue;

          const dbTeamId = dbTeamResult.rows[0].id;

          // Check for Moroccan players in the lineup
          if (lineup.players && lineup.players.length > 0) {
            for (const playerData of lineup.players) {
              // Check if player is Moroccan
              if (playerData.player.nationality !== 'Morocco') {
                continue;
              }

              console.log(`  👤 Found Moroccan player: ${playerData.player.name}`);

              // Find or create the player
              const playerId = await findOrCreatePlayer(playerData, dbTeamId);

              if (playerId) {
                // Link player to match
                await query(
                  `INSERT INTO match_players (match_id, player_id)
                   VALUES ($1, $2)
                   ON CONFLICT (match_id, player_id) DO NOTHING`,
                  [match.id, playerId]
                );

                linkedPlayers++;
                console.log(`    ✅ Linked ${playerData.player.name} to match`);
              }
            }
          }
        }

        // Rate limiting - wait 2 seconds between matches
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`  ❌ Error processing match ${match.id}:`, error.message);
        // Continue to next match
      }
    }

    console.log('\n✅ Lineup sync completed!');
    console.log(`📈 Processed ${processedMatches} matches`);
    console.log(`👥 Linked ${linkedPlayers} player-match associations`);

    return { processedMatches, linkedPlayers };
  } catch (error) {
    console.error('❌ Error syncing lineups:', error.message);
    throw error;
  }
}

// Run the sync
syncFixtureLineups()
  .then(result => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
