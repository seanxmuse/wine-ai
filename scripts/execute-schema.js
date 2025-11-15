#!/usr/bin/env node

/**
 * Execute Supabase schema via REST API
 * Uses service role key if available, otherwise provides Dashboard link
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://acsbqayfnrazspwuhyep.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const schemaPath = path.join(__dirname, '../supabase-schema.sql');
const sql = fs.readFileSync(schemaPath, 'utf8');

async function executeSchema() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.log('⚠️  Service role key not found in .env file\n');
    console.log('📋 To execute the schema, you have two options:\n');
    console.log('Option 1: Add service role key to .env');
    console.log('   1. Get your service role key from:');
    console.log('      https://supabase.com/dashboard/project/acsbqayfnrazspwuhyep/settings/api');
    console.log('   2. Add to .env: SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
    console.log('   3. Run this script again\n');
    console.log('Option 2: Use Supabase Dashboard (Recommended)');
    console.log('   1. Open: https://supabase.com/dashboard/project/acsbqayfnrazspwuhyep/sql/new');
    console.log('   2. Copy SQL from: supabase-schema.sql');
    console.log('   3. Paste and click "Run"\n');
    return;
  }

  console.log('🚀 Executing schema via Supabase API...\n');
  
  try {
    // Supabase doesn't have a direct SQL execution endpoint via REST API
    // We need to use the Dashboard or Supabase CLI
    // However, we can try using the Management API if available
    
    console.log('❌ Supabase REST API doesn\'t support direct SQL execution.');
    console.log('   SQL execution must be done via:\n');
    console.log('   1. Supabase Dashboard SQL Editor');
    console.log('   2. Supabase CLI (supabase db push)');
    console.log('   3. Direct PostgreSQL connection\n');
    
    console.log('📋 Opening instructions...\n');
    console.log('✅ Quick Link: https://supabase.com/dashboard/project/acsbqayfnrazspwuhyep/sql/new\n');
    
    // Try to open browser (macOS)
    const { exec } = require('child_process');
    exec(`open "https://supabase.com/dashboard/project/acsbqayfnrazspwuhyep/sql/new"`, (error) => {
      if (error) {
        console.log('💡 Please manually open the link above\n');
      } else {
        console.log('🌐 Opened Supabase Dashboard in your browser\n');
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

executeSchema();

