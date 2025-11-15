#!/bin/bash

# Quick script to open SQL Editor and copy schema

echo "🚀 Opening Supabase SQL Editor..."
open "https://supabase.com/dashboard/project/acsbqayfnrazspwuhyep/sql/new"

echo ""
echo "📋 Copying SQL to clipboard..."
cat "$(dirname "$0")/../supabase-schema.sql" | pbcopy

echo ""
echo "✅ Done! The SQL Editor is open and the schema is in your clipboard."
echo ""
echo "Next steps:"
echo "1. Paste the SQL (Cmd+V) into the SQL Editor"
echo "2. Click 'Run' to execute"
echo ""

