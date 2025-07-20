#!/bin/bash

# API Testing Script for Multi-Blog API
# Usage: ./test_api.sh

API_BASE="http://localhost:3000"

echo "🧪 Testing Multi-Blog API"
echo "=========================="
echo "Available domains:"
echo "- tech.localhost (TechInsights)"
echo "- lifestyle.localhost (LifeStyle Hub)" 
echo "- business.localhost (BizWorks)"
echo ""

# Test 1: Basic connectivity with tech domain
echo "📍 Test 1: Basic connectivity (tech.localhost)"
curl -X GET "$API_BASE/" \
  -H "Host: tech.localhost" \
  -v

echo -e "\n\n"

# Test 2: Get Blog Posts (public endpoint) - tech domain
echo "📍 Test 2: Get blog posts (tech.localhost)"
curl -X GET "$API_BASE/api/posts" \
  -H "Host: tech.localhost" \
  -H "Content-Type: application/json" \
  -v

echo -e "\n\n"

# Test 3: Get Analytics Overview (needs auth) - tech domain
echo "📍 Test 3: Analytics overview (tech.localhost - will likely fail without auth)"
curl -X GET "$API_BASE/api/analytics/overview" \
  -H "Host: tech.localhost" \
  -H "Content-Type: application/json" \
  -v

echo -e "\n\n"

# Test 4: Admin posts (needs auth) - tech domain
echo "📍 Test 4: Admin posts (tech.localhost - will likely fail without auth)"
curl -X GET "$API_BASE/admin/posts" \
  -H "Host: tech.localhost" \
  -H "Content-Type: application/json" \
  -v

echo -e "\n\n"

# Test 5: Test lifestyle domain
echo "📍 Test 5: Get blog posts (lifestyle.localhost)"
curl -X GET "$API_BASE/api/posts" \
  -H "Host: lifestyle.localhost" \
  -H "Content-Type: application/json" \
  -v

echo -e "\n\n"

# Test 6: Test business domain
echo "📍 Test 6: Get blog posts (business.localhost)"
curl -X GET "$API_BASE/api/posts" \
  -H "Host: business.localhost" \
  -H "Content-Type: application/json" \
  -v

echo -e "\n\n"

# Test 7: Search functionality - tech domain
echo "📍 Test 7: Search posts (tech.localhost)"
curl -X GET "$API_BASE/api/search?q=test" \
  -H "Host: tech.localhost" \
  -H "Content-Type: application/json" \
  -v

echo -e "\n\n"

# Test 8: Create a test post (will fail without auth)
echo "📍 Test 8: Create post (tech.localhost - will fail without auth)"
curl -X POST "$API_BASE/admin/posts" \
  -H "Host: tech.localhost" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Post via cURL",
    "content": "This is a test post content created via cURL",
    "category": "AI",
    "slug": "test-post-curl",
    "status": "draft"
  }' \
  -v

echo -e "\n\n"

echo "✅ API tests completed!"
echo "Note: Many endpoints require authentication and will return 401/403 errors"
echo "Check the server logs for detailed error information"
