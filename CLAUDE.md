# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## CRITICAL WORKFLOW RULE

**After making ANY code edits, ALWAYS deploy to Vercel immediately.**

This is a non-negotiable workflow requirement. After completing any changes to the codebase:

1. Run `npm run build:web` to build the production bundle
2. Run `npm run deploy:vercel` to deploy to production
3. Confirm deployment succeeded

The user tests exclusively on the production URL, not localhost, so every change must be deployed.

## Project Overview

Wine Scanner is a luxury wine list scanning app with AI-powered chat capabilities. It uses vision models to parse wine lists, provides recommendations based on critic ratings and market prices, and includes an AI sommelier chat assistant powered by Gemini 2.0 Flash with Google Search grounding.

**Core Value Proposition**: Scan a restaurant wine list photo to identify the "best" bottle based on ratings, see real market prices, calculate restaurant markups, and chat with an AI sommelier about any wine.

## Development Commands

### Running the App

```bash
# Start development server
npm start

# Run on specific platforms
npm run web       # Web browser (PWA) - primary development target
npm run ios       # iOS simulator
npm run android   # Android emulator
```

### Database Setup

```bash
# Run database schema migration (recommended)
npm run setup:db

# Direct database setup (requires pg package)
npm run setup:db:direct

# Open Supabase SQL Editor in browser
npm run setup:db:open

# Setup storage bucket for wine list images
npm run setup:storage
```

### Building & Deployment

```bash
# Build for web
npm run build:web

# Deploy to Vercel (IMPORTANT: Always deploy to Vercel for testing)
npm run deploy:vercel

# Build mobile apps (requires EAS)
npm run build:ios
npm run build:android
```

**Important**: Per cursor rules, always deploy changes to Vercel because testing is done on the production URL, not localhost.

### Testing

The project includes standalone test scripts for API integrations:

```bash
# Test Gemini API with vision
node test-basic-gemini.js

# Test web search functionality
node test-web-search.js

# Test Wine Labs API wine search
node test-wine-search.js

# Test chat with web search integration
node test-chat-web-search.js
```

## Architecture

### Tech Stack Overview

- **Frontend**: React Native + Expo (cross-platform: web, iOS, Android)
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **AI/ML**:
  - Google Gemini 2.0 Flash (vision OCR + chat with web search)
  - OpenAI GPT-4 Vision (fallback)
  - Anthropic Claude Vision (fallback)
- **Wine Data**: Wine Labs API (matching, pricing, critic scores)
- **Navigation**: React Navigation (native stack)
- **Fonts**: Playfair Display + Crimson Pro (luxury aesthetic, no emojis)

### Backend: Supabase

The app uses Supabase for all backend services:

- **Database**: PostgreSQL with tables for:
  - `profiles`: User profiles (extends auth.users)
  - `scans`: Wine list scan history
  - `wine_results`: Parsed wines from each scan
  - `wine_cache`: Cached Wine Labs API responses
  - `favorites`: Saved wines
  - `chat_conversations`: AI sommelier chat sessions
  - `chat_messages`: Individual chat messages
- **Authentication**: Email/password auth with session management
- **Storage**: Wine list images in `wine-lists` bucket (private)
- **RLS**: Row Level Security ensures users can only access their own data

### External APIs

1. **Wine Labs API** (`https://winelabs.ai/api`)
   - Batch wine matching to LWIN identifiers (max 100 per batch)
   - Market price statistics by region
   - Critic scores from professional wine publications
   - Wine metadata (varietal, region, color, etc.)
   - **Quota limits**: 30K matches/month, 150K price stats/month
   - Results cached in `wine_cache` table to minimize API usage
   - API key in env: `EXPO_PUBLIC_WINELABS_API_KEY`

2. **Gemini 2.0 Flash** (primary AI provider)
   - Vision API for wine list OCR parsing
   - Chat API with Google Search grounding for real-time wine information
   - Returns structured JSON for wine lists
   - Provides conversational responses for chat
   - API key: `EXPO_PUBLIC_GEMINI_API_KEY`

3. **OpenAI GPT-4 Vision** (fallback for OCR)
   - Used if Gemini is unavailable
   - API key: `EXPO_PUBLIC_OPENAI_API_KEY`

