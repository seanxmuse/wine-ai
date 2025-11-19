# Supabase Schema Setup Instructions

## Quick Setup (Recommended)

The SQL schema has been prepared and is ready to execute. Here are your options:

### Option 1: Supabase Dashboard SQL Editor (Easiest)

1. **Open SQL Editor**: https://supabase.com/dashboard/project/acsbqayfnrazspwuhyep/sql/new
2. **Copy SQL**: The schema is in `supabase-schema.sql`
3. **Paste and Run**: Paste into the SQL Editor and click "Run"

### Option 2: Supabase CLI (Requires Login)

```bash
# 1. Login to Supabase CLI (opens browser)
npx supabase login

# 2. Link your project
npx supabase link --project-ref acsbqayfnrazspwuhyep

# 3. Push migrations
npx supabase db push
```

Or use the helper script:
```bash
npm run setup:db:cli
```

## What Gets Created

The schema will create:

- ✅ **profiles** - User profiles table
- ✅ **scans** - Wine list scan history
- ✅ **wine_results** - Parsed wines from scans
- ✅ **favorites** - Saved wines
- ✅ **wine_cache** - Cached Wine Labs API data
- ✅ **Row Level Security** policies for all tables
- ✅ **Triggers** for automatic profile creation
- ✅ **Functions** for timestamp updates

## Migration File

The migration is ready at: `supabase/migrations/20251115T034633_initial_schema.sql`

## Troubleshooting

If direct connections fail:
- Use the Supabase Dashboard SQL Editor (most reliable)
- Ensure you're logged into Supabase CLI before using `db push`
- Check that your database password is correct in `.env`




