import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './server/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, 'server', '.env') });

async function checkSchema() {
  try {
    const result = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'moroccan_match_tracker' 
      AND table_name = 'leagues'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Leagues Table Schema:\n');
    result.rows.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.end();
  }
}

checkSchema();
