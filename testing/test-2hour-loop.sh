#!/bin/bash
# Test 2-hour radar loop functionality

echo "🧪 Testing 2-hour radar loop functionality..."
echo "================================================="

# Test 1: Check if server is running
echo -n "1. Testing if server is accessible... "
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8082/public/weather-radar.html | grep -q "200"; then
    echo "✅ Server accessible"
else
    echo "❌ Server not accessible. Please start with: python -m http.server 8082"
    exit 1
fi

# Test 2: Check if 2-hour loop UI is present
echo -n "2. Checking for 2-hour loop toggle... "
if curl -s http://localhost:8082/public/weather-radar.html | grep -q "2-hour loop"; then
    echo "✅ 2-hour loop toggle found"
else
    echo "❌ 2-hour loop toggle not found"
fi

# Test 3: Check if RainViewer API integration is present
echo -n "3. Checking RainViewer timeline integration... "
if curl -s http://localhost:8082/public/js/weather-init-global.js | grep -q "enableRainviewerTimeline"; then
    echo "✅ RainViewer timeline integration found"
else
    echo "❌ RainViewer timeline integration not found"
fi

# Test 4: Check frame display in main app
echo -n "4. Checking frame display in main app... "
if curl -s http://localhost:8082/public/weather-radar.html | grep -q "toISOString"; then
    echo "✅ Frame display found in main app"
else
    echo "❌ Frame display not found in main app"
fi

# Test 5: Check frame display in modern app
echo -n "5. Checking frame display in modern app... "
if curl -s http://localhost:8082/public/apps/modern-weather-radar.html | grep -q "toISOString"; then
    echo "✅ Frame display found in modern app"
else
    echo "❌ Frame display not found in modern app"
fi

# Test 6: Verify no synthetic frame code remains
echo -n "6. Checking for removal of synthetic frame code... "
if curl -s http://localhost:8082/public/js/weather-init-global.js | grep -q "synthetic\|Extended"; then
    echo "⚠️  Synthetic frame code still present"
else
    echo "✅ Synthetic frame code successfully removed"
fi

echo ""
echo "🎯 Manual Testing Instructions:"
echo "==============================="
echo "1. Open: http://localhost:8082/public/weather-radar.html"
echo "2. Enable the '2-hour loop' checkbox (should be checked by default)"
echo "3. Look for real-time frames in the RainViewer Time dropdown"
echo "4. Click Play to test the 2-hour animation loop"
echo ""
echo "Expected behavior:"
echo "=================="
echo "- Real-time frames from RainViewer API (~2 hours of data)"
echo "- Smooth animation loop through available frames"
echo "- Normal opacity (70%) for all frames"
echo "- No '(Extended)' labels or synthetic frames"
echo ""
echo "✅ 2-hour loop functionality test complete!"
