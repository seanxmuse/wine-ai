# Changelog

## [Unreleased]

### Added
- **Cursor Documentation** 📝
  - Created `cursor/cursor.md` to document AI guidelines and project context

### Fixed
- **UI Improvements** 🎨
  - Fixed text cutoff issues on Chat screens by implementing responsive typography scaling
  - Restored scanning animation on Camera screen (Web)
  - Fixed Gallery icon visibility and positioning in Camera header
  - Resolved TypeScript errors in SimpleCameraWeb component
- **Camera Screen Opacity and Animation Issues on Mobile** 📱
  - Fixed camera screen remaining opaque after granting permissions
  - Fixed camera feed not visible due to dark container background blocking the view
  - Changed container background from dark color to transparent to allow camera feed to show through
  - Fixed CameraView styling to use absoluteFill for proper rendering
  - Fixed intro animation not triggering when camera permission is granted
  - Improved animation state management with `shouldShowCamera` state variable
  - Fixed overlay opacity animation to properly fade out and reveal camera feed
  - Removed conflicting background color from overlay styles
  - Animation now uses native driver for better performance on mobile
  - Animation values now properly reset when permission state changes
- **Camera Permission Prompt Not Appearing on iPhone** 📱
  - Fixed iOS camera permission prompt not showing when tapping "Grant Permission" button
  - Improved permission state handling to properly check `canAskAgain` status
  - Added proper handling for permanently denied permissions (directs to Settings)
  - Added debug logging to track permission state changes
  - Enhanced error handling with better user feedback and Settings redirect
  - Permission prompt now properly triggers iOS system dialog on first request
- **Post-Capture Preview Screen** 📸
  - Added dedicated "Retake" button alongside "Send" button in preview screen
  - Changed "Analyze" button text to "Send" for clarity
  - Preview actions now show both Retake and Send buttons side-by-side
  - Improved preview screen layout with proper button spacing
- **Chat State Preservation** 💬
  - Fixed navigation to preserve chat conversation when switching between Chat ↔ Camera modes
  - ChatScreen now passes conversationId when navigating to Camera
  - CameraScreen now uses routeConversationId when navigating back to Chat
  - Users can now seamlessly switch between modes without losing their conversation

### Changed
- **Documentation Layout** 📚
  - Organize most `.md` docs under `docs/` with dedicated subfolders for getting-started, architecture, testing, and reference materials
  - Root `README.md` now orients readers toward `docs/`, while the detailed project overview lives at `docs/reference/README.md`
  - Keeps documentation discoverable alongside the app code without crowding the repo root

### Changed
- **Auxiliary files archived** 📦
  - Moved the `.env.*` templates into `archives/configuration/` to highlight that they’re reference-only
  - Shifted previous Expo/serve logs into `archives/logs/` so the repo root stays tidy
  - Relocated `clear-onboarding.js` and `list-models.js` into `archives/legacy-scripts/` for occasional reference

### Changed
- **Test helpers grouped** 🧪
  - Created `scripts/tests/` and moved the `test-*` debug scripts (Gemini, Wine Labs, web search helpers) out of the root
  - `README.md` and `docs/architecture/FOLDER_ROLES.md` now describe where to find those helpers for manual testing

### Added
- **Camera Permission Skip Button** 📷
  - Added "Skip for now" button on camera permission screen to allow users to proceed without granting camera access
  - Users can now use the library button even without camera permission
  - Added "Enable Camera" button on camera screen when permission is not granted
  - Allows app to function in browser environments where camera permissions cannot be granted
  - Camera screen shows placeholder view with enable button when permission skipped

### Changed
- **Complete UI Redesign to Match Mockups** 🎨
  - Updated theme colors to match luxury wine app aesthetic (gold, burgundy, cream, parchment)
  - Updated typography system with Playfair Display and Crimson Pro fonts
  - Updated CameraScreen with new header, center content, buttons, and tab bar styling
  - Updated ChatScreen with refined header, bubbles, and input styling
  - Updated SettingsScreen with profile card, stats card, and refined preferences section
  - Updated ResultsScreen wine detail view with improved card styling and action buttons
  - Updated WineCard, ChatWineCard, and ChatInput components to match new style
  - All screens now use consistent luxury-inspired design language
  - Improved shadows, borders, and spacing throughout the app
  - Added gradient backgrounds and glass-morphism effects where appropriate

### Fixed
- **Demo UI Lab Excluded from Deployment** 🚫
  - Added `demo-ui/` folder to `.vercelignore` to prevent deployment
  - Added `App.demo.js` and `App.prod.js` to `.vercelignore`
  - Demo UI Lab is now completely separate from production deployment
  - Redeployed to ensure demo-ui is not included in production build
