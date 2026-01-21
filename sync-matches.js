import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load server environment variables
dotenv.config({ path: path.join(__dirname, 'server', '.env') });

import { syncMoroccanPlayerFixtures } from './server/services/apiFootballService.js';

async function syncMatchesFromApiFootball() {
  console.log('⚽ Syncing matches from API-Football...\n');
  console.log('📋 This will fetch upcoming fixtures for all teams with Moroccan players\n');

  try {
    const results = await syncMoroccanPlayerFixtures();
    
    console.log('\n✅ Match sync completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   Total fixtures: ${results.totalMatches}`);
    console.log(`   ✅ New matches: ${results.addedMatches}`);
    console.log(`   🔄 Updated matches: ${results.updatedMatches}`);
    
    console.log('\n💡 Tip: Run this script regularly to keep match data up to date');
    console.log('💡 You can also set up a cron job to run this automatically');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Match sync failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

syncMatchesFromApiFootball();
