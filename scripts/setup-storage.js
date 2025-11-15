#!/usr/bin/env node

/**
 * Setup Supabase Storage Bucket
 * This script creates the wine-lists bucket and sets up RLS policies
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You'll need to add this to .env

if (!supabaseUrl) {
  console.error('❌ EXPO_PUBLIC_SUPABASE_URL not found in .env');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env');
  console.error('📝 Get your service role key from: https://supabase.com/dashboard/project/_/settings/api');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorage() {
  console.log('🚀 Setting up Supabase Storage...\n');

  // Read the SQL file
  const sqlPath = path.join(__dirname, 'create-storage-bucket.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  try {
    // Execute the SQL
    console.log('📦 Creating wine-lists bucket and policies...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('❌ Error creating bucket:', error);
      console.log('\n💡 Manual setup required:');
      console.log('1. Go to: https://supabase.com/dashboard/project/_/storage/buckets');
      console.log('2. Click "New bucket"');
      console.log('3. Name: wine-lists');
      console.log('4. Public: OFF (keep private)');
      console.log('5. Then go to Storage > Policies and run the SQL from scripts/create-storage-bucket.sql');
      return;
    }

    console.log('✅ Storage bucket and policies created successfully!');
    console.log('\n📋 Bucket details:');
    console.log('  - Name: wine-lists');
    console.log('  - Public: false (private)');
    console.log('  - Policies: Users can only access their own images');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Manual setup instructions:');
    console.log('1. Open Supabase Dashboard: https://supabase.com/dashboard');
    console.log('2. Go to Storage > Buckets');
    console.log('3. Create new bucket named "wine-lists" (private)');
    console.log('4. Go to Storage > Policies');
    console.log('5. Run the SQL from: scripts/create-storage-bucket.sql');
  }
}

setupStorage();
