# Deploy Wine Labs Proxy to Google Cloud Functions

## Prerequisites

1. **Google Cloud account** with free tier activated
2. **gcloud CLI** installed ([install guide](https://cloud.google.com/sdk/docs/install))

## Setup Steps

### 1. Install gcloud CLI (if not already installed)

```bash
# macOS
brew install google-cloud-sdk

# Or download from: https://cloud.google.com/sdk/docs/install
```

### 2. Initialize gcloud and create project

```bash
# Login to Google Cloud
gcloud auth login

# Create new project (or use existing)
gcloud projects create wine-scanner-proxy --name="Wine Scanner Proxy"

# Set as active project
gcloud config set project wine-scanner-proxy

# Enable required APIs
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### 3. Deploy the function

```bash
cd gcp-functions/winelabs-proxy

# Deploy (replace with your actual credentials)
gcloud functions deploy winelabs-proxy \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point winelabsProxy \
  --set-env-vars WINELABS_API_KEY=d71dd0cb-2f37-4db5-8f7a-6937720852da,WINELABS_USER_ID=d71dd0cb-2f37-4db5-8f7a-6937720852da \
  --region us-central1 \
  --memory 256MB \
  --timeout 60s
```

### 4. Get the function URL

```bash
gcloud functions describe winelabs-proxy --region us-central1 --format="value(httpsTrigger.url)"
```

Example output:
```
https://us-central1-wine-scanner-proxy.cloudfunctions.net/winelabs-proxy
```

### 5. Update your app to use GCP proxy

In `src/services/winelabs.ts`, change:

```typescript
// OLD
const WINELABS_PROXY = '/api/winelabs-proxy';

// NEW
const WINELABS_PROXY = 'https://us-central1-wine-scanner-proxy.cloudfunctions.net/winelabs-proxy';
```

### 6. Test the proxy

```bash
# From project root
node scripts/test-gcp-proxy.js
```

## Free Tier Limits

**Google Cloud Functions Free Tier**:
- 2 million invocations/month
- 400,000 GB-seconds of compute time
- 200,000 GHz-seconds of compute time
- 5GB network egress

**Estimated usage for Wine Scanner**:
- Each wine list processing = ~5-10 API calls
- 100 wine lists/day = 500-1000 calls/day
- 15,000-30,000 calls/month (well within free tier)

## Monitoring

View logs:
```bash
gcloud functions logs read winelabs-proxy --region us-central1 --limit 50
```

View metrics:
```bash
gcloud functions describe winelabs-proxy --region us-central1
```

## Cost Optimization

The function is configured for minimal cost:
- **Memory**: 256MB (lowest tier)
- **Timeout**: 60s (enough for API calls)
- **Region**: us-central1 (lowest cost region)

## Troubleshooting

### Function not found
```bash
gcloud functions list --region us-central1
```

### Permission errors
```bash
gcloud projects add-iam-policy-binding wine-scanner-proxy \
  --member="user:$(gcloud config get-value account)" \
  --role="roles/cloudfunctions.developer"
```

### Update environment variables
```bash
gcloud functions deploy winelabs-proxy \
  --region us-central1 \
  --update-env-vars WINELABS_API_KEY=new-key,WINELABS_USER_ID=new-id
```

## Alternative: Use existing GCP project

If you already have a GCP project:

```bash
# List projects
gcloud projects list

# Set active project
gcloud config set project YOUR-PROJECT-ID

# Deploy to existing project
gcloud functions deploy winelabs-proxy \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point winelabsProxy \
  --set-env-vars WINELABS_API_KEY=d71dd0cb-2f37-4db5-8f7a-6937720852da,WINELABS_USER_ID=d71dd0cb-2f37-4db5-8f7a-6937720852da \
  --region us-central1
```
