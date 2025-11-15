# Wine Scanner App - Current Status

**Last Updated:** 2025-01-14

## What's Built

### Complete Features
- **Frontend App Structure**
  - React Native with Expo (works on iOS, Android, and Web)
  - Luxury design with Playfair Display and Crimson Pro fonts
  - Burgundy and gold color scheme
  - Camera screen with image capture and library upload
  - Results screen with 3 ranking tabs (Highest Rated, Best Value, Most Inexpensive)
  - Wine card component showing all wine details

- **API Integrations**
  - **Gemini 2.0 Flash Vision** - Configured and ready (API key in .env)
  - **Wine Labs API** - Configured and ready (API key in .env)
    - Endpoints: match_to_lwin_batch, price_stats, critic_scores, wine_info

- **Core Logic**
  - Wine list image parsing (OCR via Gemini)
  - Wine matching to LWIN database
  - Real-time price and critic score fetching
  - Markup calculation
  - Value scoring algorithm: (Score / Restaurant Price) × (1 / (1 + Markup%/100))
  - Three ranking categories implementation

### Database Schema
- Complete Supabase schema created (see [supabase-schema.sql](supabase-schema.sql))
  - Tables: profiles, scans, wine_results, favorites, wine_cache
  - Row Level Security (RLS) policies configured
  - Storage bucket for wine list images

## Current Blocker

### Authentication Issue
**Problem:** Mock Supabase authentication not working properly
- Error: "User not authenticated" when trying to upload images
- Mock backend was created for testing without Supabase setup
- But the app requires actual authentication to function

**Solution:** Set up real Supabase backend

## What You Need to Do Next

### 1. Create Supabase Project (15 minutes)

1. Go to https://supabase.com
2. Sign up / Log in
3. Click "New Project"
4. Fill in:
   - **Name:** wine-scanner
   - **Database Password:** (create a strong password - save it!)
   - **Region:** Choose closest to you
5. Wait for project to provision (~2 minutes)

### 2. Run Database Schema (5 minutes)

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy entire contents of `wine-scanner/supabase-schema.sql`
4. Paste into SQL editor
5. Click **Run**
6. Verify tables created: Go to **Table Editor** and see: profiles, scans, wine_results, favorites, wine_cache

### 3. Get API Credentials (2 minutes)

1. In Supabase dashboard, go to **Project Settings** (gear icon bottom left)
2. Click **API** in sidebar
3. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (the long JWT token under "Project API keys")

### 4. Update Environment Variables (1 minute)

Edit `wine-scanner/.env`:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_URL.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE

# Wine Labs API (already configured)
EXPO_PUBLIC_WINELABS_API_KEY=d71dd0cb-2f37-4db5-8f7a-6937720852da
EXPO_PUBLIC_WINELABS_USER_ID=550e8400-e29b-41d4-a716-446655440000

# LLM Vision API (already configured)
EXPO_PUBLIC_GEMINI_API_KEY=AIzaSyB1cNEA0qxwxikSqey_1SQ1MXPLefzwHkE
EXPO_PUBLIC_OPENAI_API_KEY=
EXPO_PUBLIC_ANTHROPIC_API_KEY=
```

### 5. Switch to Real Supabase (1 minute)

Edit `App.js` line 20:

**Change from:**
```javascript
import { supabase } from './src/services/supabase-mock';
```

**To:**
```javascript
import { supabase } from './src/services/supabase';
```

### 6. Restart the App (1 minute)

```bash
cd wine-scanner
npm run web
```

Then open http://localhost:8081 in your browser.

## Testing the App

Once Supabase is configured:

1. **App will load** - You'll see auth screen
2. **Sign up** - Create account with email/password
3. **Camera screen appears** - Click "Library" button
4. **Upload wine list image** - Select any wine menu photo
5. **Processing** - Gemini extracts wines (~5-10 seconds)
6. **Results appear** - See 3 tabs with ranked wines

## Known Issues

### Fixed
- ✅ React 19 compatibility - downgraded to React 18.3.1
- ✅ Supabase URL validation - added placeholder values
- ✅ API keys configured - Gemini and Wine Labs ready

### UI Issues to Fix
- ⚠️ Title text overlap - "Scan Wine List" overlapping with subtitle
  - **Location:** [CameraScreen.tsx:234-238](src/screens/CameraScreen.tsx#L234-L238)
  - **Fix:** Add more spacing or use `textAlign: 'center'`

### Pending
- 📝 Image selection feedback - no visual confirmation when image is picked
- 📝 Processing overlay should show selected image thumbnail

## File Structure

```
wine-scanner/
├── App.js                          # Main app entry (CHANGE LINE 20)
├── .env                            # Environment variables (UPDATE THIS)
├── supabase-schema.sql            # Database schema (RUN IN SUPABASE)
├── package.json                   # Dependencies
├── src/
│   ├── screens/
│   │   ├── AuthScreen.tsx         # Login/signup
│   │   ├── CameraScreen.tsx       # Image capture & processing
│   │   └── ResultsScreen.tsx      # Wine rankings
│   ├── components/
│   │   └── WineCard.tsx           # Individual wine display
│   ├── services/
│   │   ├── supabase.ts            # Real Supabase client
│   │   ├── supabase-mock.ts       # Mock client (currently in use)
│   │   ├── vision.ts              # Gemini OCR
│   │   └── winelabs.ts            # Wine data API
│   ├── utils/
│   │   └── wineRanking.ts         # Ranking algorithms
│   ├── theme/
│   │   ├── colors.ts              # Burgundy/gold palette
│   │   ├── typography.ts          # Luxury fonts
│   │   └── spacing.ts             # Layout system
│   └── types.ts                   # TypeScript types
└── TEST.md                        # Original test guide

```

## API Keys Status

| Service | Status | Location |
|---------|--------|----------|
| Gemini 2.0 Flash | ✅ Configured | `.env` line 10 |
| Wine Labs API | ✅ Configured | `.env` lines 6-7 |
| Supabase | ❌ **NEEDS SETUP** | `.env` lines 2-3 |

## Next Steps After Supabase Setup

1. Test wine list upload
2. Verify Gemini extracts wines correctly
3. Check Wine Labs API returns prices/scores
4. Test all 3 ranking tabs
5. Fix UI issues (text overlap, image preview)
6. Add error handling improvements
7. Deploy as PWA

## Questions?

- **Gemini API pricing:** ~$0.0005 per image, 1,500 free requests/day
- **Supabase pricing:** Free tier includes 500MB database, 1GB storage
- **Wine Labs API:** Already have API key, check rate limits

## Resources

- Supabase Dashboard: https://supabase.com/dashboard
- Wine Labs API Docs: (check their documentation)
- Gemini API Docs: https://ai.google.dev/docs
