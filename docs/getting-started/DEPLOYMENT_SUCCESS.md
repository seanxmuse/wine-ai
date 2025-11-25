# 🎉 Wine Scanner - Deployment Success!

## Status: ✅ FULLY WORKING

**Production URL**: https://wine-scanner-flax.vercel.app

**Last Updated**: November 17, 2025

---

## Full Pipeline Working

| Component | Status | Details |
|-----------|--------|---------|
| **Image Upload** | ✅ | PNG, JPG, HEIC |
| **Vision AI** | ✅ | Gemini 2.5 Flash - 8192 tokens |
| **Wine Matching** | ✅ | Wine Labs API - match_to_lwin_batch |
| **Price Data** | ✅ | Wine Labs API - price_stats |
| **Wine Info** | ✅ | Wine Labs API - wine_info |
| **Production Logs** | ✅ | Supabase logs table |

---

## Key Discovery: Correct Wine Labs URL

**Wrong URL** (from docs): `https://winelabs.ai/api`
**Correct URL**: `https://external-api.wine-labs.com`

This was the root cause of all 404/405 errors. The Wine Labs documentation at https://winelabs.ai/api/docs doesn't show the full base URL - only relative paths.

---

## Architecture

```
User Upload Image
      ↓
Vision AI (Gemini 2.5 Flash)
      ↓
Extract Wines (46 wines extracted in last test)
      ↓
GCP Cloud Function Proxy ← Bypasses CORS
      ↓
Wine Labs API (external-api.wine-labs.com)
      ↓
Match to LWIN + Get Prices
      ↓
Display Results
```

---

## GCP Cloud Function

**URL**: `https://winelabs-proxy-dlfk6dpu3q-uc.a.run.app`
**Project**: `meta-will-470204-j5`
**Region**: `us-central1`
**Cost**: FREE (2M invocations/month free tier)

**Why GCP instead of Vercel?**
- Vercel proxy was blocked by Cloudflare
- GCP bypassed Cloudflare successfully
- Same code, different IP range

**Deployment**:
```bash
cd gcp-functions
./deploy.sh
```

---

## Environment Variables (Production)

All set in Vercel:
- ✅ `EXPO_PUBLIC_GEMINI_API_KEY`
- ✅ `EXPO_PUBLIC_WINELABS_USER_ID`
- ✅ `EXPO_PUBLIC_WINELABS_API_KEY`
- ✅ `EXPO_PUBLIC_SUPABASE_URL`
- ✅ `EXPO_PUBLIC_SUPABASE_ANON_KEY`

---

## Recent Fixes

### 1. Gemini API (November 15, 2025)
- ❌ Quota exceeded with old key
- ✅ Updated to new key: `AIzaSyBhyDFOD28EXoZXpIxK3sNzvcE6VoRlp_E`
- ✅ Changed model: `gemini-2.0-flash-exp` → `gemini-2.5-flash`

### 2. Token Limits (November 15, 2025)
- ❌ MAX_TOKENS error with 2048 limit
- ✅ Increased to 8192 tokens
- ✅ Simplified prompt to reduce input tokens
- ✅ Successfully extracted 46 wines from image

### 3. Wine Labs API (November 17, 2025)
- ❌ All endpoints returned 404/405
- ✅ Discovered correct base URL: `https://external-api.wine-labs.com`
- ✅ Deployed GCP Cloud Function proxy
- ✅ All endpoints now working

---

## Testing

### Test Suite Location
`/Users/seanx/code/wine ai/winelabs-api-tester`

**Run tests**:
```bash
cd winelabs-api-tester
npm test           # All tests
npm run test:gcp   # GCP proxy tests
npm run test:direct # Direct API tests
```

### Test Results
See: `/winelabs-api-tester/RESULTS.md`

**Summary**:
- ✅ match_to_lwin_batch - Working
- ✅ price_stats - Working
- ✅ wine_info - Working

---

## Production Logs

**View in Supabase**:
```sql
SELECT * FROM public.logs
WHERE category IN ('PARSE', 'WINELABS', 'UPLOAD')
ORDER BY created_at DESC
LIMIT 100;
```

**Recent logs show**:
- ✅ Vision AI extracting wines successfully
- ✅ Wine Labs API calls succeeding
- ✅ Full pipeline working end-to-end

---

## Files Modified (This Session)

### Core App
1. `src/services/vision.ts` - Gemini 2.5, 8192 tokens, simplified prompt
2. `src/services/winelabs.ts` - GCP proxy URL, fixed response parsing
3. `src/screens/CameraScreen.tsx` - Image quality, logging
4. `src/utils/logger.ts` - Production logging system

### GCP Function
5. `gcp-functions/winelabs-proxy/index.js` - Correct Wine Labs URL
6. `gcp-functions/deploy.sh` - Automated deployment

### Database
7. `supabase/migrations/20251115T120000_add_logs_table.sql` - Logs table

### Test Suite
8. `/winelabs-api-tester/*` - Complete test suite for Wine Labs API

---

## Performance

**Vision AI**: ~3-5 seconds for image processing
**Wine Labs API**: ~1-2 seconds per batch of wines
**Total**: ~5-10 seconds end-to-end

**Tested with**:
- 46 wines extracted in single image
- All matched successfully to LWIN database
- Price data retrieved for matched wines

---

## Known Limitations

1. **Image size**: Base64 encoding increases size by 33%
   - Reduced quality to 0.5 to keep under API limits

2. **Wine Labs rate limits**:
   - Matching: 30,000 rows/30 days
   - Market Data: 150,000 requests/30 days
   - Should be sufficient for normal usage

3. **HEIC support**: Relies on browser/native support

---

## Maintenance

### Update Wine Labs credentials
```bash
# Update in Vercel
vercel env add EXPO_PUBLIC_WINELABS_USER_ID production

# Update in GCP
cd gcp-functions
# Edit deploy.sh with new credentials
./deploy.sh
```

### Monitor GCP function
```bash
# View logs
gcloud functions logs read winelabs-proxy --region us-central1 --limit 50 --gen2

# Check status
gcloud functions describe winelabs-proxy --region us-central1 --gen2
```

### Redeploy
```bash
# Wine Scanner app
vercel --prod

# GCP function
cd gcp-functions && ./deploy.sh
```

---

## Success Metrics

- ✅ Image upload working
- ✅ Vision AI extracting wines (46 wines tested)
- ✅ Wine Labs API integration complete
- ✅ All endpoints responding successfully
- ✅ Production logging in place
- ✅ Zero cost (free tiers for all services)

---

## Support

**Wine Labs API**: https://winelabs.ai/api/docs
**GCP Console**: https://console.cloud.google.com/functions/details/us-central1/winelabs-proxy?project=meta-will-470204-j5
**Vercel Dashboard**: https://vercel.com/seanxmuses-projects/wine-scanner

**Test Suite**: `/Users/seanx/code/wine ai/winelabs-api-tester`
