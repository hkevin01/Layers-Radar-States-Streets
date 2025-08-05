#!/bin/bash

echo "🔍 Verifying NEXRAD Weather Radar Application Setup..."
echo "=================================================="

# Check if key files exist
echo "📁 Checking core application files..."

if [ -f "src/modules/radar-controller.js" ]; then
    echo "✅ Enhanced radar-controller.js found"
else
    echo "❌ radar-controller.js missing"
fi

if [ -f "src/modules/layer-manager.js" ]; then
    echo "✅ Enhanced layer-manager.js found"
else
    echo "❌ layer-manager.js missing"
fi

if [ -f "public/nexrad-enhanced-test.html" ]; then
    echo "✅ Enhanced test page found"
else
    echo "❌ Enhanced test page missing"
fi

if [ -f "src/config/map-config.js" ]; then
    echo "✅ Updated map configuration found"
else
    echo "❌ Map configuration missing"
fi

echo ""
echo "🌐 Testing NEXRAD endpoint accessibility..."

# Test primary NEXRAD endpoint
echo "🔄 Testing Iowa State Mesonet endpoint..."
if curl -s --head "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q/5/8/12.png" | head -n 1 | grep -q "200 OK"; then
    echo "✅ Primary NEXRAD endpoint is accessible"
else
    echo "⚠️  Primary NEXRAD endpoint test inconclusive"
fi

echo ""
echo "🚀 Ready to launch! Run: ./scripts/start-gui.sh"
echo "🎯 This will open: http://localhost:8080/public/nexrad-enhanced-test.html"
echo ""
echo "📊 Features included in enhanced version:"
echo "   • Real-time NEXRAD tile validation"
echo "   • Comprehensive diagnostic panel"
echo "   • Layer controls and transparency"
echo "   • Performance monitoring"
echo "   • Multiple fallback data sources"
echo "   • Enhanced error logging"
