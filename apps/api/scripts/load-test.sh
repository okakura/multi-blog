#!/bin/bash

# API Load Testing Script for Dashboard Demo
# This script generates realistic API traffic patterns

echo "🚀 Starting API load generation for dashboard demo..."
echo "Press Ctrl+C to stop"

# Array of endpoints to test
endpoints=(
    "http://localhost:8000/health"
    "http://localhost:8000/"
    "http://localhost:8000/api/posts"
    "http://localhost:8000/api/users"
    "http://localhost:8000/api/categories"
    "http://localhost:8000/api/nonexistent"  # This will generate 404s
)

# Function to make a request
make_request() {
    local endpoint=$1
    local response_code=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint")
    echo "$(date '+%H:%M:%S') - $endpoint -> $response_code"
}

# Main loop
counter=0
while true; do
    # Select random endpoint
    endpoint=${endpoints[$RANDOM % ${#endpoints[@]}]}
    
    # Make request
    make_request "$endpoint" &
    
    # Vary the sleep time to create realistic traffic patterns
    if [ $((counter % 10)) -eq 0 ]; then
        # Every 10th request, create a small burst
        sleep 0.1
    else
        # Normal interval
        sleep $(awk "BEGIN {print $RANDOM/32768 * 2 + 0.5}")  # Random between 0.5-2.5 seconds
    fi
    
    counter=$((counter + 1))
    
    # Every 50 requests, show stats
    if [ $((counter % 50)) -eq 0 ]; then
        echo "📊 Generated $counter requests..."
    fi
done
