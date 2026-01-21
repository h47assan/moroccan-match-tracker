import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, 'server', '.env') });

import { query } from './server/config/database.js';

async function addApiFootballColumns() {
  console.log('🔧 Adding API-Football ID columns...\n');

  try {
    // Add api_football_id to leagues
    console.log('📝 Adding api_football_id to leagues table...');
    try {
      await query('ALTER TABLE leagues ADD COLUMN api_football_id INTEGER UNIQUE');
      console.log('✅ Added api_football_id to leagues\n');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Column already exists in leagues\n');
      } else {
        throw error;
      }
    }

    // Add api_football_id to teams
    console.log('📝 Adding api_football_id to teams table...');
    try {
      await query('ALTER TABLE teams ADD COLUMN api_football_id INTEGER UNIQUE');
      console.log('✅ Added api_football_id to teams\n');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Column already exists in teams\n');
      } else {
        throw error;
      }
    }

    // Add api_football_id to matches
    console.log('📝 Adding api_football_id to matches table...');
    try {
      await query('ALTER TABLE matches ADD COLUMN api_football_id INTEGER UNIQUE');
      console.log('✅ Added api_football_id to matches\n');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Column already exists in matches\n');
      } else {
        throw error;
      }
    }

    // Update matches status constraint to include 'cancelled'
    console.log('📝 Updating matches status constraint...');
    try {
      await query('ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_status_check');
      await query("ALTER TABLE matches ADD CONSTRAINT matches_status_check CHECK (status IN ('scheduled', 'live', 'finished', 'cancelled'))");
      console.log('✅ Updated status constraint\n');
    } catch (error) {
      console.log('⚠️  Status constraint update: ' + error.message + '\n');
    }

    // Create indexes
    console.log('📝 Creating indexes...');
    await query('CREATE INDEX IF NOT EXISTS idx_leagues_api_football_id ON leagues(api_football_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_teams_api_football_id ON teams(api_football_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_matches_api_football_id ON matches(api_football_id)');
    console.log('✅ Indexes created\n');

    console.log('✅ Database migration completed successfully!\n');
    console.log('💡 Your database is now ready for API-Football integration');
    console.log('💡 Next steps:');
    console.log('   1. Get your API key from https://www.api-football.com/');
    console.log('   2. Add API_FOOTBALL_KEY to server/.env');
    console.log('   3. Run: npm run sync:matches\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

addApiFootballColumns();
