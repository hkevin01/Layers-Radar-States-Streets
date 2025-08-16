#!/bin/bash

# RainViewer Timeline Features Integration Test
# Tests that the new timeline features are properly integrated in both apps

echo "🌧️ RainViewer Timeline Features Integration Test"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
PASS=0
FAIL=0
WARN=0

# Function to print test results
print_result() {
    local test_name="$1"
    local status="$2"
    local message="$3"

    case $status in
        "PASS")
            echo -e "${GREEN}✅ PASS${NC} $test_name: $message"
            ((PASS++))
            ;;
        "FAIL")
            echo -e "${RED}❌ FAIL${NC} $test_name: $message"
            ((FAIL++))
            ;;
        "WARN")
            echo -e "${YELLOW}⚠️  WARN${NC} $test_name: $message"
            ((WARN++))
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  INFO${NC} $test_name: $message"
            ;;
    esac
}

# Test 1: Check if weather-init-global.js contains RainViewer timeline functions
echo "Testing RainViewer Timeline API Integration..."

if curl -s http://localhost:8082/public/js/weather-init-global.js | grep -q "getRainviewerTimeline"; then
    print_result "Timeline API" "PASS" "getRainviewerTimeline function found"
else
    print_result "Timeline API" "FAIL" "getRainviewerTimeline function missing"
fi

if curl -s http://localhost:8082/public/js/weather-init-global.js | grep -q "playRainviewer"; then
    print_result "Play API" "PASS" "playRainviewer function found"
else
    print_result "Play API" "FAIL" "playRainviewer function missing"
fi

if curl -s http://localhost:8082/public/js/weather-init-global.js | grep -q "pauseRainviewer"; then
    print_result "Pause API" "PASS" "pauseRainviewer function found"
else
    print_result "Pause API" "FAIL" "pauseRainviewer function missing"
fi

if curl -s http://localhost:8082/public/js/weather-init-global.js | grep -q "setRainviewerFrameByIndex"; then
    print_result "Frame Set API" "PASS" "setRainviewerFrameByIndex function found"
else
    print_result "Frame Set API" "FAIL" "setRainviewerFrameByIndex function missing"
fi

if curl -s http://localhost:8082/public/js/weather-init-global.js | grep -q "attachOverlayTileLogging"; then
    print_result "Overlay Logging API" "PASS" "attachOverlayTileLogging function found"
else
    print_result "Overlay Logging API" "FAIL" "attachOverlayTileLogging function missing"
fi

# Test 2: Check if main weather radar app has the new UI controls
echo
echo "Testing Main Weather Radar App UI Integration..."

if curl -s http://localhost:8082/public/weather-radar.html | grep -q "id=\"rainviewer-time\""; then
    print_result "Time Selector" "PASS" "RainViewer time selector found in main app"
else
    print_result "Time Selector" "FAIL" "RainViewer time selector missing from main app"
fi

if curl -s http://localhost:8082/public/weather-radar.html | grep -q "id=\"rv-play\""; then
    print_result "Play Button" "PASS" "RainViewer play button found in main app"
else
    print_result "Play Button" "FAIL" "RainViewer play button missing from main app"
fi

if curl -s http://localhost:8082/public/weather-radar.html | grep -q "id=\"rv-speed\""; then
    print_result "Speed Control" "PASS" "RainViewer speed control found in main app"
else
    print_result "Speed Control" "FAIL" "RainViewer speed control missing from main app"
fi

if curl -s http://localhost:8082/public/weather-radar.html | grep -q "id=\"rv-2h\""; then
    print_result "2H Toggle" "PASS" "RainViewer 2-hour toggle found in main app"
else
    print_result "2H Toggle" "FAIL" "RainViewer 2-hour toggle missing from main app"
fi

# Test 3: Check if modern weather radar app has the new UI controls
echo
echo "Testing Modern Weather Radar App UI Integration..."

if curl -s http://localhost:8082/public/apps/modern-weather-radar.html | grep -q "id=\"rv-time\""; then
    print_result "Modern Time Selector" "PASS" "RainViewer time selector found in modern app"
else
    print_result "Modern Time Selector" "FAIL" "RainViewer time selector missing from modern app"
fi

if curl -s http://localhost:8082/public/apps/modern-weather-radar.html | grep -q "id=\"rv-play\""; then
    print_result "Modern Play Button" "PASS" "RainViewer play button found in modern app"
else
    print_result "Modern Play Button" "FAIL" "RainViewer play button missing from modern app"
fi

