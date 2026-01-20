import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './server/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, 'server', '.env') });

async function debugLeague() {
  try {
    // Check Danish Superliga teams and players
    console.log('\n🔍 Danish Superliga (ID: 130):\n');
    
    const teams = await db.query(`
      SELECT id, name FROM teams WHERE league_id = '130'
    `);
    console.log('Teams:', teams.rows);
    
    for (const team of teams.rows) {
      const players = await db.query(`
        SELECT id, name, team_id FROM players WHERE team_id = $1
      `, [team.id]);
      console.log(`\nPlayers in ${team.name}:`, players.rows);
    }
    
    // Check if there are players that should be in Danish Superliga
    const allPlayers = await db.query(`
      SELECT p.id, p.name, p.team_id, t.name as team_name, l.name as league_name
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.id
      LEFT JOIN leagues l ON t.league_id = l.id
      WHERE l.id = '130' OR t.league_id = '130'
    `);
    console.log('\n📊 All players query result:', allPlayers.rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.end();
  }
}

debugLeague();
