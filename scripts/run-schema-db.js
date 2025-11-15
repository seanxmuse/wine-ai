#!/usr/bin/env node

/**
 * Execute Supabase schema directly via PostgreSQL connection
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Load environment variables
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://acsbqayfnrazspwuhyep.supabase.co';
const DB_PASSWORD = process.env.DB_PASSWORD || 'Wine!234';

// Extract project ref from URL
const projectRef = SUPABASE_URL.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1] || 'acsbqayfnrazspwuhyep';

// Supabase PostgreSQL connection string
// Try direct connection format
const connectionString = `postgresql://postgres:${encodeURIComponent(DB_PASSWORD)}@db.${projectRef}.supabase.co:5432/postgres`;

const schemaPath = path.join(__dirname, '../supabase-schema.sql');
const sql = fs.readFileSync(schemaPath, 'utf8');

async function executeSchema() {
  // Try multiple connection formats
  const connectionConfigs = [
    {
      name: 'Direct connection (port 5432)',
      config: {
        host: `db.${projectRef}.supabase.co`,
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: DB_PASSWORD,
        ssl: { rejectUnauthorized: false }
      }
    },
    {
      name: 'Pooler connection (port 6543)',
      config: {
        host: `aws-0-us-west-1.pooler.supabase.com`,
        port: 6543,
        database: 'postgres',
        user: `postgres.${projectRef}`,
        password: DB_PASSWORD,
        ssl: { rejectUnauthorized: false }
      }
    },
    {
      name: 'Alternative pooler format',
      config: {
        host: `db.${projectRef}.supabase.co`,
        port: 6543,
        database: 'postgres',
        user: `postgres.${projectRef}`,
        password: DB_PASSWORD,
        ssl: { rejectUnauthorized: false }
      }
    }
  ];

  let lastError = null;
  
  for (const { name, config } of connectionConfigs) {
    console.log(`🔌 Trying: ${name}...`);
    const client = new Client(config);
    
    try {
      await client.connect();
      console.log(`✅ Connected using: ${name}\n`);
      
      await executeSQL(client, sql);
      await client.end();
      return; // Success!
    } catch (error) {
      lastError = error;
      console.log(`❌ Failed: ${error.message}\n`);
      try {
        await client.end();
      } catch {}
    }
  }
  
  // If all connections failed, show error and instructions
  console.error('❌ All connection attempts failed!\n');
  console.error(`Last error: ${lastError?.message}\n`);
  throw lastError || new Error('Could not connect to database');
}

async function executeSQL(client, sql) {

  console.log('📄 Executing schema...\n');
  
  // Execute the entire SQL file
  await client.query(sql);
  
  console.log('✅ Schema executed successfully!\n');
  console.log('📊 Database tables created:');
  console.log('   - profiles');
  console.log('   - scans');
  console.log('   - wine_results');
  console.log('   - favorites');
  console.log('   - wine_cache');
  console.log('\n🔒 Row Level Security policies configured');
  console.log('⚡ Triggers and functions created\n');
  
  // Verify tables were created
  const result = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);
  
  console.log('📋 Created tables:');
  result.rows.forEach(row => {
    console.log(`   ✓ ${row.table_name}`);
  });
  
  console.log('\n🔌 Database connection closed');
}

executeSchema();