- **Chat Database Tables Missing** 🗄️
  - Created `FIX_CHAT_TABLES.md` guide to resolve missing chat tables error
  - Chat tables migration exists but needs to be run in production Supabase database
  - Error: `Could not find the table 'public.chat_conversations' in the schema cache`
  - Solution: Run `supabase/migrations/20250117_add_chat_tables.sql` in Supabase SQL Editor
- **Chat Wine Labs API Integration** 🍷
  - Added Wine Labs API integration to chat service
  - Chat now automatically queries Wine Labs API when users ask about specific wines or prices
  - Extracts wine names and vintages from user messages using pattern matching
  - Fetches price stats, critic scores, and wine information from Wine Labs API
  - Falls back to web search if Wine Labs doesn't have the wine
  - Users can explicitly request Wine Labs API by saying "use wine labs api" or "use the wine labs api"
  - System prompt updated to mention both Wine Labs API and web search capabilities
- **Chat Web Search Integration** 🔍
  - Fixed chat service to use correct Google Search tool (`googleSearch` instead of `googleSearchRetrieval`)
  - Updated model from `gemini-2.0-flash-exp` to `gemini-2.5-flash` for better quota availability and consistency
  - All chat functions now use `gemini-2.5-flash` (chat responses, title generation)
  - Consistent model usage across all services (chat, webSearch, vision all use `gemini-2.5-flash`)
  - Chat now properly supports web search when users ask for current information
  - Users can explicitly request web search in chat prompts (e.g., "Please use web search to find...")
  - Model automatically triggers web search for queries requiring current data (prices, reviews, etc.)
  - Created test script (`test-chat-web-search.js`) to verify web search functionality
  - Deployed fix to production (cleared cache and redeployed to ensure correct model is used)
- **Critic Scores API Response Mapping** ⭐
  - Fixed critic scores not displaying despite API returning scores
  - API returns `review_score` and `critic_title`, but code expected `score` and `critic`
  - Added proper mapping from API response structure to expected `WineLabsCriticScore` interface
  - Now correctly extracts and displays critic scores from WineLabs API
  - Scores are properly averaged and displayed in wine cards
- **Price Stats Parsing** 💰
  - Fixed price stats response parsing to extract `median_value` from `results` array
  - Market prices now display correctly in UI
  - Markup percentages now calculate properly
