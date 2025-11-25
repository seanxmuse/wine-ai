# Deploy to Vercel - Quick Steps

## Method 1: Vercel Dashboard (Easiest)

1. **Build the app**:
   ```bash
   npm run build:web
   ```

2. **Go to Vercel**:
   - Visit https://vercel.com
   - Sign in (or create account)
   - Click "New Project"

3. **Import Project**:
   - Connect your Git repository, OR
   - Drag and drop the `dist` folder

4. **Configure**:
   - Vercel will auto-detect settings from `vercel.json`
   - Click "Deploy"

5. **Add Environment Variables**:
   - Go to Project → Settings → Environment Variables
   - Add these (from your `.env` file):
     ```
     EXPO_PUBLIC_SUPABASE_URL=https://acsbqayfnrazspwuhyep.supabase.co
     EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjc2JxYXlmbnJhenNwd3VoeWVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNTQ3NDYsImV4cCI6MjA3ODczMDc0Nn0.jsJ9VdOALl4NgI83knmFwfP9Xe_aMqonqqSMlg9jAXQ
     EXPO_PUBLIC_WINELABS_API_KEY=d71dd0cb-2f37-4db5-8f7a-6937720852da
     EXPO_PUBLIC_WINELABS_USER_ID=<your-uuid>
     EXPO_PUBLIC_OPENAI_API_KEY=<your-key>
     ```

6. **Redeploy** after adding variables (or they'll be added automatically on next deploy)

## Method 2: CLI (If you prefer)

1. **Login**:
   ```bash
   vercel login
   ```
   (Opens browser for authentication)

2. **Deploy**:
   ```bash
   npm run deploy:vercel
   ```

3. **Add Environment Variables**:
   ```bash
   vercel env add EXPO_PUBLIC_SUPABASE_URL
   vercel env add EXPO_PUBLIC_SUPABASE_ANON_KEY
   # ... etc
   ```

## Your App Will Be Live At:

**Main Production URLs (stable, always points to latest):**
- `https://wine-scanner-flax.vercel.app` ⭐ **Use this one!**
- `https://wine-scanner-seanxmuses-projects.vercel.app`
- `https://wine-scanner-seanxmuse-seanxmuses-projects.vercel.app`

**Project Dashboard:** https://vercel.com/seanxmuses-projects/wine-scanner

**Note:** The main production URLs above always point to your latest deployment. Each deployment also gets a unique URL (e.g., `wine-scanner-mme11v94y-seanxmuses-projects.vercel.app`), but the main URLs are what you should use for production.

## ✅ Deployment Status (CLI Method - Completed)
- ✅ GitHub authentication: `seanxmuse`
- ✅ Vercel authentication: `seanxmuse`
- ✅ Project linked to GitHub: `https://github.com/seanxmuse/wine-ai`
- ✅ Latest deployment: Ready (Production)
- ⚠️ **Action Required:** Add environment variables in Vercel dashboard

## Next Steps After Deployment:

1. ✅ Test authentication (sign up/sign in)
2. ✅ Test camera/image upload
3. ✅ Test wine scanning
4. ✅ Create storage bucket in Supabase (if not done)
   - Go to Supabase → Storage → New Bucket → `wine-lists` (private)

