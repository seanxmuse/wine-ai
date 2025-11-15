#!/usr/bin/env node

/**
 * Execute Supabase schema by creating a migration and pushing it
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRef = 'acsbqayfnrazspwuhyep';
const schemaPath = path.join(__dirname, '../supabase-schema.sql');
const migrationsDir = path.join(__dirname, '../supabase/migrations');

console.log('🚀 Creating migration and pushing schema...\n');

async function executeSchema() {
  try {
    // Ensure migrations directory exists
    fs.mkdirSync(migrationsDir, { recursive: true });
    
    // Read the schema
    const sql = fs.readFileSync(schemaPath, 'utf8');
    
    // Create migration file with timestamp
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
    const migrationFile = path.join(migrationsDir, `${timestamp}_initial_schema.sql`);
    
    fs.writeFileSync(migrationFile, sql);
    console.log(`✅ Created migration: ${path.basename(migrationFile)}\n`);
    
    // Load password from env
    const envPath = path.join(__dirname, '../.env');
    let DB_PASSWORD = 'Wine!234';
    if (fs.existsSync(envPath)) {
      require('dotenv').config({ path: envPath });
      DB_PASSWORD = process.env.DB_PASSWORD || DB_PASSWORD;
    }
    
    // Push migration using database URL directly (no linking required)
    console.log('📤 Pushing migration to Supabase...\n');
    console.log('   Using direct database connection (no authentication required)\n');
    
    // Use db-url flag to push directly without linking
    const dbUrl = `postgresql://postgres:${encodeURIComponent(DB_PASSWORD)}@db.${projectRef}.supabase.co:5432/postgres`;
    
    execSync(`npx supabase db push --db-url "${dbUrl}"`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    
    console.log('\n✅ Schema pushed successfully!\n');
    console.log('📊 Database tables created:');
    console.log('   - profiles');
    console.log('   - scans');
    console.log('   - wine_results');
    console.log('   - favorites');
    console.log('   - wine_cache\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 Manual steps:\n');
    console.log('1. Login to Supabase CLI:');
    console.log('   npx supabase login\n');
    console.log('2. Link your project:');
    console.log(`   npx supabase link --project-ref ${projectRef}\n`);
    console.log('3. Push the migration:');
    console.log('   npx supabase db push\n');
    console.log('Or use the Dashboard SQL Editor:');
    console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);
    process.exit(1);
  }
}

executeSchema();

