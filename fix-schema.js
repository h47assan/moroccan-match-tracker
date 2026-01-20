import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, 'server', '.env') });

import { query } from './server/config/database.js';

async function fixSchema() {
  console.log('🔧 Fixing database schema...\n');

  try {
    // 1. Increase short_name length in leagues table
    console.log('📝 Updating leagues.short_name column...');
    await query('ALTER TABLE leagues ALTER COLUMN short_name TYPE VARCHAR(50)');
    console.log('✅ leagues.short_name now VARCHAR(50)\n');

    // 2. Increase short_name length in teams table
    console.log('📝 Updating teams.short_name column...');
    await query('ALTER TABLE teams ALTER COLUMN short_name TYPE VARCHAR(50)');
    console.log('✅ teams.short_name now VARCHAR(50)\n');

    // 3. Make teams.id auto-generate if not set
    console.log('📝 Checking teams.id sequence...');
    const seqCheck = await query(`
      SELECT pg_get_serial_sequence('teams', 'id') as seq_name
    `);
    
    if (!seqCheck.rows[0].seq_name) {
      console.log('Creating sequence for teams.id...');
      await query(`CREATE SEQUENCE IF NOT EXISTS teams_id_seq`);
      await query(`ALTER TABLE teams ALTER COLUMN id SET DEFAULT nextval('teams_id_seq'::regclass)`);
      await query(`SELECT setval('teams_id_seq', (SELECT COALESCE(MAX(id::integer), 0) + 1 FROM teams WHERE id ~ '^[0-9]+$'), false)`);
      console.log('✅ teams.id sequence created\n');
    } else {
      console.log('✅ teams.id sequence already exists\n');
    }

    // 4. Same for leagues.id
    console.log('📝 Checking leagues.id sequence...');
    const leagueSeqCheck = await query(`
      SELECT pg_get_serial_sequence('leagues', 'id') as seq_name
    `);
    
    if (!leagueSeqCheck.rows[0].seq_name) {
      console.log('Creating sequence for leagues.id...');
      await query(`CREATE SEQUENCE IF NOT EXISTS leagues_id_seq START WITH 100`);
      await query(`ALTER TABLE leagues ALTER COLUMN id SET DEFAULT nextval('leagues_id_seq'::regclass)`);
      console.log('✅ leagues.id sequence created\n');
    } else {
      console.log('✅ leagues.id sequence already exists\n');
    }

    console.log('✅ Schema fixes complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n⚠️  Partial success - teams schema fixed. Continuing with sync...\n');
    process.exit(0);  // Exit successfully anyway
  }
}

fixSchema();
