#!/bin/bash

# Tile Loading Fix Verification Script
echo "🔧 Verifying Tile Loading Fixes"
echo "==============================="

# Test if server is accessible
echo "Testing server accessibility..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8082/public/weather-radar.html | grep -q "200"; then
    echo "✅ Weather radar app is accessible"
else
    echo "❌ Weather radar app is not accessible"
    exit 1
fi

# Test if the updated JavaScript is being served
echo "Testing updated JavaScript..."
if curl -s http://localhost:8082/public/js/weather-init-global.js | grep -q "Bing Maps URL generation error"; then
    echo "✅ Updated Bing Maps error handling found"
else
    echo "❌ Updated Bing Maps error handling not found"
fi

if curl -s http://localhost:8082/public/js/weather-init-global.js | grep -q "tileLoadFunction"; then
    echo "✅ Enhanced radar tile loading found"
else
    echo "❌ Enhanced radar tile loading not found"
fi

if curl -s http://localhost:8082/public/js/weather-init-global.js | grep -q "ESRI World Street Map"; then
    echo "✅ ESRI fallback for MapTiler found"
else
    echo "❌ ESRI fallback for MapTiler not found"
fi

# Test external tile services
echo "Testing external tile services..."

# Google tiles
if curl -s -o /dev/null -w "%{http_code}" "https://mt1.google.com/vt/lyrs=s&x=8&y=6&z=4" | grep -q "200"; then
    echo "✅ Google satellite tiles accessible"
else
    echo "⚠️ Google satellite tiles may have issues"
fi

# ESRI tiles
if curl -s -o /dev/null -w "%{http_code}" "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/6/8" | grep -q "200"; then
    echo "✅ ESRI satellite tiles accessible"
else
    echo "⚠️ ESRI satellite tiles may have issues"
fi

# NEXRAD tiles
if curl -s -o /dev/null -w "%{http_code}" "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/4/8/6.png" | grep -q "200"; then
    echo "✅ NEXRAD radar tiles accessible"
else
    echo "⚠️ NEXRAD radar tiles may have issues"
fi

echo ""
echo "🎯 Recommended Testing Steps:"
echo "1. Open http://localhost:8082/public/weather-radar.html"
echo "2. Try switching between different base layers"
echo "3. Check browser console for any remaining errors"
echo "4. Open http://localhost:8082/tile-diagnostics.html for detailed testing"
echo ""
echo "🔧 If issues persist:"
echo "- Check browser network tab for failed requests"
echo "- Try different base layers (Google should work best)"
echo "- Refresh the page to clear any cached errors"
