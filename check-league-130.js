import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './server/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, 'server', '.env') });

async function checkLeague() {
  try {
    // Check league 130
    const league130 = await db.query('SELECT * FROM leagues WHERE id = $1', ['130']);
    console.log('\n📋 League ID 130:');
    console.log(league130.rows.length > 0 ? league130.rows[0] : 'Not found');

    // Check what teams/players are in league 130
    const teams = await db.query('SELECT * FROM teams WHERE league_id = $1', ['130']);
    console.log('\n⚽ Teams in league 130:', teams.rows.length);
    
    const players = await db.query(`
      SELECT p.name, t.name as team FROM players p 
      JOIN teams t ON p.team_id = t.id 
      WHERE t.league_id = $1
    `, ['130']);
    console.log('👥 Players in league 130:', players.rows.length);
    
    // Check all leagues
    const all = await db.query('SELECT id, name FROM leagues ORDER BY id::int LIMIT 20');
    console.log('\n📊 All Leagues (first 20):');
    all.rows.forEach(l => console.log(`  ${l.id}: ${l.name}`));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.end();
  }
}

checkLeague();
