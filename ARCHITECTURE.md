# Architecture Overview

## Backend: Supabase

Supabase handles all backend services:

- **Database**: PostgreSQL (profiles, scans, wine_results, favorites, wine_cache tables)
- **Authentication**: User sign up, sign in, sessions
- **Storage**: Wine list images (wine-lists bucket)
- **Row Level Security**: Policies for data access control

**Why Supabase?**
- Free tier available
- PostgreSQL database
- Built-in authentication
- File storage
- Real-time capabilities
- All backend needs in one service

## Frontend: Expo Web App

The React Native/Expo app runs as a web application and needs hosting.

**Why separate hosting?**
- Supabase = Backend services (database, auth, storage)
- Frontend hosting = Serves your React/JavaScript app to users' browsers
- These are different services that work together

## Deployment Options

### Option 1: Expo Hosting (Recommended)
- **Backend**: Supabase ✅
- **Frontend**: Expo Hosting ✅
- **Why**: Simplest, works seamlessly with Expo projects, free tier

### Option 2: Vercel/Netlify
- **Backend**: Supabase ✅
- **Frontend**: Vercel or Netlify ✅
- **Why**: More features, better performance, custom domains

### Option 3: Self-Hosted
- **Backend**: Supabase ✅
- **Frontend**: Your own server ✅
- **Why**: Full control, but requires server management

## How They Work Together

```
User's Browser
    ↓
Frontend (Expo Hosting/Vercel/Netlify)
    ↓ (API calls)
Backend (Supabase)
    ├── Database (PostgreSQL)
    ├── Auth (User management)
    └── Storage (File uploads)
```

## Summary

- **Supabase** = Your backend (database, auth, storage) ✅ Already set up
- **Expo Hosting/Vercel/Netlify** = Your frontend hosting (serves the web app)
- They work together - frontend calls Supabase APIs

You can't host the frontend on Supabase because Supabase doesn't provide frontend hosting - it's a backend-as-a-service platform.


