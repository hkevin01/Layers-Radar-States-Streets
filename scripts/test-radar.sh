#!/bin/bash

# Quick test script for the weather radar application
echo "🧪 Testing Weather Radar Application..."

# Check if we're in the right directory
if [ ! -f "public/weather-radar-debug.html" ]; then
    echo "❌ Error: Run this from the project root directory"
    exit 1
fi

echo "✅ Found weather radar debug application"

# Start the Python server in the background
echo "🐍 Starting Python server..."
cd "$(dirname "$0")"
python3 scripts/server.py &
SERVER_PID=$!

# Give the server time to start
sleep 3

# Test if the server is responding
echo "🔍 Testing server connectivity..."
if curl -s -f http://localhost:8080/public/weather-radar-debug.html > /dev/null; then
    echo "✅ Server is responding!"
    echo "🌐 Open http://localhost:8080/public/weather-radar-debug.html to test the radar"

    # Test NEXRAD endpoint
    echo "🌦️ Testing NEXRAD endpoint..."
    if curl -s -f -I "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q/5/8/12.png" > /dev/null; then
        echo "✅ NEXRAD endpoint is working!"
    else
        echo "⚠️ NEXRAD endpoint test failed"
    fi

    echo ""
    echo "🎯 Manual Testing Instructions:"
    echo "1. Open http://localhost:8080/public/weather-radar-debug.html"
    echo "2. Check that the base map loads"
    echo "3. Click 'Test NEXRAD Services' button"
    echo "4. Verify weather radar layers appear"
    echo "5. Press Ctrl+C when done testing"
    echo ""

    # Keep the server running until user stops it
    wait $SERVER_PID
else
    echo "❌ Server failed to start or is not responding"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi
