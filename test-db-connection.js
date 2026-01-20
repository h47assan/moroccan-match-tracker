import pg from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Pool } = pg;

// Database configuration
const pool = new Pool({
  host: process.env.VITE_DB_HOST || 'localhost',
  port: parseInt(process.env.VITE_DB_PORT || '5432'),
  database: process.env.VITE_DB_NAME || 'master_hub',
  user: process.env.VITE_DB_USER || 'postgres',
  password: process.env.VITE_DB_PASSWORD,
  options: `-c search_path=${process.env.VITE_DB_SCHEMA || 'moroccan_match_tracker'},public`,
});

async function testConnection() {
  try {
    console.log('🔄 Testing database connection...\n');
    console.log('Configuration:');
    console.log(`  Host: ${process.env.VITE_DB_HOST}`);
    console.log(`  Port: ${process.env.VITE_DB_PORT}`);
    console.log(`  Database: ${process.env.VITE_DB_NAME}`);
    console.log(`  User: ${process.env.VITE_DB_USER}`);
    console.log(`  Schema: ${process.env.VITE_DB_SCHEMA}\n`);

    // Test connection
    const client = await pool.connect();
    console.log('✅ Successfully connected to PostgreSQL!\n');

    // Test schema exists
    const schemaCheck = await client.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`,
      [process.env.VITE_DB_SCHEMA]
    );

    if (schemaCheck.rows.length > 0) {
      console.log(`✅ Schema '${process.env.VITE_DB_SCHEMA}' exists\n`);
    } else {
      console.log(`❌ Schema '${process.env.VITE_DB_SCHEMA}' not found\n`);
    }

    // Check tables in schema
    const tablesCheck = await client.query(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = $1 
       ORDER BY table_name`,
      [process.env.VITE_DB_SCHEMA]
    );

    if (tablesCheck.rows.length > 0) {
      console.log('📋 Tables found in schema:');
      tablesCheck.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
      console.log('');
    } else {
      console.log('⚠️  No tables found. Run schema.sql to create tables.\n');
    }

    // Check data counts
    if (tablesCheck.rows.length > 0) {
      console.log('📊 Data counts:');
      for (const table of tablesCheck.rows) {
        const countResult = await client.query(
          `SELECT COUNT(*) FROM ${process.env.VITE_DB_SCHEMA}.${table.table_name}`
        );
        console.log(`  ${table.table_name}: ${countResult.rows[0].count} rows`);
      }
      console.log('');
    }

    client.release();
    console.log('✅ Connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
  } finally {
    await pool.end();
  }
}

testConnection();
