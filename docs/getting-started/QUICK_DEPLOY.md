# Quick Deploy Guide

Get your Wine Scanner app live in minutes!

## Prerequisites

✅ Supabase database is set up (tables created)  
✅ App switched to real Supabase (done)  
✅ Environment variables configured  

## Step 1: Create Storage Bucket (2 minutes)

1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Name: `wine-lists`
4. Make it **Private** (uncheck "Public bucket")
5. Click "Create bucket"

OR run this SQL in SQL Editor:
```sql
-- See scripts/create-storage-bucket.sql
```

## Step 2: Build the App

Test the build locally first:
```bash
npm run build:web
```

This creates a `dist/` folder with your production-ready app.

## Step 3: Choose Deployment Platform

### Option A: Expo Hosting (Recommended - Simplest)

Since you're already using Expo, this is the easiest option:

1. **Install EAS CLI** (if needed):
   ```bash
   npm install -g eas-cli
   ```

2. **Login**:
   ```bash
   eas login
   ```

3. **Deploy**:
   ```bash
   npm run build:web
   npx expo publish --platform web
   ```

4. **Set Environment Variables** (optional):
   - Go to [expo.dev](https://expo.dev) → Your Project → Secrets
   - Add environment variables if needed

5. **Done!** Your app will be live at `https://your-project.exp.direct`

### Option B: Vercel (Alternative - More Features)

1. **Install Vercel CLI** (if needed):
   ```bash
   npm install -g vercel
   ```

2. **Login**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   npm run deploy:web
   ```

4. **Set Environment Variables** in Vercel Dashboard:
   - Go to your project → Settings → Environment Variables
   - Add all `EXPO_PUBLIC_*` variables from your `.env` file

5. **Done!** Your app will be live at `https://your-project.vercel.app`

### Option B: Expo Hosting

1. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```

2. **Login**:
   ```bash
   eas login
   ```

3. **Build and Publish**:
   ```bash
   npm run build:web
   eas publish --platform web
   ```

### Option C: Netlify

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Login**:
   ```bash
   netlify login
   ```

3. **Deploy**:
   ```bash
   npm run build:web
   netlify deploy --prod --dir=web-build
   ```

## Step 4: Set Environment Variables

In your hosting platform, add these environment variables:

```
EXPO_PUBLIC_SUPABASE_URL=https://acsbqayfnrazspwuhyep.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjc2JxYXlmbnJhenNwd3VoeWVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNTQ3NDYsImV4cCI6MjA3ODczMDc0Nn0.jsJ9VdOALl4NgI83knmFwfP9Xe_aMqonqqSMlg9jAXQ
EXPO_PUBLIC_WINELABS_API_KEY=d71dd0cb-2f37-4db5-8f7a-6937720852da
EXPO_PUBLIC_WINELABS_USER_ID=<your-uuid>
EXPO_PUBLIC_OPENAI_API_KEY=<your-key>
```

## Step 5: Test Your Live App

1. Visit your deployed URL
2. Sign up with email/password
3. Test camera/image upload
4. Scan a wine list!

## Troubleshooting

**Build fails?**
- Make sure Node.js 18+ is installed
- Run `npm install` first
- Check for TypeScript errors

**Environment variables not working?**
- Must start with `EXPO_PUBLIC_`
- Restart build after adding variables
- Check hosting platform logs

**Camera not working?**
- Requires HTTPS (automatic on Vercel/Netlify)
- Check browser permissions
- Test on mobile device

## Next Steps

- Set up custom domain (optional)
- Configure CDN caching
- Set up monitoring/analytics
- Enable CI/CD for automatic deployments

