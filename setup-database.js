import pg from 'pg';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const { Pool } = pg;

// Database configuration
const pool = new Pool({
  host: process.env.VITE_DB_HOST,
  port: parseInt(process.env.VITE_DB_PORT),
  database: process.env.VITE_DB_NAME,
  user: process.env.VITE_DB_USER,
  password: process.env.VITE_DB_PASSWORD,
  options: `-c search_path=${process.env.VITE_DB_SCHEMA},public`,
});

async function runSQLFile(filePath) {
  const client = await pool.connect();
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`📄 Running ${path.basename(filePath)}...`);
    await client.query(sql);
    console.log(`✅ Successfully executed ${path.basename(filePath)}\n`);
  } catch (error) {
    console.error(`❌ Error running ${path.basename(filePath)}:`, error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function setupDatabase() {
  try {
    console.log('🚀 Starting database setup...\n');

    // Run schema.sql
    await runSQLFile(path.join(__dirname, 'database', 'schema.sql'));

    // Run seed.sql
    await runSQLFile(path.join(__dirname, 'database', 'seed.sql'));

    // Verify tables
    const client = await pool.connect();
    const result = await client.query(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = $1 
       ORDER BY table_name`,
      [process.env.VITE_DB_SCHEMA]
    );

    console.log('📋 Tables created:');
    result.rows.forEach(row => console.log(`  ✓ ${row.table_name}`));
    console.log('');

    // Check data counts
    console.log('📊 Data inserted:');
    for (const table of result.rows) {
      const countResult = await client.query(
        `SELECT COUNT(*) FROM ${process.env.VITE_DB_SCHEMA}.${table.table_name}`
      );
      console.log(`  ${table.table_name}: ${countResult.rows[0].count} rows`);
    }

    client.release();
    console.log('\n✅ Database setup completed successfully!');
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
  } finally {
    await pool.end();
  }
}

setupDatabase();
