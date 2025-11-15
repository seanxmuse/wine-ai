#!/usr/bin/env node

/**
 * Setup Supabase Storage Bucket
 * This script creates the wine-lists bucket and sets up RLS policies using Supabase Management API
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load .env file manually
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('   Required: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Extract project ref from URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
if (!projectRef) {
  console.error('❌ Invalid Supabase URL format');
  process.exit(1);
}

console.log('🚀 Setting up Supabase Storage Bucket...\n');
console.log(`📦 Project: ${projectRef}`);
console.log(`🔗 URL: ${supabaseUrl}\n`);

// Read the SQL file
const sqlPath = path.join(__dirname, 'create-storage-bucket.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

console.log('📝 SQL to execute:');
console.log('─'.repeat(60));
console.log(sql);
console.log('─'.repeat(60));
console.log('\n');

// Show manual instructions since we can't programmatically run the SQL without service role key
console.log('📋 MANUAL SETUP INSTRUCTIONS:');
console.log('\n1. Open your Supabase SQL Editor:');
console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new`);
console.log('\n2. Copy and paste the SQL shown above');
console.log('\n3. Click "Run" or press Cmd+Enter');
console.log('\n4. Verify the bucket was created:');
console.log(`   https://supabase.com/dashboard/project/${projectRef}/storage/buckets`);
console.log('\n   You should see a "wine-lists" bucket (private)');
console.log('\n');

// Alternative: Try to use the Supabase client to check/create bucket
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkBucket() {
  try {
    console.log('🔍 Checking if bucket exists...\n');

    // Try to list buckets (this might fail with anon key)
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      console.log('ℹ️  Cannot check buckets with anon key (expected)');
      console.log('   Please follow the manual instructions above.\n');
      return;
    }

    const wineListsBucket = buckets?.find(b => b.id === 'wine-lists');

    if (wineListsBucket) {
      console.log('✅ Bucket "wine-lists" already exists!');
      console.log('   Now you just need to ensure the RLS policies are set up.');
      console.log('   Run the SQL from the instructions above.\n');
    } else {
      console.log('❌ Bucket "wine-lists" does not exist yet.');
      console.log('   Please follow the manual instructions above to create it.\n');
    }
  } catch (error) {
    console.log('ℹ️  Cannot verify bucket status');
    console.log('   Please follow the manual instructions above.\n');
  }
}

checkBucket();
