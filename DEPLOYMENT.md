# Deployment Guide

This guide covers deploying the Wine Scanner app to production.

## Deployment Options

### Option 1: Expo Hosting (Recommended - Simplest, All-in-One)

Expo Hosting is the simplest way to deploy your Expo web app. It's free and works seamlessly with your Expo project.

#### Prerequisites
- Expo account (free) - sign up at [expo.dev](https://expo.dev)
- EAS CLI installed: `npm install -g eas-cli`

#### Steps

1. **Login to Expo**
   ```bash
   eas login
   ```

2. **Build for Web**
   ```bash
   npm run build:web
   ```

3. **Deploy to Expo Hosting**
   ```bash
   npx expo publish --platform web
   ```
   
   Or use EAS:
   ```bash
   eas update --branch production --platform web
   ```

4. **Set Environment Variables** (if needed)
   - Go to [expo.dev](https://expo.dev) → Your Project → Secrets
   - Add your environment variables (they'll be available as `EXPO_PUBLIC_*`)

Your app will be available at: `https://your-project.exp.direct` or a custom domain you configure.

### Option 2: Vercel (Best for Web)

Vercel provides excellent hosting for Expo web apps with automatic deployments.

#### Prerequisites
- Vercel account (free tier available)
- Vercel CLI: `npm install -g vercel`

#### Steps

1. **Install Vercel CLI** (if not installed)
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   npm run deploy:web
   ```
   
   Or use the Vercel dashboard:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your Git repository
   - Vercel will auto-detect Expo and configure it

4. **Set Environment Variables**
   In Vercel Dashboard → Project Settings → Environment Variables:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://acsbqayfnrazspwuhyep.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   EXPO_PUBLIC_WINELABS_API_KEY=d71dd0cb-2f37-4db5-8f7a-6937720852da
   EXPO_PUBLIC_WINELABS_USER_ID=your-uuid
   EXPO_PUBLIC_OPENAI_API_KEY=your-openai-key
   ```

### Option 3: Netlify

Similar to Vercel, great for static web hosting.

#### Steps

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login**
   ```bash
   netlify login
   ```

3. **Deploy**
   ```bash
   npm run build:web
   netlify deploy --prod --dir=dist
   ```

4. **Set Environment Variables**
   In Netlify Dashboard → Site Settings → Environment Variables

### Option 4: Mobile Apps (iOS/Android)

For native mobile apps:

1. **Build with EAS**
   ```bash
   # iOS
   npm run build:ios
   
   # Android
   npm run build:android
   ```

2. **Submit to App Stores**
   ```bash
   # iOS (App Store)
   eas submit --platform ios
   
   # Android (Google Play)
   eas submit --platform android
   ```

## Environment Variables

Make sure to set these in your hosting platform:

### Required
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Optional (for full functionality)
- `EXPO_PUBLIC_WINELABS_API_KEY`
- `EXPO_PUBLIC_WINELABS_USER_ID`
- `EXPO_PUBLIC_OPENAI_API_KEY` or `EXPO_PUBLIC_ANTHROPIC_API_KEY`

## Post-Deployment Checklist

- [ ] Verify Supabase connection works
- [ ] Test authentication (sign up/sign in)
- [ ] Test camera/image upload (requires HTTPS)
- [ ] Test wine scanning functionality
- [ ] Verify API keys are working
- [ ] Check error logs in hosting platform
- [ ] Test on mobile devices

## Troubleshooting

### Build Fails
- Check Node.js version (requires 18+)
- Clear cache: `npx expo start -c`
- Check environment variables are set

### Camera Not Working
- Camera requires HTTPS in production
- Check browser permissions
- Verify `expo-camera` is properly configured

### API Errors
- Verify environment variables are set correctly
- Check API quotas haven't been exceeded
- Review error logs in hosting platform

## Quick Deploy Commands

```bash
# Vercel (one command)
npm run deploy:web

# Expo Hosting
npm run build:web && eas publish --platform web

# Netlify
   npm run build:web && netlify deploy --prod --dir=dist
```

