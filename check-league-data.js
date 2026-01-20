import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './server/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, 'server', '.env') });

async function checkLeagueData() {
  try {
    // Get some leagues with their player counts
    const leagues = await db.query(`
      SELECT 
        l.id,
        l.name,
        l.short_name,
        COUNT(p.id) as player_count
      FROM leagues l
      LEFT JOIN teams t ON t.league_id = l.id
      LEFT JOIN players p ON p.team_id = t.id
      GROUP BY l.id
      ORDER BY player_count DESC
      LIMIT 10
    `);

    console.log('\n📊 Top 10 Leagues by Player Count:\n');
    leagues.rows.forEach(league => {
      console.log(`ID: ${league.id} (${typeof league.id})`);
      console.log(`Name: ${league.name}`);
      console.log(`Players: ${league.player_count}`);
      console.log('---');
    });

    // Test query with league filter
    if (leagues.rows.length > 0) {
      const testLeagueId = leagues.rows[0].id;
      console.log(`\n🔍 Testing filter with league ID: ${testLeagueId}\n`);
      
      const filteredPlayers = await db.query(`
        SELECT 
          p.name,
          t.name as team_name,
          l.name as league_name,
          l.id as league_id
        FROM players p
        LEFT JOIN teams t ON p.team_id = t.id
        LEFT JOIN leagues l ON t.league_id = l.id
        WHERE p.nationality = 'Morocco' AND l.id = $1
        LIMIT 5
      `, [testLeagueId]);

      console.log(`Found ${filteredPlayers.rows.length} players in ${leagues.rows[0].name}:`);
      filteredPlayers.rows.forEach(p => {
        console.log(`  - ${p.name} (${p.team_name})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.end();
  }
}

checkLeagueData();
