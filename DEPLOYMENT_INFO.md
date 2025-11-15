# Deployment Information

## Production Deployment

### URLs
- **Production**: https://wine-scanner-flax.vercel.app/
- **GitHub Repository**: https://github.com/seanxmuse/wine-ai

### Quick Deploy Commands

```bash
# Deploy to Vercel (includes build)
npm run deploy:vercel

# Or manually:
npm run build:web
npx vercel --prod --yes
```

### Environment Variables (Vercel)

Make sure these are set in Vercel dashboard:
- `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `EXPO_PUBLIC_GEMINI_API_KEY` - Google Gemini API key (preferred)
- `EXPO_PUBLIC_OPENAI_API_KEY` - OpenAI API key (fallback)
- `EXPO_PUBLIC_ANTHROPIC_API_KEY` - Anthropic API key (fallback)
- `EXPO_PUBLIC_WINELABS_API_KEY` - Wine Labs API key
- `EXPO_PUBLIC_WINELABS_USER_ID` - Your Wine Labs user ID

### Git Workflow

```bash
# Stage all changes
git add -A

# Commit with message
git commit -m "Your commit message"

# Push to GitHub
git push origin main

# Deploy to Vercel (automatic or manual)
npm run deploy:vercel
```

### Vercel Project Settings

- **Project Name**: wine-scanner
- **Framework Preset**: Other
- **Build Command**: `npm run build:web`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Monitoring

```bash
# View deployment logs
vercel logs wine-scanner-flax.vercel.app

# Inspect specific deployment
vercel inspect <deployment-url> --logs
```

### Storage Setup

Before first use, ensure Supabase storage bucket is configured:

```bash
# Run storage setup helper
npm run setup:storage

# Then manually run the SQL in Supabase dashboard
# (The script will provide instructions)
```

### Latest Deployment

- **Date**: 2025-11-15
- **Commit**: Fix image upload and add storage bucket setup
- **Build**: ✅ Success (1.5 MB bundle)
- **Status**: 🟢 Live

### Testing Checklist

After deployment:
- [ ] App loads at production URL
- [ ] User can sign up/login
- [ ] Camera/image picker works
- [ ] Image upload to Supabase storage succeeds
- [ ] Wine list parsing works
- [ ] Results display correctly
- [ ] Ranking algorithms work
