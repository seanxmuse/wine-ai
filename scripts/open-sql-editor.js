#!/usr/bin/env node

/**
 * Opens Supabase SQL Editor and prepares SQL for execution
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const SUPABASE_URL = 'https://acsbqayfnrazspwuhyep.supabase.co';
const projectRef = 'acsbqayfnrazspwuhyep';
const sqlEditorUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;

const schemaPath = path.join(__dirname, '../supabase-schema.sql');
const sql = fs.readFileSync(schemaPath, 'utf8');

console.log('🚀 Opening Supabase SQL Editor...\n');
console.log(`📋 SQL Editor URL: ${sqlEditorUrl}\n`);

// Try to open browser
exec(`open "${sqlEditorUrl}"`, (error) => {
  if (error) {
    console.log('💡 Please manually open the URL above\n');
  } else {
    console.log('✅ Opened SQL Editor in your browser\n');
  }
});

console.log('📄 SQL Schema (copy this into the SQL Editor):');
console.log('═'.repeat(80));
console.log(sql);
console.log('═'.repeat(80));
console.log('\n💡 Instructions:');
console.log('   1. The SQL Editor should be open in your browser');
console.log('   2. Copy the SQL above');
console.log('   3. Paste it into the SQL Editor');
console.log('   4. Click "Run" to execute\n');




