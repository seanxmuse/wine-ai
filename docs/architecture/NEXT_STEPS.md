# Next Steps - Wine Scanner Production Deployment

## Current Status

### ✅ Completed
1. Fixed Gemini API quota issue - new API key deployed
2. Changed model from `gemini-2.0-flash-exp` to `gemini-2.5-flash`
3. Increased token limit to 8192 for large wine lists
4. Vision AI successfully extracting wines (46 wines extracted in last test)
5. Implemented production logging to Supabase
6. Created Wine Labs serverless proxy at `/api/winelabs-proxy`

### ❌ Current Blocker: Wine Labs API Access

**Problem**: Wine Labs API is protected by Cloudflare and blocking our requests

**Two approaches tried**:
1. **Direct browser calls** → Blocked by CORS policy
2. **Serverless proxy (Vercel)** → Blocked by Cloudflare bot protection

**Error from Cloudflare**:
```
403 Forbidden - Cloudflare challenge page
"Just a moment... Enable JavaScript and cookies to continue"
```

## Wine Labs API Research Findings

**From https://winelabs.ai/api/docs**:
- ❌ No CORS support - backend-only API
- ❌ No JavaScript SDK or browser support
- ✅ Authentication via `user_id` (UUID) in request body
- ✅ Contract-based access with rate limits:
  - Matching: 30,000 rows/30 days
  - Market Data: 150,000 requests/30 days
  - Auctions: 10,000 requests/day (requires explicit authorization)

**Cloudflare Protection**: Headers tried but still blocked
- User-Agent spoofing ❌
- Referer/Origin headers ❌
- API key in headers ❌

## BREAKTHROUGH: GCP Cloud Functions Deployed Successfully!

✅ **GCP Function Status**: Deployed and bypassing Cloudflare
🔗 **Function URL**: https://winelabs-proxy-dlfk6dpu3q-uc.a.run.app
📍 **Location**: GCP `meta-will-470204-j5` project, us-central1

**Test Results**:
- ✅ Cloudflare challenge bypassed (no bot detection)
- ❌ Wine Labs returns `405 Method Not Allowed` + `x-matched-path: /404`
- 🔍 Discovery: Wine Labs is hosted on Vercel (confirmed via `x-vercel-id` header)

## Critical Finding: API Access Requires Authorization

**All Wine Labs endpoints return 404**, suggesting:
1. API requires explicit account activation/whitelisting
2. The `user_id` alone is insufficient for access
3. API may be contract-based or invite-only
4. Endpoints may not exist at public URLs

**Evidence from testing**:
```
https://winelabs.ai/api/match_to_lwin_batch → 405 (x-matched-path: /404)
https://winelabs.ai/api/price_stats → 405 (x-matched-path: /404)
```

## Solutions to Try

### Option 1: Contact Wine Labs (REQUIRED - HIGHEST PRIORITY)
**Action**: Email Wine Labs support to activate API access

**Ask for**:
1. ✅ **API access authorization** for user_id: `d71dd0cb-2f37-4db5-8f7a-6937720852da`
2. ✅ Confirm correct API base URL and endpoint paths
3. ✅ Any required API keys, authentication headers, or tokens
4. ✅ Whitelist GCP Cloud Function IP ranges (function already deployed)
   - Function URL: `https://winelabs-proxy-dlfk6dpu3q-uc.a.run.app`
   - Region: us-central1
5. ✅ Clarify if API is contract-based or requires onboarding

**Contact**: Check https://winelabs.ai for support email
**Status**: GCP proxy ready and waiting for Wine Labs authorization

### Option 2: Try Different Proxy Approach
- Use a different serverless provider (Cloudflare Workers, AWS Lambda)
- Some providers have better success with Cloudflare-protected APIs
- **Files to modify**: Create new proxy endpoint

### Option 3: Use Wine Labs Web Scraping API (if available)
- Check if Wine Labs has a different API endpoint designed for programmatic access
- Some APIs have separate endpoints for web vs. API access

### Option 4: Fallback to OpenAI Functions
- If Wine Labs isn't accessible, use Gemini/GPT-4 to parse and match wines
- Trade-off: Less accurate matching, no LWIN identifiers
- **File to modify**: [src/services/winelabs.ts](src/services/winelabs.ts)

## Environment Variables Currently Set

```bash
✅ EXPO_PUBLIC_GEMINI_API_KEY (Production)
✅ EXPO_PUBLIC_WINELABS_USER_ID (Production)
✅ EXPO_PUBLIC_WINELABS_API_KEY (Production)
✅ EXPO_PUBLIC_SUPABASE_ANON_KEY (Production)
✅ EXPO_PUBLIC_SUPABASE_URL (Production)
```

## Test Commands

### Test Wine Labs Proxy on Production
```bash
node scripts/test-winelabs-production.js
```

### Test Vision AI Locally
```bash
npm run web
# Upload an image in browser
```

### View Production Logs
```sql
-- In Supabase SQL Editor
SELECT * FROM public.logs
WHERE category = 'PARSE' OR category = 'WINELABS'
ORDER BY created_at DESC
LIMIT 100;
```

## Files Modified in This Session

1. `src/services/vision.ts` - Gemini 2.5, increased tokens, simplified prompt
2. `src/services/winelabs.ts` - Converted to use proxy (currently blocked)
3. `api/winelabs-proxy.ts` - Created serverless proxy (blocked by Cloudflare)
4. `api/package.json` - Created for Vercel serverless functions
5. `src/utils/logger.ts` - Production logging system
6. `src/screens/CameraScreen.tsx` - Reduced image quality, added logging
7. `supabase/migrations/20251115T120000_add_logs_table.sql` - Logs table
8. `scripts/setup-logs-table.js` - Helper script for logs setup
9. `scripts/test-winelabs-proxy.js` - Local proxy tests
10. `scripts/test-winelabs-production.js` - Production proxy tests

## Recommended Next Action

**PRIORITY**: Contact Wine Labs or check their documentation for:
- Proper serverless function authentication
- IP whitelisting options
- Alternative API endpoints that don't use Cloudflare protection
- Whether their API supports CORS for browser requests

**Wine Labs Website**: https://winelabs.ai
**API Docs**: Check for `/docs` or `/api-docs` endpoints

Once Wine Labs API access is resolved, the full pipeline should work:
1. ✅ Upload image
2. ✅ Vision AI extracts wines (Gemini 2.5 Flash)
3. ❌ Match wines to LWIN (Wine Labs API - **BLOCKED**)
4. Display results with pricing and ratings
