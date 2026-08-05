#!/bin/bash

echo "=== Vehicle Information System Cluster Synthetic Health Check ==="
GATEWAY_URL="http://localhost:3000/api/v1/health"

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$GATEWAY_URL" || echo "000")

if [ "$RESPONSE" -eq 200 ]; then
  echo "✅ API Gateway Health Check PASSED (HTTP 200)"
else
  echo "❌ API Gateway Health Check FAILED (HTTP $RESPONSE)"
  exit 1
fi
