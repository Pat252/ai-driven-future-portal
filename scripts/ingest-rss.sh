#!/bin/bash

# RSS Ingestion Trigger Script
# 
# Usage:
#   ./scripts/ingest-rss.sh [environment]
# 
# Examples:
#   ./scripts/ingest-rss.sh local
#   ./scripts/ingest-rss.sh production

ENVIRONMENT=${1:-local}

if [ "$ENVIRONMENT" = "local" ]; then
  URL="http://localhost:3000/api/ingest"
  echo "🔄 Triggering RSS ingestion on LOCAL..."
elif [ "$ENVIRONMENT" = "production" ]; then
  URL="https://aidrivenfuture.ca/api/ingest"
  echo "🔄 Triggering RSS ingestion on PRODUCTION..."
else
  echo "❌ Unknown environment: $ENVIRONMENT"
  echo "Usage: ./scripts/ingest-rss.sh [local|production]"
  exit 1
fi

echo "📡 Sending POST request to: $URL"
echo ""

curl -X POST "$URL" \
  -H "Content-Type: application/json" \
  -w "\n\n📊 HTTP Status: %{http_code}\n⏱️  Time: %{time_total}s\n" \
  -s | jq '.'

echo ""
echo "✅ Ingestion request sent"

