#!/usr/bin/env node

/**
 * Script to run Supabase schema
 * 
 * This script attempts to execute the SQL schema via Supabase REST API.
 * Note: You may need to use the Supabase Dashboard SQL Editor if this fails
 * due to permissions (requires service role key for API execution).
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://acsbqayfnrazspwuhyep.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  console.error('❌ Error: EXPO_PUBLIC_SUPABASE_ANON_KEY not found in .env file');
  process.exit(1);
}

// Read the schema file
const schemaPath = path.join(__dirname, '../supabase-schema.sql');
const sql = fs.readFileSync(schemaPath, 'utf8');

console.log('📄 Schema file loaded');
console.log(`🔗 Connecting to: ${SUPABASE_URL}`);
console.log('');

// Split SQL into individual statements (basic splitting by semicolon)
// Note: This is a simple approach - complex SQL with semicolons in strings may need manual execution
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

console.log(`📊 Found ${statements.length} SQL statements`);
console.log('');

// Note: Supabase REST API doesn't support direct SQL execution with anon key
// This would require the service role key or using the Dashboard
console.log('⚠️  Direct SQL execution via API requires service role key.');
console.log('');
console.log('📋 To run the schema:');
console.log('');
console.log('Option 1: Use Supabase Dashboard (Recommended)');
console.log('  1. Go to https://supabase.com/dashboard');
console.log('  2. Select your project');
console.log('  3. Go to SQL Editor');
console.log('  4. Copy and paste the contents of supabase-schema.sql');
console.log('  5. Click "Run"');
console.log('');
console.log('Option 2: Use Supabase CLI');
console.log('  1. Install: npm install -g supabase');
console.log('  2. Login: supabase login');
console.log('  3. Link: supabase link --project-ref acsbqayfnrazspwuhyep');
console.log('  4. Run: supabase db push');
console.log('');
console.log('📄 Schema file location:');
console.log(`   ${schemaPath}`);
console.log('');
console.log('📋 First 500 characters of schema:');
console.log('─'.repeat(60));
console.log(sql.substring(0, 500) + '...');
console.log('─'.repeat(60));




