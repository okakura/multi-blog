#!/bin/bash

# Updated curl tests for Multi-Blog API
# Usage: ./updated_curl_tests.sh

API_BASE="http://localhost:3000"

echo "🧪 Updated Multi-Blog API Tests"
echo "==============================="

echo "✅ WORKING ENDPOINTS:"
echo "--------------------"
echo "📍 Debug endpoint (no middleware)"
curl -s -w " → Status: %{http_code}\n" "$API_BASE/debug"

echo "📍 Health endpoint (no middleware)"
curl -s -w " → Status: %{http_code}\n" "$API_BASE/health"

echo "📍 Domain middleware test (domain middleware only)"
curl -s -w " → Status: %{http_code}\n" "$API_BASE/test-domain" -H "Host: localhost"

echo ""
echo "❌ STILL BROKEN ENDPOINTS:"
echo "---------------------------"
echo "📍 Posts endpoint (domain + analytics middleware)"
curl -s -w " → Status: %{http_code}\n" "$API_BASE/posts" -H "Host: localhost"

echo "📍 Home endpoint (domain + analytics middleware)"
curl -s -w " → Status: %{http_code}\n" "$API_BASE/" -H "Host: localhost"

echo ""
echo "📍 Admin posts (domain + analytics + auth middleware)"
curl -s -w " → Status: %{http_code}\n" "$API_BASE/admin/posts" -H "Host: localhost"

echo ""
echo "🔧 PROGRESS:"
echo "✅ Domain middleware: FIXED (json/jsonb type issue)"
echo "❌ Analytics middleware: LIKELY BROKEN"
echo "❌ Auth middleware: NEEDS TESTING"
echo ""
echo "🎯 Next: Fix analytics middleware, then test auth with proper tokens"
