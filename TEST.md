# Quick Test Guide

Your app is ready to test with Gemini!

## What's Configured

✅ **Gemini API Key**: Added and configured
✅ **Wine Labs API Key**: Pre-configured
✅ **Mock Backend**: Using mock Supabase (no backend setup needed)
✅ **All Dependencies**: Installed

## Run the App

```bash
cd wine-scanner
npm run web
```

The app will open in your browser at `http://localhost:8081`

## Test Flow

1. **App opens** → You'll be auto-logged in (mock auth)
2. **Camera screen** appears
3. **Click "Library"** to upload a wine list image
4. **Processing** happens (~5-10 seconds):
   - Gemini extracts wine names/prices
   - Wine Labs API fetches real prices & scores
   - Rankings are calculated
5. **Results screen** shows 3 tabs:
   - Highest Rated
   - Best Value
   - Most Inexpensive

## Test with Sample Wine List

Don't have a wine list photo? Use one of these:
- Google Image Search: "restaurant wine list"
- Save any wine menu photo to your computer
- Upload via the "Library" button

## What You'll See

Each wine card shows:
- **Wine name** & vintage
- **Restaurant price** (from photo)
- **Market price** (from Wine Labs)
- **Markup %** (color-coded: green/gold/red)
- **Critic score** (if available)

## Switching to Real Supabase Later

When ready to set up real backend:

1. Edit [App.js:19](App.js#L19), change:
   ```javascript
   import { supabase } from './src/services/supabase-mock';
   ```
   back to:
   ```javascript
   import { supabase } from './src/services/supabase';
   ```

2. Follow [SETUP.md](SETUP.md) to configure Supabase

## Troubleshooting

**"No vision API key configured"**
- Restart dev server: `Ctrl+C` then `npm run web`
- Check `.env` has `EXPO_PUBLIC_GEMINI_API_KEY=AIza...`

**"Failed to process wine list"**
- Check image quality is good
- Ensure wine names and prices are visible
- Check browser console for errors (F12)

**Camera not working on web**
- Use "Library" button instead
- Camera requires HTTPS (works on localhost)

## Gemini API Pricing

- **Gemini 2.0 Flash**: ~$0.0005 per image (very cheap!)
- **Free tier**: 1,500 requests/day
- Much cheaper than OpenAI/Anthropic

## Next Steps

1. Test with a wine list photo
2. Check the rankings
3. Verify pricing looks accurate
4. If all good, set up Supabase for persistence

Ready to scan some wines! 🍷
