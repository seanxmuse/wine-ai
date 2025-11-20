# Fix Chat Tables Error

## Problem
The deployed app is showing errors because the chat tables don't exist in your Supabase database:
```
Could not find the table 'public.chat_conversations' in the schema cache
```

## Solution
Run the chat tables migration in your Supabase database.

## Quick Fix (Recommended)

### Option 1: Supabase Dashboard SQL Editor (Easiest)

1. **Go to Supabase SQL Editor**:
   - Visit: https://supabase.com/dashboard/project/acsbqayfnrazspwuhyep/sql/new
   - Or: Dashboard → SQL Editor → New Query

2. **Copy the migration SQL**:
   - Open: `supabase/migrations/20250117_add_chat_tables.sql`
   - Copy ALL the contents

3. **Paste and Run**:
   - Paste into the SQL Editor
   - Click "Run" (or press Cmd/Ctrl + Enter)
   - Wait for success message

4. **Verify**:
   - Go to Table Editor in Supabase Dashboard
   - You should see `chat_conversations` and `chat_messages` tables

### Option 2: Using Script (If you have database password)

```bash
cd wine-scanner
node scripts/run-schema-migration.js
```

Note: This requires `SUPABASE_DB_PASSWORD` in your `.env` file.

## What Gets Created

- ✅ `chat_conversations` table - Stores chat conversations
- ✅ `chat_messages` table - Stores individual messages
- ✅ Row Level Security policies - Ensures users can only access their own chats
- ✅ Indexes - For performance
- ✅ Trigger - Auto-updates conversation timestamp when messages are added

## After Running Migration

1. **Refresh your app** - The errors should disappear
2. **Test chat** - Try creating a new conversation
3. **Check console** - No more 404 errors

## Verification

After running the migration, verify in Supabase Dashboard:
- Table Editor → Should see `chat_conversations` and `chat_messages`
- SQL Editor → Run: `SELECT COUNT(*) FROM chat_conversations;` (should return 0, not an error)




