import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, 'server', '.env') });

import { query } from './server/config/database.js';

async function checkTeam(teamName) {
  try {
    const result = await query(`
      SELECT t.*, l.name as league_name, l.country as league_country
      FROM teams t
      LEFT JOIN leagues l ON t.league_id = l.id
      WHERE t.name ILIKE $1 OR t.short_name ILIKE $1
    `, [`%${teamName}%`]);
    
    if (result.rows.length > 0) {
      console.log(`\n✅ Found ${result.rows.length} team(s):\n`);
      result.rows.forEach(team => {
        console.log(`⚽ Name: ${team.name}`);
        console.log(`   Short Name: ${team.short_name}`);
        console.log(`   League: ${team.league_name || 'No league'}`);
        console.log(`   Country: ${team.league_country || 'N/A'}`);
        console.log(`   ID: ${team.id}\n`);
      });
    } else {
      console.log(`\n❌ Team "${teamName}" not found in database\n`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

const teamName = process.argv[2] || 'Moghreb';
checkTeam(teamName);
