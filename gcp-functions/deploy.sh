#!/bin/bash

# Deploy Wine Labs proxy to Google Cloud Functions
# This uses GCP's free tier (2M invocations/month)

set -e

GCLOUD_PATH="/Users/seanx/Downloads/google-cloud-sdk/bin/gcloud"
PROJECT_ID="meta-will-470204-j5"  # Using your existing project
REGION="us-central1"
FUNCTION_NAME="winelabs-proxy"

# Wine Labs credentials from .env
WINELABS_API_KEY="d71dd0cb-2f37-4db5-8f7a-6937720852da"
WINELABS_USER_ID="d71dd0cb-2f37-4db5-8f7a-6937720852da"

echo "🚀 Deploying Wine Labs Proxy to GCP Cloud Functions"
echo "=================================================="
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Function: $FUNCTION_NAME"
echo ""

# Set project
echo "📋 Setting GCP project..."
$GCLOUD_PATH config set project $PROJECT_ID

# Enable required APIs (will skip if already enabled)
echo "🔧 Enabling required APIs..."
$GCLOUD_PATH services enable cloudfunctions.googleapis.com --quiet
$GCLOUD_PATH services enable cloudbuild.googleapis.com --quiet
$GCLOUD_PATH services enable run.googleapis.com --quiet
$GCLOUD_PATH services enable artifactregistry.googleapis.com --quiet

echo "⏳ Waiting for APIs to be ready..."
sleep 5

# Deploy function
echo "📦 Deploying function..."
cd "$(dirname "$0")/winelabs-proxy"

$GCLOUD_PATH functions deploy $FUNCTION_NAME \
  --gen2 \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point winelabsProxy \
  --set-env-vars WINELABS_API_KEY=$WINELABS_API_KEY,WINELABS_USER_ID=$WINELABS_USER_ID \
  --region $REGION \
  --memory 256MB \
  --timeout 60s \
  --quiet

# Get function URL
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📍 Function URL:"
FUNCTION_URL=$($GCLOUD_PATH functions describe $FUNCTION_NAME --region $REGION --gen2 --format="value(serviceConfig.uri)")
echo "$FUNCTION_URL"

echo ""
echo "🧪 Testing function..."
cd ../../
GCP_PROXY_URL=$FUNCTION_URL node scripts/test-gcp-proxy.js

echo ""
echo "✅ Done! If tests passed, update src/services/winelabs.ts to use this URL"
