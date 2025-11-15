#!/bin/bash

# Setup Supabase schema using CLI
# Run this script after logging in to Supabase CLI

set -e

PROJECT_REF="acsbqayfnrazspwuhyep"

echo "🚀 Setting up Supabase schema..."
echo ""

# Check if logged in
if ! npx supabase projects list &>/dev/null; then
    echo "⚠️  Not logged in to Supabase CLI"
    echo ""
    echo "Please login first:"
    echo "  npx supabase login"
    echo ""
    echo "This will open your browser to authenticate."
    exit 1
fi

echo "✅ Authenticated with Supabase CLI"
echo ""

# Link project
echo "🔗 Linking to project..."
npx supabase link --project-ref "$PROJECT_REF"

echo ""
echo "📤 Pushing migrations..."
npx supabase db push

echo ""
echo "✅ Schema setup complete!"
echo ""
echo "📊 Database tables created:"
echo "   - profiles"
echo "   - scans"
echo "   - wine_results"
echo "   - favorites"
echo "   - wine_cache"

