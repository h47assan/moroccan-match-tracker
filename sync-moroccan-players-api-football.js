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
 * Sync Moroccan players from API-Football for teams in our database
 */
async function syncMoroccanPlayersFromApiFootball() {
  console.log('🔄 Starting Moroccan player sync from API-Football...\n');

  try {
    // Get all teams that are in our matches
    const teamsResult = await query(`
      SELECT DISTINCT api_football_id, id as db_id, name
      FROM teams
      WHERE api_football_id IS NOT NULL
      AND (id IN (SELECT home_team_id FROM matches) OR id IN (SELECT away_team_id FROM matches))
      LIMIT 50
    `);

    console.log(`📊 Processing ${teamsResult.rows.length} teams...\n`);

    let totalPlayers = 0;
    let moroccanPlayersAdded = 0;

    for (const team of teamsResult.rows) {
      try {
        console.log(`🔍 Fetching players for ${team.name}...`);

        // Fetch players from API-Football
        const players = await fetchFromApiFootball('/players', {
          team: team.api_football_id,
          season: 2024
        });

        console.log(`   Found ${players.length} players`);

        // Filter for Moroccan players
        const moroccanPlayers = players.filter(p => p.player.nationality === 'Morocco');

        if (moroccanPlayers.length === 0) {
          console.log(`   No Moroccan players found`);
          continue;
        }

        console.log(`   ✅ Found ${moroccanPlayers.length} Moroccan players`);

        // Add each Moroccan player to the database
        for (const playerData of moroccanPlayers) {
          const playerId = `af-player-${playerData.player.id}`;

          const result = await query(
            `INSERT INTO players (id, name, position, team_id, nationality)
             VALUES ($1, $2, $3, $4, 'Morocco')
             ON CONFLICT (id) DO UPDATE SET team_id = EXCLUDED.team_id, name = EXCLUDED.name
             RETURNING id`,
            [
              playerId,
              playerData.player.name,
              playerData.statistics[0]?.games?.position || 'Unknown',
              team.db_id
            ]
          );

          if (result.rows.length > 0) {
            moroccanPlayersAdded++;
            totalPlayers++;
            console.log(`      ✅ ${playerData.player.name}`);
          }
        }

        // Rate limiting - wait 1 second between teams
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`  ❌ Error processing team ${team.name}:`, error.message);
        continue;
      }
    }

    console.log('\n✅ Moroccan player sync completed!');
    console.log(`👥 Total Moroccan players added/updated: ${moroccanPlayersAdded}`);

    return { totalPlayers, moroccanPlayersAdded };
  } catch (error) {
    console.error('❌ Error syncing players:', error.message);
    throw error;
  }
}

// Run the sync
syncMoroccanPlayersFromApiFootball()
  .then(result => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
