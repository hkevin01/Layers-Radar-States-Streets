#!/bin/bash

# NEXRAD Weather Radar Setup Script
# Quick setup for the weather radar application

echo "🌦️  Setting up NEXRAD Weather Radar Application..."

# Check if we're in the right directory
if [ ! -f "public/weather-radar.html" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    echo "   Expected to find: public/weather-radar.html"
    exit 1
fi

echo "✅ Found weather radar application files"

# Check for required commands
commands=("python3" "node" "npx")
missing_commands=()

for cmd in "${commands[@]}"; do
    if ! command -v "$cmd" &> /dev/null; then
        missing_commands+=("$cmd")
    fi
done

# Start a simple HTTP server
echo ""
echo "🚀 Starting development server..."

if command -v python3 &> /dev/null; then
    echo "   Using Python 3 HTTP server"
    echo "   Open your browser to: http://localhost:8000/public/weather-radar.html"
    echo ""
    echo "   Press Ctrl+C to stop the server"
    echo ""
    cd "$(dirname "$0")"
    python3 -m http.server 8000
elif command -v node &> /dev/null && command -v npx &> /dev/null; then
    echo "   Using Node.js HTTP server"
    echo "   Open your browser to: http://localhost:8000/public/weather-radar.html"
    echo ""
    echo "   Press Ctrl+C to stop the server"
    echo ""
    npx http-server -p 8000
else
    echo "❌ No suitable HTTP server found"
    echo ""
    echo "Please install one of the following:"
    echo "   - Python 3: https://python.org"
    echo "   - Node.js: https://nodejs.org"
    echo ""
    echo "Then run this script again, or serve the files manually:"
    echo "   python3 -m http.server 8000"
    echo "   npx http-server -p 8000"
    echo ""
    echo "Then open: http://localhost:8000/public/weather-radar.html"
    exit 1
fi
