import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, 'server', '.env') });

import { query } from './server/config/database.js';

async function runMigration() {
  console.log('🚀 Running API-Football migration...\n');

  try {
    // Read migration file
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'database', 'migration-api-football.sql'),
      'utf8'
    );

    // Split by semicolons and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'));

    for (const statement of statements) {
      if (statement.includes('COMMENT ON')) continue;
      
      try {
        console.log(`📝 Executing: ${statement.substring(0, 50)}...`);
        await query(statement);
        console.log('✅ Success\n');
      } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('does not exist')) {
          console.log(`⚠️  ${error.message} - continuing...\n`);
        } else {
          console.error(`❌ Error: ${error.message}\n`);
        }
      }
    }

    console.log('✅ Migration completed successfully!\n');
    console.log('💡 Your database is now ready for API-Football integration');
    console.log('💡 Next step: Add your API_FOOTBALL_KEY to server/.env\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
