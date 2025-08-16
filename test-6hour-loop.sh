#!/bin/bash

# 6-Hour Loop Fix Verification Script
echo "🔄 Testing 6-Hour Loop Functionality"
echo "===================================="

# Test if server is accessible
echo "Testing server accessibility..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8082/public/weather-radar.html | grep -q "200"; then
    echo "✅ Weather radar app is accessible"
else
    echo "❌ Weather radar app is not accessible"
    exit 1
fi

# Test if the updated JavaScript includes 6-hour functionality
echo "Testing 6-hour loop implementation..."
if curl -s http://localhost:8082/public/js/weather-init-global.js | grep -q "createExtended6HourTimeline"; then
    echo "✅ 6-hour timeline extension function found"
else
    echo "❌ 6-hour timeline extension function not found"
fi

if curl -s http://localhost:8082/public/js/weather-init-global.js | grep -q "Extended timeline to"; then
    echo "✅ 6-hour mode console logging found"
else
    echo "❌ 6-hour mode console logging not found"
fi

if curl -s http://localhost:8082/public/js/weather-init-global.js | grep -q "synthetic"; then
    echo "✅ Synthetic frame handling found"
else
    echo "❌ Synthetic frame handling not found"
fi

# Test if HTML includes 6-hour display enhancements
echo "Testing 6-hour display enhancements..."
if curl -s http://localhost:8082/public/weather-radar.html | grep -q "Extended"; then
    echo "✅ Extended frame display found in main app"
else
    echo "❌ Extended frame display not found in main app"
fi

if curl -s http://localhost:8082/public/apps/modern-weather-radar.html | grep -q "Extended"; then
    echo "✅ Extended frame display found in modern app"
else
    echo "❌ Extended frame display not found in modern app"
fi

# Test RainViewer API accessibility
echo "Testing RainViewer API..."
if curl -s -o /dev/null -w "%{http_code}" "https://api.rainviewer.com/public/weather-maps.json" | grep -q "200"; then
    echo "✅ RainViewer API is accessible"
else
    echo "⚠️ RainViewer API may be unreachable"
fi

echo ""
echo "🧪 Manual Testing Steps:"
echo "1. Open http://localhost:8082/public/weather-radar.html"
echo "2. Check the '6-hour loop' checkbox"
echo "3. Look for extended timeline options in the RainViewer Time dropdown"
echo "4. Extended frames should be marked with '(Extended)' and appear italic"
echo "5. Click Play to test the extended animation loop"
echo ""
echo "💡 What to expect:"
echo "- More frames in the timeline when 6-hour mode is enabled"
echo "- Synthetic/extended frames marked as '(Extended)' in dropdown"
echo "- Extended frames appear with slightly lower opacity (50% vs 70%)"
echo "- Console message: '6-hour mode: Extended timeline to X frames'"
echo ""
echo "🔧 If 6-hour loop still not working:"
echo "- Check browser console for error messages"
echo "- Verify localStorage contains rv_mode='6h' when checkbox is checked"
echo "- Try refreshing the page after enabling 6-hour mode"
