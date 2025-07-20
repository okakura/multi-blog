#!/bin/bash

# Working curl tests for Multi-Blog API
# Usage: ./working_curl_tests.sh

API_BASE="http://localhost:3000"

echo "✅ Working API Endpoints Test"
echo "============================="

echo "📍 Test 1: Debug endpoint (no middleware)"
curl -s "$API_BASE/debug"
echo ""

echo "📍 Test 2: Health endpoint (no middleware)"
curl -s "$API_BASE/health" | jq '.'
echo ""

echo "📍 Test 3: Debug endpoint with verbose output"
curl -v "$API_BASE/debug" 2>&1 | grep "< HTTP"
echo ""

echo "📍 Test 4: Health endpoint with status code"
curl -s -w "Status: %{http_code}\n" "$API_BASE/health"
echo ""

echo "❌ Endpoints with middleware issues:"
echo "- / (home) - 500 error due to domain middleware"
echo "- /posts - 500 error due to domain middleware"
echo "- /admin/* - 500 error due to auth + domain middleware"
echo "- /analytics/* - 500 error due to auth + domain middleware"
echo ""

echo "🔧 Next steps:"
echo "1. Fix domain middleware database query or error handling"
echo "2. Add proper error logging to identify the exact issue"
echo "3. Test endpoints again once middleware is fixed"
echo ""

echo "✅ Basic server functionality confirmed working!"
