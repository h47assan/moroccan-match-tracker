import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './server/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'server', '.env') });

async function updatePlayerTeam() {
  try {
    // Update Anas Jabroun with team ID 26 (Moghreb Atlético Tetuán)
    const result = await db.query(
      `UPDATE players 
       SET team_id = $1 
       WHERE name = $2 
       RETURNING *`,
      [26, 'Anas Jabroun']
    );

    if (result.rows.length > 0) {
      console.log('✅ Successfully updated player:');
      console.log('   Name:', result.rows[0].name);
      console.log('   Team ID:', result.rows[0].team_id);
      console.log('   Position:', result.rows[0].position);
    } else {
      console.log('❌ Player not found');
    }

    // Verify the update
    const verify = await db.query(
      `SELECT p.*, t.name as team_name, l.name as league_name
       FROM players p
       LEFT JOIN teams t ON p.team_id = t.id
       LEFT JOIN leagues l ON t.league_id = l.id
       WHERE p.name = $1`,
      ['Anas Jabroun']
    );

    if (verify.rows.length > 0) {
      console.log('\n📋 Verification:');
      console.log('   Name:', verify.rows[0].name);
      console.log('   Team:', verify.rows[0].team_name || 'No team');
      console.log('   League:', verify.rows[0].league_name || 'N/A');
    }

  } catch (error) {
    console.error('❌ Error updating player:', error);
  } finally {
    await db.end();
  }
}

updatePlayerTeam();
