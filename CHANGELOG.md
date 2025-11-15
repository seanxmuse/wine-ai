# Changelog

## [Unreleased]

### Added
- Supabase configuration setup
  - Created `.env` file with Supabase credentials
  - Added Supabase credentials to `app.json` extra config
  - Updated Supabase client to properly validate configuration
  - Added database password to `.env` file
  - Created database setup scripts using Supabase CLI
  - Created migration file in `supabase/migrations/`
  - Added npm scripts: `setup:db`, `setup:db:cli`, `setup:db:direct`, `setup:db:open`

### Changed
- Improved Supabase client error handling (now throws error instead of warning when credentials are missing)
- Updated schema to include `DROP POLICY IF EXISTS` statements to handle existing policies gracefully

### Completed
- ✅ Supabase database schema executed successfully
  - All 5 tables created: profiles, scans, wine_results, favorites, wine_cache
  - Row Level Security policies configured
  - Triggers and functions created
- ✅ Switched app to use real Supabase backend (removed mock)
- ✅ Set up deployment configuration
  - Added EAS build configuration (eas.json)
  - Added Vercel deployment config (vercel.json)
  - Added deployment scripts and documentation
  - Web build tested and working (dist/ folder created)
  - Ready for Vercel deployment

