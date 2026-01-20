import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load server environment variables
dotenv.config({ path: path.join(__dirname, 'server', '.env') });

import { 
  fetchAllMoroccanPlayers, 
  syncPlayersToDatabase,
  linkPlayersToTeams 
} from './server/services/wikidataService.js';

async function syncWikidataPlayers() {
  console.log('🚀 Starting Wikidata sync...\n');

  try {
    // Step 1: Fetch ALL players from Wikidata with pagination
    const wikidataPlayers = await fetchAllMoroccanPlayers();
    console.log(`✅ Found ${wikidataPlayers.length} unique players\n`);

    // Step 2: Sync to database (auto-creates teams and leagues)
    const syncResults = await syncPlayersToDatabase(wikidataPlayers);
    
    console.log('\n📈 Sync Results:');
    console.log(`  ✅ Added: ${syncResults.added} new players`);
    console.log(`  🔄 Updated: ${syncResults.updated} existing players`);
    console.log(`  ⏭️  Skipped: ${syncResults.skipped} players\n`);

    // Step 3: Link players to teams
    console.log('🔗 Linking players to teams...');
    const linked = await linkPlayersToTeams();
    console.log(`  ✅ Linked ${linked} players to teams\n`);

    console.log('✅ Wikidata sync completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  }
}

syncWikidataPlayers();
