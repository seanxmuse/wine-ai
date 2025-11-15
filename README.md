# Wine Scanner App

A luxury wine list scanning app that helps you discover the best wines on any restaurant wine list. Built with React Native, powered by Wine Labs AI.

## Features

- 📸 **Camera Scanning**: Capture wine lists with your phone camera
- 🤖 **AI-Powered OCR**: Extract wine names and prices using LLM vision models
- 📊 **Smart Rankings**:
  - **Highest Rated**: Find critically acclaimed wines
  - **Best Value**: Discover quality wines with reasonable markups
  - **Most Inexpensive**: Budget-friendly options
- 💰 **Price Analysis**: See real market prices and restaurant markups
- ⭐ **Critic Scores**: View professional wine ratings
- 💾 **Scan History**: Save and revisit past wine list scans

## Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **APIs**:
  - Wine Labs API (wine data, pricing, critic scores)
  - OpenAI GPT-4 Vision / Anthropic Claude (OCR parsing)
- **Design**: Luxury aesthetic with Playfair Display & Crimson Pro fonts

## Setup

### 1. Install Dependencies

\`\`\`bash
cd wine-scanner
npm install
\`\`\`

### 2. Configure Environment Variables

Create a \`.env\` file:

\`\`\`env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=your-supabase-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Wine Labs API
EXPO_PUBLIC_WINELABS_API_KEY=d71dd0cb-2f37-4db5-8f7a-6937720852da
EXPO_PUBLIC_WINELABS_USER_ID=your-uuid-here

# Vision API (choose one)
EXPO_PUBLIC_OPENAI_API_KEY=your-openai-key
# OR
EXPO_PUBLIC_ANTHROPIC_API_KEY=your-anthropic-key
\`\`\`

### 3. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema from \`supabase-schema.sql\` in your Supabase SQL Editor
3. Create a storage bucket named \`wine-lists\`:
   - Go to Storage in Supabase Dashboard
   - Create new bucket: \`wine-lists\`
   - Set as private
   - Configure policies for user access

### 4. Run the App

\`\`\`bash
# Web (PWA)
npm run web

# iOS
npm run ios

# Android
npm run android
\`\`\`

## Wine Labs API

This app uses the [Wine Labs API](https://winelabs.ai/api/docs) for:

- **Wine Matching**: Resolve wine names to LWIN identifiers
- **Price Statistics**: Get market pricing data by region
- **Critic Scores**: Access professional wine ratings
- **Wine Information**: Retrieve varietal, region, and metadata

### API Endpoints Used

- \`POST /match_to_lwin_batch\` - Match up to 100 wines at once
- \`POST /price_stats\` - Get median market prices
- \`POST /critic_scores\` - Fetch wine ratings
- \`POST /wine_info\` - Get complete wine details

### API Quota Limits

- Matching: 30,000 rows per 30 days
- Price Stats: 150,000 requests per 30 days
- Results are cached in Supabase to minimize API calls

## How It Works

1. **Scan**: Capture a wine list photo with your camera
2. **Extract**: LLM vision model parses wine names, vintages, and prices
3. **Match**: Wine names are matched to Wine Labs database (LWIN)
4. **Analyze**: Fetch market prices and critic scores
5. **Rank**: Calculate best wines based on ratings, value, and price
6. **Display**: View results with markup percentages and recommendations

## Markup Calculation

\`\`\`
Markup % = ((Restaurant Price - Market Price) / Market Price) × 100
\`\`\`

**Color Coding:**
- 🟢 Green: < 100% markup (reasonable)
- 🟡 Gold: 100-200% markup (moderate)
- 🔴 Red: > 200% markup (high)

## Best Value Algorithm

\`\`\`
Value Score = (Critic Score / Restaurant Price) × (1 / (1 + Markup%/100))
\`\`\`

This rewards:
- High critic scores
- Lower restaurant prices
- Reasonable markups

## Project Structure

\`\`\`
wine-scanner/
├── src/
│   ├── components/       # Reusable UI components
│   │   └── WineCard.tsx
│   ├── screens/          # App screens
│   │   ├── AuthScreen.tsx
│   │   ├── CameraScreen.tsx
│   │   └── ResultsScreen.tsx
│   ├── services/         # External services
│   │   ├── supabase.ts   # Supabase client
│   │   ├── winelabs.ts   # Wine Labs API
│   │   └── vision.ts     # LLM vision parsing
│   ├── theme/            # Design system
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── index.ts
│   ├── types/            # TypeScript types
│   │   └── index.ts
│   └── utils/            # Helper functions
│       └── wineRanking.ts
├── App.js                # App entry point
├── app.json              # Expo configuration
└── supabase-schema.sql   # Database schema
\`\`\`

## Database Schema

- **profiles**: User profiles
- **scans**: Wine list scan history
- **wine_results**: Parsed wines from scans
- **favorites**: Saved wines
- **wine_cache**: Cached Wine Labs API data

## Future Enhancements

- [ ] Favorites and collections
- [ ] Scan history with search
- [ ] Food pairing recommendations
- [ ] Wine cellar management
- [ ] Social sharing
- [ ] Restaurant ratings
- [ ] AR wine label recognition
- [ ] Personalized recommendations based on taste preferences

## License

MIT

## Credits

Powered by [Wine Labs AI](https://winelabs.ai)
