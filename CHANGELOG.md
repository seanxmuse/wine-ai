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
- Fixed onboarding slide centering issues
  - Simplified structure by removing unnecessary wrapper Views
  - Added `boxSizing: 'border-box'` for proper padding calculations
  - All slides now properly centered on web and mobile
- Added session persistence for web platform
  - Explicit `localStorage` storage adapter for web to remember user sessions
  - Users now stay logged in when returning to the app
  - Native platforms continue using `AsyncStorage`
- Improved Supabase client error handling (now throws error instead of warning when credentials are missing)
- Updated schema to include `DROP POLICY IF EXISTS` statements to handle existing policies gracefully
- Fixed overlay/z-index issues on web platform in AuthScreen
- Added first name field to sign-up form
  - First name is required when creating a new account
  - First name is stored in user metadata and profile
  - Field only appears when signing up (hidden during login)
- Improved sign-up flow for no email confirmation
  - Users are automatically signed in after signup (when email confirmation is disabled)
  - Smooth navigation to camera screen after successful signup
  - Fixed TypeScript errors for web platform compatibility
- Enhanced UI with Apple-style design improvements
  - Fixed title/subtitle spacing on Camera screen (increased to 20px on web)
  - Added Apple-style Library button with media icon (Ionicons images-outline)
  - Library button features: frosted glass effect, rounded corners, smooth animations
  - Added smooth button press animations (scale effect)
  - Enhanced input fields with focus states and smooth transitions
  - Improved button hover/active states with smooth transitions
  - Added backdrop blur effects for modern glass-morphism look
  - Overall smoother, more polished Apple-inspired design language

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
- ✅ Deployed to Vercel via CLI
  - Authenticated with GitHub CLI (`seanxmuse`)
  - Authenticated with Vercel CLI (`seanxmuse`)
  - Linked project to GitHub repository (`https://github.com/seanxmuse/wine-ai`)
  - Fixed npm dependency conflict by adding `--legacy-peer-deps` to install command
  - Production deployment live at: `https://wine-scanner-a0o4wuweq-seanxmuses-projects.vercel.app`
  - Latest deployment includes sign-up flow improvements (first name field, no email confirmation)
  - ⚠️ Environment variables need to be added in Vercel dashboard

