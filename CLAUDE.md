# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Wine Scanner is a luxury wine list scanning app that uses AI vision models to parse wine lists and provide recommendations based on critic ratings, market prices, and value analysis. The app is built with React Native/Expo and can run on web, iOS, and Android.

**Core Value Proposition**: Scan a restaurant wine list photo to identify the "best" bottle based on ratings, see real market prices, and calculate restaurant markups.

## Development Commands

### Running the App

```bash
# Start development server
npm start

# Run on specific platforms
npm run web       # Web browser (PWA)
npm run ios       # iOS simulator
npm run android   # Android emulator
```

### Database Setup

```bash
# Run database schema migration
npm run setup:db

# Direct database setup (requires pg package)
npm run setup:db:direct

# Open Supabase SQL Editor in browser
npm run setup:db:open

# Manual CLI setup (requires Supabase CLI)
npm run setup:db:cli
```

### Building & Deployment

```bash
# Build for web
npm run build:web

# Build mobile apps (requires EAS)
npm run build:ios
npm run build:android

# Deploy to web
npm run deploy:web
npm run deploy:vercel  # Deploy to Vercel specifically
```

## Architecture

### Backend: Supabase

The app uses Supabase for all backend services:

- **Database**: PostgreSQL with 5 main tables
  - `profiles`: User profiles (extends auth.users)
  - `scans`: Wine list scan history
  - `wine_results`: Parsed wines from each scan
  - `favorites`: Saved wines
  - `wine_cache`: Cached Wine Labs API responses
- **Authentication**: Built-in auth with email/password
- **Storage**: Wine list images stored in `wine-lists` bucket
- **RLS**: Row Level Security policies ensure users can only access their own data

### Frontend: React Native + Expo

- Cross-platform app (iOS, Android, Web) using Expo 54
- Navigation: React Navigation (native stack)
- Fonts: Playfair Display (luxury serif) + Crimson Pro (readable serif)
- No emojis - luxury aesthetic focused on typography

### External APIs

1. **Wine Labs API** (`https://winelabs.ai/api`)
   - Batch wine matching to LWIN identifiers (max 100 per batch)
   - Market price statistics by region
   - Critic scores from professional wine publications
   - Wine metadata (varietal, region, etc.)
   - **Quota limits**: 30K matches/month, 150K price stats/month
   - Results are cached in `wine_cache` table to minimize API usage

2. **Vision APIs** (for OCR parsing)
   - Google Gemini 2.0 Flash (preferred - best cost/performance)
   - OpenAI GPT-4 Vision (fallback)
   - Anthropic Claude with vision (fallback)
   - All APIs return structured JSON: `{wineName, vintage, price}[]`

## Code Structure

```
src/
├── components/       # Reusable UI components
│   └── WineCard.tsx  # Individual wine display card
├── screens/          # Main app screens
│   ├── AuthScreen.tsx       # Login/signup
│   ├── OnboardingScreen.tsx # First-time user flow
│   ├── CameraScreen.tsx     # Wine list capture
│   └── ResultsScreen.tsx    # Rankings display
├── services/         # External API integrations
│   ├── supabase.ts   # Supabase client config
│   ├── winelabs.ts   # Wine Labs API wrapper
│   └── vision.ts     # LLM vision parsing (multi-provider)
├── theme/            # Design system
│   ├── colors.ts     # Luxury color palette
│   ├── typography.ts # Font definitions
│   ├── spacing.ts    # Layout spacing
│   └── index.ts      # Combined theme export
├── types/            # TypeScript type definitions
│   └── index.ts      # All shared types
└── utils/            # Helper functions
    └── wineRanking.ts # Ranking algorithms
```

## Wine Ranking Logic

The app provides three ranking views:

### 1. Highest Rated
- Sort by critic score (descending)
- Only includes wines with valid critic scores
- Top 10 wines displayed

### 2. Most Inexpensive
- Sort by restaurant price (ascending)
- Simple price-based ranking
- Top 10 wines displayed

### 3. Best Value
- Complex algorithm balancing quality, price, and markup
- Formula: `(Critic Score / Restaurant Price) × (1 / (1 + Markup%/100))`
- Rewards: high scores, low prices, reasonable markups
- Only includes wines with complete data (score, real price, markup)
- Top 10 wines displayed

### Markup Calculation & Color Coding

```typescript
markup = ((restaurantPrice - realPrice) / realPrice) × 100

// Colors (from wineRanking.ts):
// Green (#2d5f2d):    < 100% markup (reasonable)
// Gold (#d4af37):     100-200% markup (moderate)
// Burgundy (#8b3952): > 200% markup (high)
```

## Environment Variables

Required in `.env`:

```env
# Supabase (required)
EXPO_PUBLIC_SUPABASE_URL=your-supabase-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Wine Labs API (required)
EXPO_PUBLIC_WINELABS_API_KEY=d71dd0cb-2f37-4db5-8f7a-6937720852da
EXPO_PUBLIC_WINELABS_USER_ID=your-uuid-here

# Vision API (at least one required)
EXPO_PUBLIC_GEMINI_API_KEY=your-gemini-key          # Preferred
EXPO_PUBLIC_OPENAI_API_KEY=your-openai-key          # Fallback
EXPO_PUBLIC_ANTHROPIC_API_KEY=your-anthropic-key    # Fallback
```

The app will automatically use the first available vision API key in priority order: Gemini → OpenAI → Anthropic.

## Key Workflows

### Wine List Scanning Flow

1. User captures/uploads wine list photo (CameraScreen)
2. Image converted to base64 and sent to vision API
3. Vision API returns structured JSON: `[{wineName, vintage, price}, ...]`
4. Wines are matched to LWIN identifiers via Wine Labs batch API
5. For each matched wine, fetch:
   - Market price statistics
   - Critic scores
   - Wine metadata
6. Calculate markup percentages
7. Store results in database (scans, wine_results, wine_cache tables)
8. Display ranked results (ResultsScreen)

### Caching Strategy

- Wine Labs API responses are cached in `wine_cache` table
- Cache key: combination of wine query/LWIN + API endpoint
- Prevents redundant API calls for frequently scanned wines
- Respects API quota limits (30K matches/month, 150K price stats/month)

## Design System

### Typography
- **Headings**: Playfair Display (400 Regular, 800 ExtraBold)
- **Body**: Crimson Pro (200 ExtraLight, 400 Regular, 500 Medium, 600 SemiBold, 700 Bold)
- **No emojis**: User preference is luxury aesthetic with clean typography

### Color Palette
- **Primary**: `#8b3952` (Burgundy wine color)
- **Background**: `#fefdfb` (Cream/off-white)
- **Text**: Dark colors for contrast
- **Markup indicators**: Green/Gold/Burgundy based on percentage

### Platform Considerations
- Web: Metro bundler, single-page output
- iOS: Camera/photo library permissions in Info.plist
- Android: Camera/storage permissions in manifest
- All platforms support PWA capabilities

## Database Schema Notes

### Row Level Security (RLS)
All tables have RLS enabled with policies that restrict access based on `auth.uid()`:
- Users can only view/update their own profiles
- Users can only access their own scans, wine results, and favorites
- Wine cache is shared across users (no RLS) for efficiency

### Relationships
- `scans.user_id` → `auth.users.id` (CASCADE delete)
- `wine_results.scan_id` → `scans.id` (CASCADE delete)
- `favorites.user_id` → `auth.users.id` (CASCADE delete)
- `wine_cache` has no foreign keys (shared resource)

### Storage
- Bucket: `wine-lists` (private)
- Images stored with user-specific paths
- Policies ensure users can only access their own images
