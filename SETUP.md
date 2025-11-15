# Wine Scanner - Setup Guide

Complete setup instructions for the Wine Scanner app.

## Prerequisites

- Node.js 18+ installed
- Expo CLI installed globally: `npm install -g expo-cli`
- A Supabase account ([supabase.com](https://supabase.com))
- Wine Labs API key (already included: `d71dd0cb-2f37-4db5-8f7a-6937720852da`)
- OpenAI or Anthropic API key for vision parsing

## Step 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - **Name**: Wine Scanner
   - **Database Password**: (choose a strong password)
   - **Region**: Choose closest to you
4. Click "Create new project" (takes ~2 minutes)

### 1.2 Run Database Schema

1. In your Supabase project, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase-schema.sql`
4. Paste into the SQL editor
5. Click "Run" to execute
6. Verify tables were created in **Table Editor**

### 1.3 Create Storage Bucket

1. Go to **Storage** in Supabase Dashboard
2. Click "New Bucket"
3. Name: `wine-lists`
4. Make it **Private** (uncheck "Public bucket")
5. Click "Create bucket"

### 1.4 Configure Storage Policies

In SQL Editor, run:

\`\`\`sql
-- Allow users to upload their own wine list images
CREATE POLICY "Users can upload wine list images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'wine-lists' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to view their own images
CREATE POLICY "Users can view own wine list images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'wine-lists' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to delete their own images
CREATE POLICY "Users can delete own wine list images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'wine-lists' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
\`\`\`

### 1.5 Get API Credentials

1. Go to **Settings** > **API** in Supabase
2. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public** key (under "Project API keys")

## Step 2: Environment Configuration

### 2.1 Create .env File

In the `wine-scanner` directory, update `.env`:

\`\`\`env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Wine Labs API
EXPO_PUBLIC_WINELABS_API_KEY=d71dd0cb-2f37-4db5-8f7a-6937720852da
EXPO_PUBLIC_WINELABS_USER_ID=your-uuid-here

# Vision API (choose one)
EXPO_PUBLIC_OPENAI_API_KEY=sk-your-openai-key
# OR
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
\`\`\`

### 2.2 Generate UUID for Wine Labs

You need a UUID for the Wine Labs API user_id. Generate one:

**Option 1 - In Browser Console:**
\`\`\`javascript
crypto.randomUUID()
\`\`\`

**Option 2 - In Node:**
\`\`\`bash
node -e "console.log(require('crypto').randomUUID())"
\`\`\`

**Option 3 - Online:**
Visit [uuidgenerator.net](https://www.uuidgenerator.net/version4)

Copy the UUID and paste it into `EXPO_PUBLIC_WINELABS_USER_ID`.

### 2.3 Get Vision API Key

**For OpenAI:**
1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign in or create account
3. Go to **API Keys**
4. Click "Create new secret key"
5. Copy key and paste into `EXPO_PUBLIC_OPENAI_API_KEY`

**For Anthropic (alternative):**
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign in or create account
3. Go to **API Keys**
4. Click "Create Key"
5. Copy key and paste into `EXPO_PUBLIC_ANTHROPIC_API_KEY`

## Step 3: Install & Run

### 3.1 Install Dependencies

\`\`\`bash
cd wine-scanner
npm install
\`\`\`

### 3.2 Run Development Server

**For Web (Recommended for testing):**
\`\`\`bash
npm run web
\`\`\`

**For iOS (requires Mac + Xcode):**
\`\`\`bash
npm run ios
\`\`\`

**For Android (requires Android Studio):**
\`\`\`bash
npm run android
\`\`\`

### 3.3 Test on Physical Device

1. Install Expo Go app on your phone:
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Start development server:
   \`\`\`bash
   npm start
   \`\`\`

3. Scan QR code with:
   - iOS: Camera app
   - Android: Expo Go app

## Step 4: First Run

### 4.1 Create Account

1. Open the app
2. Click "Sign Up"
3. Enter email and password
4. Check email for verification link
5. Click link to verify account
6. Sign in with credentials

### 4.2 Test Wine Scanning

1. Grant camera permissions when prompted
2. Take a photo of a wine list (or use test image)
3. Wait for processing (~10-30 seconds)
4. View results with rankings and pricing

## Troubleshooting

### Camera Not Working

**Web**: Camera requires HTTPS. Use Expo DevTools or deploy to hosting.

**Mobile**: Check app permissions in phone settings.

### "Supabase credentials not found"

1. Verify `.env` file exists in project root
2. Check variable names start with `EXPO_PUBLIC_`
3. Restart Expo dev server after changing `.env`

### "Failed to process wine list"

1. Check API keys are valid
2. Verify internet connection
3. Check Expo DevTools console for errors
4. Ensure Wine Labs API quota not exceeded

### Storage Upload Fails

1. Verify `wine-lists` bucket exists in Supabase
2. Check storage policies are configured
3. Ensure user is authenticated
4. Check Supabase storage quota

### Fonts Not Loading

Fonts should load automatically. If issues:
1. Clear Expo cache: `npx expo start -c`
2. Verify font packages installed: `@expo-google-fonts/*`

## API Quotas & Limits

### Wine Labs API

- **Matching**: 30,000 wines per 30 days
- **Price Stats**: 150,000 requests per 30 days
- Shared across all users with same `user_id`

**Tip**: Results are cached in Supabase to minimize API calls.

### OpenAI GPT-4 Vision

- Pay-per-use pricing
- ~$0.01-0.03 per image
- Monitor usage in OpenAI Dashboard

### Anthropic Claude Vision

- Pay-per-use pricing
- ~$0.015 per image
- Monitor usage in Anthropic Console

### Supabase Free Tier

- 500 MB database
- 1 GB file storage
- 50,000 monthly active users
- Upgrade to Pro if needed

## Next Steps

1. **Test with real wine lists**: Take photos of restaurant wine menus
2. **Explore features**: Try different ranking categories
3. **Review scans**: Check scan history (coming soon)
4. **Customize**: Adjust theme colors, fonts in `src/theme/`
5. **Deploy**: Build for production (see DEPLOYMENT.md - coming soon)

## Support

- **Wine Labs API Docs**: [winelabs.ai/api/docs](https://winelabs.ai/api/docs)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Expo Docs**: [docs.expo.dev](https://docs.expo.dev)

## Development Tips

### VS Code Extensions

- **ES7+ React/Redux/React-Native**: Snippets
- **Expo Tools**: Expo integration
- **Prettier**: Code formatting
- **ESLint**: Code linting

### Debug Tools

- **React Native Debugger**: Standalone app for debugging
- **Expo DevTools**: Browser-based tools
- **Flipper**: Mobile app debugging

### Performance

- Images are cached in Supabase
- Wine data cached to reduce API calls
- Fonts preloaded on app start
- Optimize images before upload

Enjoy discovering the best wines! 🍷