4. **Anthropic Claude Vision** (fallback for OCR)
   - Used if both Gemini and OpenAI are unavailable
   - API key: `EXPO_PUBLIC_ANTHROPIC_API_KEY`

### Data Flow Priority

The app uses a multi-tier data retrieval strategy:

1. **Wine Labs API** (primary source for wine data)
   - Most authoritative for pricing, critic scores, and wine metadata
   - Used for batch matching and detailed wine information
   - Cached to respect API quota limits

2. **Google Search via Gemini** (fallback for wine information)
   - Used when Wine Labs doesn't have data or for general wine questions
   - Provides real-time information from the web
   - Good for obscure wines, new releases, or general wine knowledge

3. **Web Search Service** (services/webSearch.ts)
   - Fallback when Wine Labs API fails or has no data
   - Returns confidence scores (0-100) to indicate data quality
   - Marks results with `dataSource: 'web-search'` or `'mixed'`

## Code Structure

```
wine-scanner/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── WineCard.tsx          # Main wine display card (scan results)
│   │   ├── NewWineCard.tsx       # Alternative wine card design
│   │   ├── ChatWineCard.tsx      # Wine card for chat interface
│   │   ├── ChatBubble.tsx        # Chat message bubble
│   │   └── ChatInput.tsx         # Chat input component
│   ├── contexts/         # React contexts
│   │   └── ActiveConversationContext.tsx  # Manages active chat state
│   ├── screens/          # Main app screens
│   │   ├── AuthScreen.tsx           # Login/signup
│   │   ├── OnboardingScreen.tsx     # First-time user onboarding
│   │   ├── CameraScreen.tsx         # Wine list capture (camera/upload)
│   │   ├── ResultsScreen.tsx        # Rankings display (main results)
│   │   ├── NewResultsScreen.tsx     # Alternative results view
│   │   ├── ChatScreen.tsx           # AI sommelier chat interface
│   │   ├── ChatHistoryScreen.tsx    # View past chat conversations
│   │   └── SettingsScreen.tsx       # App settings and preferences
│   ├── services/         # External API integrations
│   │   ├── supabase.ts    # Supabase client config and auth
│   │   ├── winelabs.ts    # Wine Labs API wrapper (matching, prices, scores)
│   │   ├── vision.ts      # Multi-provider vision API (OCR parsing)
│   │   ├── chat.ts        # Gemini chat API with Wine Labs integration
│   │   └── webSearch.ts   # Web search fallback for wine data
│   ├── theme/            # Design system
│   │   ├── colors.ts      # Luxury color palette (burgundy, cream, gold)
│   │   ├── typography.ts  # Font definitions (Playfair, Crimson Pro)
│   │   ├── spacing.ts     # Layout spacing constants
│   │   └── index.ts       # Combined theme export
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts       # All shared types (Wine, Scan, Chat, etc.)
│   └── utils/            # Helper functions
│       └── wineRanking.ts # Ranking algorithms and markup calculations
├── scripts/              # Utility scripts
│   ├── setup-supabase.sh           # Shell script for DB setup
│   ├── run-schema-migration.js     # Node script for schema migration
│   ├── open-sql-editor.js          # Opens Supabase SQL editor
│   ├── setup-storage-bucket.js     # Creates storage bucket
│   └── test-*.js                   # API integration tests
├── App.js                # App entry point (navigation, auth, fonts)
├── app.json              # Expo configuration
├── vercel.json           # Vercel deployment config
└── supabase-schema.sql   # Database schema (run manually or via scripts)
```

## Key Features

### 1. Wine List Scanning

**Flow**:
1. User captures/uploads wine list photo (CameraScreen)
2. Image converted to base64 and sent to vision API (Gemini → OpenAI → Claude)
3. Vision API returns structured JSON: `[{wineName, vintage, price}, ...]`
4. Wines matched to LWIN identifiers via Wine Labs batch API
5. For each matched wine, fetch:
   - Market price statistics (median, range)
   - Critic scores (professional ratings)
   - Wine metadata (varietal, region, color)
6. Calculate markup percentages: `((restaurant_price - real_price) / real_price) × 100`
7. Store results in database (scans, wine_results, wine_cache)
8. Display ranked results in three categories

