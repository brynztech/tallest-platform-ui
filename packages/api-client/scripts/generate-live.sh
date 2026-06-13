#!/bin/bash
set -e
BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"
SCHEMA_URL="$BACKEND_URL/openapi.json"
SNAPSHOT="packages/api-client/openapi.json"
OUTPUT="packages/api-client/src/types/api.d.ts"

echo "Fetching schema from $SCHEMA_URL..."
curl -sf "$SCHEMA_URL" -o "$SNAPSHOT"

echo "Generating TypeScript types..."
npx openapi-typescript "$SNAPSHOT" -o "$OUTPUT"

echo "Done. Schema snapshot updated at $SNAPSHOT"
