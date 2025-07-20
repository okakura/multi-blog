#!/bin/bash

# Debug API test - create a minimal test endpoint
echo "🔧 Creating a minimal test endpoint..."

# Let's test if we can create a basic route without middleware
curl -s -w "\nStatus: %{http_code}\n" "http://localhost:3000/debug" -H "Host: localhost"

echo "If this also returns 500, the issue is deeper in the application setup."
