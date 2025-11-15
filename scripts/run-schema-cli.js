#!/usr/bin/env node

/**
 * Execute Supabase schema using Supabase CLI
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://acsbqayfnrazspwuhyep.supabase.co';
const projectRef = 'acsbqayfnrazspwuhyep';
const schemaPath = path.join(__dirname, '../supabase-schema.sql');

console.log('🚀 Using Supabase CLI to execute schema...\n');

// Check if project is linked
function isLinked() {
  try {
    const configPath = path.join(__dirname, '../supabase/.temp/project-ref');
    if (fs.existsSync(configPath)) {
      const linkedRef = fs.readFileSync(configPath, 'utf8').trim();
      return linkedRef === projectRef;
    }
  } catch (error) {
    // Ignore
  }
  return false;
}

async function executeSchema() {
  try {
    // Step 1: Check if logged in
    console.log('🔐 Checking Supabase CLI authentication...\n');
    try {
      execSync('npx supabase projects list', { 
        stdio: 'pipe',
        cwd: path.join(__dirname, '..')
      });
      console.log('✅ Authenticated with Supabase CLI\n');
    } catch (error) {
      console.log('⚠️  Not authenticated. Please login first:\n');
      console.log('   Run: npx supabase login\n');
      console.log('   This will open your browser to authenticate.\n');
      throw new Error('Authentication required');
    }

    // Step 2: Link to Supabase project (if not already linked)
    if (!isLinked()) {
      console.log('🔗 Linking to Supabase project...');
      console.log(`   Project ref: ${projectRef}\n`);
      
      try {
        execSync(`npx supabase link --project-ref ${projectRef}`, {
          stdio: 'inherit',
          cwd: path.join(__dirname, '..')
        });
        console.log('✅ Project linked!\n');
      } catch (error) {
        console.log('⚠️  Link failed. You may need to run manually:');
        console.log(`   npx supabase link --project-ref ${projectRef}\n`);
        throw error;
      }
    } else {
      console.log('✅ Project already linked\n');
    }

    // Step 2: Execute SQL file
    console.log('📄 Executing schema...\n');
    
    execSync(`npx supabase db execute --file "${schemaPath}"`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    
    console.log('\n✅ Schema executed successfully!\n');
    console.log('📊 Database tables should now be created:');
    console.log('   - profiles');
    console.log('   - scans');
    console.log('   - wine_results');
    console.log('   - favorites');
    console.log('   - wine_cache\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 Alternative: Use the Supabase Dashboard SQL Editor');
    console.log(`   URL: https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);
    process.exit(1);
  }
}

executeSchema();

