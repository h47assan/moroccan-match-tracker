import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, 'server', '.env') });

import { query } from './server/config/database.js';

async function lookupPlayer(name) {
  try {
    const result = await query(`
      SELECT 
        p.*,
        t.name as team_name,
        l.name as league_name,
        l.country as league_country
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.id
      LEFT JOIN leagues l ON t.league_id = l.id
      WHERE p.name ILIKE $1
    `, [`%${name}%`]);
    
    if (result.rows.length > 0) {
      console.log(`\n✅ Found ${result.rows.length} player(s):\n`);
      result.rows.forEach(player => {
        console.log(`📋 Name: ${player.name}`);
        console.log(`   Position: ${player.position}`);
        console.log(`   Team: ${player.team_name || 'No team'}`);
        console.log(`   League: ${player.league_name || 'N/A'} ${player.league_country ? `(${player.league_country})` : ''}`);
        console.log(`   Date of Birth: ${player.date_of_birth || 'N/A'}`);
        console.log(`   Image: ${player.image_url || 'No image'}`);
        console.log(`   Wikidata ID: ${player.id}\n`);
      });
    } else {
      console.log(`\n❌ Player "${name}" not found in database\n`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

const playerName = process.argv[2] || 'Anas Jabroun';
lookupPlayer(playerName);
