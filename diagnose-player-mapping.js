import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, 'server', '.env') });

import { query } from './server/config/database.js';

async function diagnosePlayerMapping() {
  console.log('🔍 Diagnosing player-to-team mapping issues...\n');

  try {
    // Get Yassine Bounou from database
    const bounou = await query(
      'SELECT p.id, p.name, p.team_id, t.name as team_name FROM players p LEFT JOIN teams t ON p.team_id = t.id WHERE p.name ILIKE \'%Bounou%\' LIMIT 1'
    );

    if (bounou.rows.length === 0) {
      console.log('❌ Yassine Bounou not found in database');
      process.exit(0);
    }

    const player = bounou.rows[0];
    console.log('📌 Yassine Bounou in Database:');
    console.log(`   ID: ${player.id}`);
    console.log(`   Name: ${player.name}`);
    console.log(`   Current Team: ${player.team_name || 'NULL'}\n`);

    // Search API-Football
    console.log('🏟️  Searching API-Football...\n');
    const apiKey = process.env.API_FOOTBALL_KEY;
    const apiResponse = await fetch('https://v3.football-api.com/players/search?name=Yassine+Bounou', {
      headers: { 'x-apisports-key': apiKey }
    });
    const apiData = await apiResponse.json();

    if (apiData.response && apiData.response.length > 0) {
      const apiPlayer = apiData.response[0];
      console.log('✅ Yassine Bounou in API-Football:');
      console.log(`   Player ID: ${apiPlayer.player.id}`);
      console.log(`   Name: ${apiPlayer.player.name}`);
      console.log(`   Current Team: ${apiPlayer.statistics[0]?.team?.name}`);
      console.log(`   Team ID (API): ${apiPlayer.statistics[0]?.team?.id}`);
      console.log(`   League: ${apiPlayer.statistics[0]?.league?.name}\n`);

      // Check if this team is in our database
      const teamInDb = await query(
        'SELECT id, name, api_football_id FROM teams WHERE api_football_id = $1 OR id = $2',
        [apiPlayer.statistics[0]?.team?.id, apiPlayer.statistics[0]?.team?.id]
      );

      if (teamInDb.rows.length === 0) {
        console.log(`❌ ISSUE FOUND: Team "${apiPlayer.statistics[0]?.team?.name}" (API ID: ${apiPlayer.statistics[0]?.team?.id}) NOT found in our database`);
        console.log(`   But Bounou is assigned to: ${player.team_name}`);
      } else {
        console.log(`✅ Team found in our database:`, teamInDb.rows[0]);
        console.log(`   ERROR: Bounou assigned to wrong team! Should be: ${apiPlayer.statistics[0]?.team?.name}`);
      }
    } else {
      console.log('⚠️  Player not found in API-Football');
    }

    // Get sample of players and their teams
    console.log('\n\n📊 Sample of current player-team assignments:\n');
    const players = await query(
      'SELECT p.id, p.name, p.team_id, t.name as team_name FROM players p LEFT JOIN teams t ON p.team_id = t.id LIMIT 10'
    );

    players.rows.forEach(p => {
      console.log(`   ${p.name}: ${p.team_name || 'NO TEAM'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }

  process.exit(0);
}

diagnosePlayerMapping();
