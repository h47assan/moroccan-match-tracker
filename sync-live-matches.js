import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load server environment variables
dotenv.config({ path: path.join(__dirname, 'server', '.env') });

import { getLiveFixtures } from './server/services/apiFootballService.js';
import { query } from './server/config/database.js';

async function syncLiveMatches() {
  console.log('🔴 Fetching live matches from API-Football...\n');

  try {
    const liveFixtures = await getLiveFixtures();
    
    if (liveFixtures.length === 0) {
      console.log('📭 No live matches at the moment');
      process.exit(0);
    }

    console.log(`🎮 Found ${liveFixtures.length} live matches\n`);

    let updatedCount = 0;

    for (const fixture of liveFixtures) {
      const fixtureId = `af-${fixture.fixture.id}`;
      
      // Check if this match is in our database
      const matchResult = await query(
        'SELECT id FROM matches WHERE api_football_id = $1',
        [fixture.fixture.id]
      );

      if (matchResult.rows.length > 0) {
        // Update the match status and score
        await query(`
          UPDATE matches 
          SET status = $1, home_score = $2, away_score = $3, 
              updated_at = CURRENT_TIMESTAMP
          WHERE api_football_id = $4
        `, [
          'live',
          fixture.goals.home,
          fixture.goals.away,
          fixture.fixture.id
        ]);

        console.log(`✅ Updated: ${fixture.teams.home.name} ${fixture.goals.home} - ${fixture.goals.away} ${fixture.teams.away.name}`);
        updatedCount++;
      }
    }

    console.log(`\n📊 Updated ${updatedCount} live matches in database`);
    console.log('\n💡 Tip: Run this script every few minutes to track live match updates');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Live match sync failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

syncLiveMatches();
