import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load server environment variables
dotenv.config({ path: path.join(__dirname, 'server', '.env') });

import { 
  fetchMoroccanPlayersFromWikidata, 
  syncPlayersToDatabase 
} from './server/services/wikidataService.js';

async function quickSync() {
  console.log('🚀 Quick Wikidata sync (single batch)...\n');

  try {
    // Fetch just one batch (200 players)
    const wikidataPlayers = await fetchMoroccanPlayersFromWikidata(0);
    console.log(`✅ Found ${wikidataPlayers.length} players\n`);

    // Sync to database (auto-creates teams and leagues)
    const results = await syncPlayersToDatabase(wikidataPlayers);
    
    console.log('\n📈 Sync Results:');
    console.log(`  ✅ Added: ${results.added} new players`);
    console.log(`  🔄 Updated: ${results.updated} existing players`);
    console.log(`  ⏭️  Skipped: ${results.skipped} players`);

    console.log('\n✅ Quick sync completed successfully!');
    console.log('\n💡 Tip: Run "node sync-wikidata.js" for full sync with all players');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Sync failed:', error.message);
    process.exit(1);
  }
}

quickSync();
