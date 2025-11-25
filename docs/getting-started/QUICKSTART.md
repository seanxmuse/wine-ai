# Wine Scanner - Quick Start

Get up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier is fine)
- OpenAI or Anthropic API key

## 1. Install Dependencies

\`\`\`bash
cd wine-scanner
npm install
\`\`\`

## 2. Set Up Supabase

1. Create project at [supabase.com](https://supabase.com)
2. In SQL Editor, run `supabase-schema.sql`
3. In Storage, create bucket named `wine-lists` (private)
4. Get your credentials from Settings > API:
   - Project URL
   - anon/public key

## 3. Configure Environment

Update `.env` file:

\`\`\`env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

EXPO_PUBLIC_WINELABS_API_KEY=d71dd0cb-2f37-4db5-8f7a-6937720852da
EXPO_PUBLIC_WINELABS_USER_ID=<generate-a-uuid>

EXPO_PUBLIC_OPENAI_API_KEY=sk-your-key-here
\`\`\`

**Generate UUID**: Visit [uuidgenerator.net](https://www.uuidgenerator.net/version4)

## 4. Run the App

\`\`\`bash
npm run web
\`\`\`

## 5. Test It Out

1. Sign up with email/password
2. Verify email
3. Sign in
4. Grant camera permission
5. Scan a wine list!

## What It Does

- 📸 **Scans wine lists** using your camera
- 🤖 **Extracts wines** with AI vision (GPT-4/Claude)
- 💰 **Shows real prices** and markups from Wine Labs API
- ⭐ **Displays ratings** from professional critics
- 📊 **Ranks wines** by:
  - Highest rated
  - Best value (score vs price vs markup)
  - Most inexpensive

## File Structure

\`\`\`
wine-scanner/
├── src/
│   ├── screens/           # Camera, Results, Auth
│   ├── components/        # WineCard
│   ├── services/          # APIs (Supabase, Wine Labs, Vision)
│   ├── theme/             # Colors, fonts, spacing
│   └── utils/             # Wine ranking logic
├── App.js                 # Entry point
├── .env                   # Your credentials
└── supabase-schema.sql    # Database schema
\`\`\`

## Troubleshooting

**Camera not working on web?**
- Requires HTTPS or localhost

**"Supabase credentials not found"?**
- Check `.env` has `EXPO_PUBLIC_` prefix
- Restart dev server after editing `.env`

**Wine parsing fails?**
- Check OpenAI/Anthropic API key is valid
- Verify internet connection
- Check image quality is good

## Next Steps

- Read [SETUP.md](SETUP.md) for detailed configuration
- Review [README.md](../reference/README.md) for full documentation
- Explore Wine Labs API at [winelabs.ai/api/docs](https://winelabs.ai/api/docs)

Happy wine hunting! 🍷
