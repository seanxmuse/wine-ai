#!/usr/bin/env node

/**
 * Attempts to run Supabase schema via REST API
 * Falls back to instructions if API execution is not available
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://acsbqayfnrazspwuhyep.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  console.error('❌ Error: EXPO_PUBLIC_SUPABASE_ANON_KEY not found');
  process.exit(1);
}

const schemaPath = path.join(__dirname, '../supabase-schema.sql');
const sql = fs.readFileSync(schemaPath, 'utf8');

console.log('🚀 Attempting to execute Supabase schema...\n');

// Try to execute via Supabase REST API
// Note: This typically requires service role key, but we'll try with anon key
async function executeSchema() {
  try {
    // Supabase doesn't expose a public SQL execution endpoint
    // We need to use the Dashboard SQL Editor or service role key
    console.log('⚠️  Direct SQL execution via REST API requires service role key.');
    console.log('   The anon key doesn\'t have permission to execute SQL.\n');
    
    console.log('📋 Please run the schema using one of these methods:\n');
    
    console.log('✅ Method 1: Supabase Dashboard (Easiest)');
    console.log('   1. Open: https://supabase.com/dashboard/project/acsbqayfnrazspwuhyep/sql/new');
    console.log('   2. Copy the SQL from: supabase-schema.sql');
    console.log('   3. Paste and click "Run"\n');
    
    console.log('✅ Method 2: Using curl with Service Role Key');
    console.log('   (If you have SUPABASE_SERVICE_ROLE_KEY in .env)');
    
    // Check if service role key exists
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceRoleKey) {
      console.log('\n🔑 Service role key found! Attempting execution...\n');
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`
        },
        body: JSON.stringify({ sql })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Schema executed successfully!');
        console.log(result);
        return;
      } else {
        console.log(`❌ API call failed: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.log(`Error: ${errorText}\n`);
      }
    }
    
    // Fallback: Show instructions
    console.log('\n📄 Schema file ready at:');
    console.log(`   ${path.resolve(schemaPath)}\n`);
    
    console.log('💡 Tip: The easiest way is to use the Supabase Dashboard SQL Editor');
    console.log('   Direct link: https://supabase.com/dashboard/project/acsbqayfnrazspwuhyep/sql/new\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📋 Please use the Supabase Dashboard SQL Editor instead.');
  }
}

executeSchema();




