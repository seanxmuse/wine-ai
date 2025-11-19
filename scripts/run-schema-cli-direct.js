#!/usr/bin/env node

/**
 * Execute Supabase schema using Supabase CLI with direct database connection
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://acsbqayfnrazspwuhyep.supabase.co';
const DB_PASSWORD = process.env.DB_PASSWORD || 'Wine!234';
const projectRef = 'acsbqayfnrazspwuhyep';
const schemaPath = path.join(__dirname, '../supabase-schema.sql');

console.log('🚀 Using Supabase CLI to execute schema...\n');

async function executeSchema() {
  try {
    // Read the SQL file
    const sql = fs.readFileSync(schemaPath, 'utf8');
    
    // Use supabase db execute with connection string
    // Format: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
    const connectionString = `postgresql://postgres:${encodeURIComponent(DB_PASSWORD)}@db.${projectRef}.supabase.co:5432/postgres`;
    
    console.log('📄 Executing schema via Supabase CLI...\n');
    console.log(`🔗 Connection: postgresql://postgres:***@db.${projectRef}.supabase.co:5432/postgres\n`);
    
    // Write SQL to temp file for supabase CLI
    const tempSqlPath = path.join(__dirname, '../.temp-schema.sql');
    fs.mkdirSync(path.dirname(tempSqlPath), { recursive: true });
    fs.writeFileSync(tempSqlPath, sql);
    
    try {
      // Try using supabase db execute with connection string
      execSync(`npx supabase db execute --file "${tempSqlPath}" --db-url "${connectionString}"`, {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      
      console.log('\n✅ Schema executed successfully!\n');
      
      // Cleanup
      fs.unlinkSync(tempSqlPath);
      
    } catch (error) {
      // Cleanup on error
      if (fs.existsSync(tempSqlPath)) {
        fs.unlinkSync(tempSqlPath);
      }
      
      // Try alternative: use psql via supabase CLI
      console.log('\n⚠️  Direct execution failed, trying alternative method...\n');
      
      // Use psql if available, or provide instructions
      throw error;
    }
    
  } catch (error) {
    console.error('\n❌ Error executing schema:', error.message);
    console.log('\n💡 Alternative methods:\n');
    console.log('1. Use Supabase Dashboard SQL Editor:');
    console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);
    console.log('2. Login to Supabase CLI first:');
    console.log('   npx supabase login');
    console.log(`   npx supabase link --project-ref ${projectRef}`);
    console.log(`   npx supabase db execute --file "${schemaPath}"\n`);
    process.exit(1);
  }
}

executeSchema();




