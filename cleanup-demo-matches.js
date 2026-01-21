import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, 'server', '.env') });

import { query } from './server/config/database.js';

async function cleanupDemoMatches() {
  console.log('🧹 Cleaning up non-API-Football matches...\n');

  try {
    // Find matches that don't have the 'af-' prefix (demo/test data)
    const demoMatches = await query(`
      SELECT id, home_team_id, away_team_id, kickoff_time 
      FROM matches 
      WHERE id NOT LIKE 'af-%'
    `);

    console.log(`Found ${demoMatches.rows.length} non-API-Football matches:\n`);
    
    for (const match of demoMatches.rows) {
      console.log(`  - ID: ${match.id}, Home: ${match.home_team_id}, Away: ${match.away_team_id}, Date: ${match.kickoff_time}`);
    }

    if (demoMatches.rows.length > 0) {
      console.log('\n🗑️  Deleting these demo matches...');
      
      const result = await query(`
        DELETE FROM matches 
        WHERE id NOT LIKE 'af-%'
      `);

      console.log(`✅ Deleted ${demoMatches.rows.length} demo matches\n`);
    } else {
      console.log('\n✅ No demo matches found - database is clean!\n');
    }

    // Show remaining match count
    const remaining = await query('SELECT COUNT(*) as total FROM matches');
    console.log(`📊 Remaining matches from API-Football: ${remaining.rows[0].total}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanupDemoMatches();