if curl -s http://localhost:8082/public/apps/modern-weather-radar.html | grep -q "id=\"rv-speed\""; then
    print_result "Modern Speed Control" "PASS" "RainViewer speed control found in modern app"
else
    print_result "Modern Speed Control" "FAIL" "RainViewer speed control missing from modern app"
fi

if curl -s http://localhost:8082/public/apps/modern-weather-radar.html | grep -q "id=\"rv-2h\""; then
    print_result "Modern 2H Toggle" "PASS" "RainViewer 2-hour toggle found in modern app"
else
    print_result "Modern 2H Toggle" "FAIL" "RainViewer 2-hour toggle missing from modern app"
fi

# Test 4: Check localStorage persistence code integration
echo
echo "Testing localStorage Persistence Integration..."

if curl -s http://localhost:8082/public/js/weather-init-global.js | grep -q "rv_speed_ms"; then
    print_result "Speed Persistence" "PASS" "Speed persistence code found"
else
    print_result "Speed Persistence" "FAIL" "Speed persistence code missing"
fi

if curl -s http://localhost:8082/public/js/weather-init-global.js | grep -q "rv_frame_index"; then
    print_result "Frame Persistence" "PASS" "Frame persistence code found"
else
    print_result "Frame Persistence" "FAIL" "Frame persistence code missing"
fi

if curl -s http://localhost:8082/public/js/weather-init-global.js | grep -q "rv_mode"; then
    print_result "Mode Persistence" "PASS" "Mode persistence code found"
else
    print_result "Mode Persistence" "FAIL" "Mode persistence code missing"
fi

# Test 5: Check RainViewer API integration
echo
echo "Testing RainViewer API Integration..."

if curl -s http://localhost:8082/public/js/weather-init-global.js | grep -q "api.rainviewer.com"; then
    print_result "RainViewer API" "PASS" "RainViewer API endpoint integration found"
else
    print_result "RainViewer API" "FAIL" "RainViewer API endpoint integration missing"
fi

if curl -s http://localhost:8082/public/js/weather-init-global.js | grep -q "weather-maps.json"; then
    print_result "Weather Maps API" "PASS" "Weather maps API integration found"
else
    print_result "Weather Maps API" "FAIL" "Weather maps API integration missing"
fi

# Test 6: Test actual RainViewer API accessibility
echo
echo "Testing External RainViewer Service..."

if curl -s -o /dev/null -w "%{http_code}" "https://api.rainviewer.com/public/weather-maps.json" | grep -q "200"; then
    print_result "RainViewer Service" "PASS" "RainViewer API is accessible"
else
    print_result "RainViewer Service" "WARN" "RainViewer API may be unreachable"
fi

# Test 7: Check JavaScript syntax and structure
echo
echo "Testing JavaScript Integration Quality..."

# Check for proper export structure
if curl -s http://localhost:8082/public/js/weather-init-global.js | grep -q "window.WeatherMap.*="; then
    print_result "API Exports" "PASS" "WeatherMap API properly exported to window"
else
    print_result "API Exports" "FAIL" "WeatherMap API export missing"
fi

# Check for error handling
if curl -s http://localhost:8082/public/js/weather-init-global.js | grep -q "catch.*error"; then
    print_result "Error Handling" "PASS" "Error handling code found"
else
    print_result "Error Handling" "WARN" "Limited error handling detected"
fi

# Test 8: Validate HTML structure
echo
echo "Testing HTML Structure Integration..."

# Check for proper form structure in main app
if curl -s http://localhost:8082/public/weather-radar.html | grep -q "<select.*id=\"rv-speed\""; then
    print_result "Main App Structure" "PASS" "Proper select element structure in main app"
else
    print_result "Main App Structure" "FAIL" "Invalid select element structure in main app"
fi

# Check for proper form structure in modern app
if curl -s http://localhost:8082/public/apps/modern-weather-radar.html | grep -q "<select.*id=\"rv-speed\""; then
    print_result "Modern App Structure" "PASS" "Proper select element structure in modern app"
else
    print_result "Modern App Structure" "FAIL" "Invalid select element structure in modern app"
fi

echo
echo "=========================================="
echo "🧪 RainViewer Integration Test Summary"
echo "=========================================="
echo -e "${GREEN}✅ Passed: $PASS${NC}"
echo -e "${RED}❌ Failed: $FAIL${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARN${NC}"

if [[ $FAIL -eq 0 ]]; then
    echo -e "${GREEN}🎉 All critical RainViewer timeline features are properly integrated!${NC}"
    exit 0
else
    echo -e "${RED}⚠️ Some RainViewer integration tests failed. Review the issues above.${NC}"
    exit 1
fi