- **Critic Scores Web Search Fallback** ⭐
  - Added web search fallback when WineLabs API returns 0 critic scores
  - Automatically searches for critic scores from Wine Spectator, Robert Parker, Wine Enthusiast, Decanter, James Suckling, etc.
  - Only triggers when WineLabs has no scores (doesn't waste API calls)
  - Improved logging to show raw API response structure for debugging
  - Updated both CameraScreen and ChatScreen with fallback logic
- **Vision AI Wine Name Extraction** 🔍
  - Improved prompts to require complete wine names including varietal (e.g., "Roco Gravel Road Pinot Noir" instead of just "Roco Gravel Road")
  - Added explicit examples showing correct vs incorrect extraction
  - Updated all vision AI providers (Gemini, OpenAI, Anthropic) with consistent prompts
  - Should significantly improve WineLabs API matching rate by providing complete wine names
- **WineLabs API Response Parsing & Error Handling** 🔧
  - Fixed Vercel proxy using wrong API URL (`https://winelabs.ai/api` → `https://external-api.wine-labs.com`)
  - Improved response parsing to handle both `{results: [...]}` and `[...]` response formats
  - Added proper handling for empty result arrays (no matches)
  - Fixed result count mismatch issues by padding results when API returns fewer than expected
  - Added comprehensive error logging with full error messages and response details
  - Enhanced all API functions (matchWinesToLwin, getPriceStats, getCriticScores, getWineInfo) with better error handling
  - Added detailed console logging to track API calls and responses for debugging
  - Graceful degradation: critic scores and wine info return empty/null instead of throwing errors
- **All Issues from Testing Plan** ✅
  - **Duplicate Image Picker Modal**: Removed duplicate modal rendering in ChatScreen
  - **Conversation Image URL Not Saved**: Implemented image upload to Supabase Storage and conversation update after wine list analysis
  - **Wine List Analysis Messages Not Saved**: Messages now persist to database (user and assistant messages saved)
  - **No User-Facing Error Messages**: Added Alert dialogs for all error scenarios with user-friendly messages
  - **Missing Loading States**: Added loading indicators for conversation deletion with per-conversation state tracking
  - Added `updateChatConversation` function to chat service
  - Added `uploadImageToStorage` helper function with graceful error handling
  - Improved error handling throughout chat flow (network errors, API errors, permission errors)
  - Conversation image URL now persists after analysis
  - All analysis messages saved to database for conversation history

### Added
- **Comprehensive Testing Plan** 📋
  - Created `TESTING_PLAN.md` with 200+ test cases covering:
    - Authentication & Authorization (RLS policies)
    - Conversation Management (CRUD operations)
    - Message Sending & Receiving
    - Image Analysis & Wine List Processing
    - Gemini API Integration
    - UI/UX & Navigation
    - Error Handling (Network, Database, API)
    - Performance & Security
    - End-to-End Integration Tests
  - Documented 5 known issues found during code review
  - Includes test execution checklist and coverage goals

### Added
- **Web Search Fallback for Unmatched Wines** 🔍
  - Integrated Gemini 2.0 Flash with Google Search grounding
  - Automatically searches web when Wine Labs API doesn't find a match
  - Extracts wine name, vintage, varietal, region, and estimated market price
  - Displays "Web" badge on wine cards sourced from web search
  - Shows estimated market price with source attribution
  - Confidence-based filtering (only uses results with >30% confidence)
  - Significantly improves match rate for obscure or regional wines
- Wine bottle and magnifying glass favicon/logo
  - Added logo image to login/signup screen above title
  - Configured favicon for web builds
  - 100px logo on web, 80px on mobile
- Camera capture option in chat (in addition to image library picker)
- Animated wine icon pulse effect during wine list analysis
- Animated processing dots with staggered pulse animation
- Animated thinking dots with bounce effect during regular chat loading
- Image picker modal with options for camera or library selection

### Changed
- Improved login screen typography
  - Tightened letter spacing to prevent text overlap
  - Reduced line height for cleaner title display
  - Removed "Powered by Wine Labs AI" footer text
- Enhanced wine matching pipeline
  - Web search fallback automatically triggered for unmatched wines
  - Markup calculation now uses web search price if Wine Labs price unavailable
  - Wine cards display data source (Wine Labs vs. Web Search)
- Updated Wine data types to track data source and confidence scores

### Deployed
- ✅ **Latest**: https://wine-scanner-kebx712rw-seanxmuses-projects.vercel.app (Nov 21, 2025)
  - Fixed Chat screen text cutoff (responsive design)
  - Restored Camera scanning animation
  - Fixed Camera gallery icon
  - Hidden iOS Status Bar
  - Updated Chat UI (attachment icon, simplified picker)
  - Fixed Onboarding centering issues
- Previous: https://wine-scanner-c7o05wq8l-seanxmuses-projects.vercel.app (Nov 18, 2025)
  - **New**: Web search fallback with Gemini for unmatched wines
  - Includes favicon/logo implementation
  - Fixed login screen text overlap issues
  - Enhanced wine matching with automatic fallback
- Previous: https://wine-scanner-jmnl78nbg-seanxmuses-projects.vercel.app

### Added
- Chat feature for wine discussions
  - Chat button on each wine card to start conversations about specific wines
  - Chat interface with AI-powered responses using Gemini API
  - Chat history screen to view and manage past conversations
  - Bottom tab bar navigation to switch between Camera and Chat views
  - Image references in chats (wine list images shown in chat context)
  - Database schema for chat conversations and messages
  - Chat service for managing conversations and AI interactions
  - "Create Chat" button in Chat History screen header
  - Image upload and analysis directly in chat interface (Gemini-style)
  - Wine list analysis through chat with processing animations
  - Results displayed in chat format when analyzing wine lists via chat
  - Chat history icon in top left of camera screen

### Changed
- Camera-to-chat flow now starts a new chat instead of navigating to chat history
- Chat tab in bottom navigation creates new conversations
- Chat screen supports general conversations (not wine-specific) and wine-specific conversations
- Chat interface allows uploading wine list images for analysis
- Processing animations shown in chat when analyzing wine lists

### Removed
- Debug buttons ("View Sample Data" and "View New Sample Page") removed from camera screen

### Fixed
- Fixed WineCard layout issues in ResultsScreen
  - Removed incorrect `marginBottom` from `priceLabel` style (was causing layout issues in row layout)
  - Fixed typography error: changed `bodyMedium` style reference to use `body` style with `bodyMedium` font family
  - Increased rank badge text size to 32px for better visibility
  - Improved rank badge styling with `minWidth` for consistent sizing
  - Fixed overlapping text in price rows by adding proper flex constraints
    - Added `flexShrink: 1` and `maxWidth: '60%'` to price labels to prevent overflow
    - Added `flexShrink: 0` to price values to keep them from shrinking
    - Added proper spacing (`marginRight`/`marginLeft`) between labels and values
    - Added `textDecorationLine: 'line-through'` to market price (realPrice) to match design
    - Added `flexWrap: 'wrap'` to score section for better overflow handling
    - Added text overflow handling for web platform (ellipsis, nowrap)

### Added
- Created FOLDER_ROLES.md - Comprehensive guide explaining the purpose and role of each folder in the codebase
  - High-level explanation of folder structure for beginners
  - Visual flow diagrams showing how folders work together
  - Quick reference guide for common tasks
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

