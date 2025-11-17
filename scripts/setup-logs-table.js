#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

console.log('\n📝 Logs Table Setup\n');
console.log('To enable production logging, run this SQL in your Supabase SQL Editor:');
console.log('https://supabase.com/dashboard/project/acsbqayfnrazspwuhyep/sql/new\n');

const sqlPath = path.join(__dirname, '../supabase/migrations/20251115T120000_add_logs_table.sql');
const sql = fs.readFileSync(sqlPath, 'utf-8');

console.log('─'.repeat(80));
console.log(sql);
console.log('─'.repeat(80));
console.log('\n✅ After running the SQL, you can query logs from the Supabase dashboard:');
console.log('   SELECT * FROM public.logs ORDER BY created_at DESC LIMIT 100;\n');