**Implementation**:
- CameraScreen.tsx handles capture and upload
- services/vision.ts handles OCR parsing
- services/winelabs.ts handles wine data retrieval
- ResultsScreen.tsx displays ranked results

### 2. Wine Ranking System

Three ranking categories with different algorithms:

#### Highest Rated
- Sort by critic score (descending)
- Only wines with valid critic scores
- Top 10 displayed

#### Most Inexpensive
- Sort by restaurant price (ascending)
- All wines included
- Top 10 displayed

#### Best Value
- Complex algorithm balancing quality, price, and markup
- Formula: `(Critic Score / Restaurant Price) × (1 / (1 + Markup% / 100))`
- Rewards: high scores, low prices, reasonable markups
- Only wines with complete data (score, real price, markup)
- Top 10 displayed

**Markup Color Coding**:
- Green (#2d5f2d): < 100% markup (reasonable)
- Gold (#d4af37): 100-200% markup (moderate)
- Burgundy (#8b3952): > 200% markup (high)

**Implementation**: src/utils/wineRanking.ts

### 3. AI Sommelier Chat

**Key Features**:
- Powered by Gemini 2.0 Flash with Google Search grounding
- Automatically searches Wine Labs API when price/wine data is requested
- Falls back to web search for obscure wines or general questions
- Maintains conversation context across messages
- Can handle image uploads (wine labels, menus)
- Stores conversations in database for history

**Data Priority**:
1. Wine Labs API (for authoritative pricing and critic scores)
2. Google Search (for general wine info, trends, recommendations)
3. LLM knowledge (for wine education, pairing advice)

**Implementation**:
- ChatScreen.tsx: Main chat interface
- services/chat.ts: Chat API integration with Wine Labs
- services/webSearch.ts: Web search fallback
- ChatBubble.tsx: Message rendering
- ChatInput.tsx: User input handling

**Important Chat Behavior**:
- System prompt instructs AI to prioritize Wine Labs data
- Automatically extracts wine names from user queries
- Triggers Wine Labs API for price/score queries
- Web search provides real-time info for new releases or obscure wines
- Responses are conversational and sommelier-like

### 4. Caching Strategy

**Wine Labs Cache**:
- Table: `wine_cache`
- Cache key: combination of wine query/LWIN + API endpoint
- Prevents redundant API calls for frequently scanned wines
- Shared across all users (no RLS)
- Respects API quota limits

**Chat Conversations**:
- Conversations and messages stored in database
- Allows viewing history and resuming conversations
- Images stored in Supabase Storage with conversation references

## Environment Variables

Required in `.env` file:

```env
# Supabase (required)
EXPO_PUBLIC_SUPABASE_URL=your-supabase-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Wine Labs API (required)
EXPO_PUBLIC_WINELABS_API_KEY=d71dd0cb-2f37-4db5-8f7a-6937720852da
EXPO_PUBLIC_WINELABS_USER_ID=your-uuid-here

# Vision APIs (at least one required, Gemini preferred)
EXPO_PUBLIC_GEMINI_API_KEY=your-gemini-key          # Primary (vision + chat)
EXPO_PUBLIC_OPENAI_API_KEY=your-openai-key          # Fallback (vision only)
EXPO_PUBLIC_ANTHROPIC_API_KEY=your-anthropic-key    # Fallback (vision only)
```

**API Priority**:
- Vision OCR: Gemini → OpenAI → Anthropic
- Chat: Gemini only (with Google Search grounding)
- Wine Data: Wine Labs → Web Search fallback

## Design System

### Typography
- **Headings**: Playfair Display (400 Regular, 800 ExtraBold)
- **Body**: Crimson Pro (200 ExtraLight, 400 Regular, 500 Medium, 600 SemiBold, 700 Bold)
- **No emojis**: Luxury aesthetic focused on clean typography

### Color Palette (theme/colors.ts)
- **Primary**: `#8b3952` (Burgundy wine color)
- **Background**: `#fefdfb` (Cream/off-white)
- **Gold**: `#d4af37` (Accent color for moderate markups)
- **Green**: `#2d5f2d` (Good markups)
- **Text**: Dark colors for high contrast

### Platform Considerations
- **Web**: Primary development target, Metro bundler, single-page output
- **iOS**: Requires camera/photo library permissions in Info.plist
- **Android**: Requires camera/storage permissions in manifest
- **PWA**: All platforms support Progressive Web App capabilities

## Database Schema Key Points

### Row Level Security (RLS)
All user-specific tables have RLS enabled with policies based on `auth.uid()`:
- Users can only view/update their own profiles, scans, results, favorites, chats
- `wine_cache` is shared across users (no RLS) for efficiency

### Relationships
- `scans.user_id` → `auth.users.id` (CASCADE delete)
- `wine_results.scan_id` → `scans.id` (CASCADE delete)
- `chat_conversations.user_id` → `auth.users.id` (CASCADE delete)
- `chat_messages.conversation_id` → `chat_conversations.id` (CASCADE delete)
- `favorites.user_id` → `auth.users.id` (CASCADE delete)

### Storage
- Bucket: `wine-lists` (private)
- Wine list images: `{userId}/scans/{scanId}.jpg`
- Chat images: `{userId}/chats/{conversationId}/{messageId}.jpg`
- Policies ensure users can only access their own images

## Common Development Patterns

### Adding a New Screen
1. Create component in `src/screens/YourScreen.tsx`
2. Export with named export: `export function YourScreen() { ... }`
3. Add to App.js navigation stack: `<Stack.Screen name="YourName" component={YourScreen} />`
4. Navigate using: `navigation.navigate('YourName', { params })`

### Calling Wine Labs API
```typescript
import { matchWinesToLwin, getPriceStats, getCriticScores } from '../services/winelabs';

// Batch match wines (up to 100)
const matches = await matchWinesToLwin(['Wine Name 1', 'Wine Name 2']);

// Get price statistics
const prices = await getPriceStats('lwin7-code', 'USA', '2020');

// Get critic scores
const scores = await getCriticScores('lwin7-code');
```

### Using Web Search Fallback
```typescript
import { searchWineOnWeb } from '../services/webSearch';

// Search when Wine Labs has no data
const result = await searchWineOnWeb('Obscure Wine Name', '2020');

// Check confidence score
if (result.confidence > 50) {
  // Use web search data
  console.log(result.averagePrice, result.varietal, result.region);
}
```

### Working with Chat
```typescript
import { createGeneralChatConversation, sendChatMessage } from '../services/chat';

// Create new conversation
const conversation = await createGeneralChatConversation(imageUrl);

// Send message (automatically searches Wine Labs when appropriate)
const response = await sendChatMessage(
  conversation.id,
  'What is the price of 2020 Opus One?',
  imageUrl  // optional
);

// Response includes Wine Labs data if available
console.log(response.content); // AI response with price info
```

## Debugging Tips

1. **Check API Keys**: Verify all env vars are set and prefixed with `EXPO_PUBLIC_`
2. **Vision API Errors**: Check console for which provider is being used (Gemini → OpenAI → Claude)
3. **Wine Labs Quota**: If matches fail, check API quota usage
4. **Cache Issues**: Check `wine_cache` table for stale or incorrect data
5. **RLS Policies**: If database operations fail, verify RLS policies in Supabase dashboard
6. **Web Search Confidence**: Low confidence scores (< 50) may indicate unreliable data
7. **Chat Context**: Check console logs for Wine Labs API triggers in chat responses

## Testing Strategy

**Manual Testing**:
- Use standalone test scripts in root directory (`test-*.js`)
- Test Wine Labs API with `node test-wine-search.js`
- Test web search with `node test-web-search.js`
- Test chat integration with `node test-chat-web-search.js`
- See TESTING_GUIDE.md for detailed test cases

**Deployment Testing**:
- Always deploy to Vercel for testing (per cursor rules)
- Test on production URL, not localhost
- Verify environment variables are set in Vercel dashboard

## Important Notes

- **No Emojis**: User preference is luxury aesthetic without emojis
- **Vercel Deployment**: Always deploy changes to Vercel for testing
- **API Quotas**: Be mindful of Wine Labs API limits (30K matches, 150K price stats per month)
- **Caching**: Always check cache before making API calls to Wine Labs
- **Data Source Transparency**: Mark wines with `dataSource` field when using web search fallback
- **Confidence Scores**: Display confidence scores for web search results to indicate reliability
