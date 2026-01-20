import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, 'server', '.env') });

import { query } from './server/config/database.js';

async function checkDatabase() {
  try {
    const players = await query('SELECT COUNT(*) as total FROM players');
    const teams = await query('SELECT COUNT(*) as total FROM teams');
    const leagues = await query('SELECT COUNT(*) as total FROM leagues');
    
    console.log('\n📊 Database Status:');
    console.log(`  👥 Players: ${players.rows[0].total}`);
    console.log(`  ⚽ Teams: ${teams.rows[0].total}`);
    console.log(`  🏆 Leagues: ${leagues.rows[0].total}\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkDatabase();
