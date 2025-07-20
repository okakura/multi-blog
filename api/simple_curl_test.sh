#!/bin/bash

# Simple curl test script
# Usage: ./simple_curl_test.sh

API_BASE="http://localhost:3000"

echo "🧪 Simple API Tests"
echo "=================="

echo "📍 Test 1: Home endpoint (localhost domain)"
curl -s -w "\nStatus: %{http_code}\n" "$API_BASE/" -H "Host: localhost"

echo -e "\n📍 Test 2: Posts endpoint (localhost domain)"
curl -s -w "\nStatus: %{http_code}\n" "$API_BASE/posts" -H "Host: localhost"

echo -e "\n📍 Test 3: Home endpoint (tech.localhost domain)"
curl -s -w "\nStatus: %{http_code}\n" "$API_BASE/" -H "Host: tech.localhost"

echo -e "\n📍 Test 4: Posts endpoint (tech.localhost domain)"
curl -s -w "\nStatus: %{http_code}\n" "$API_BASE/posts" -H "Host: tech.localhost"

echo -e "\n📍 Test 5: Search endpoint (localhost domain)"
curl -s -w "\nStatus: %{http_code}\n" "$API_BASE/search?q=test" -H "Host: localhost"

echo -e "\n📍 Test 6: Admin posts (should fail without auth)"
curl -s -w "\nStatus: %{http_code}\n" "$API_BASE/admin/posts" -H "Host: localhost"

echo -e "\n📍 Test 7: Analytics (should fail without auth)"
curl -s -w "\nStatus: %{http_code}\n" "$API_BASE/analytics/overview" -H "Host: localhost"

echo -e "\n✅ All tests completed"
