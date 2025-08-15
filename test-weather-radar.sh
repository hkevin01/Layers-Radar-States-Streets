#!/bin/bash

# Weather Radar Application Test Runner
# Tests both applications for basic functionality

echo "🧪 Weather Radar Application Test Suite"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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
    esac
}

# Test 1: Check if server is running
echo "Testing server connectivity..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8082/public/weather-radar.html | grep -q "200"; then
    print_result "Server Connectivity" "PASS" "Weather radar app is accessible"
else
    print_result "Server Connectivity" "FAIL" "Cannot access weather radar app"
fi

# Test 2: Check modern app
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8082/public/apps/modern-weather-radar.html | grep -q "200"; then
    print_result "Modern App" "PASS" "Modern weather radar app is accessible"
else
    print_result "Modern App" "FAIL" "Cannot access modern weather radar app"
fi

# Test 3: Check essential resources
echo
echo "Testing essential resources..."

# Test JavaScript modules
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8082/public/js/weather-init.js | grep -q "200"; then
    print_result "Weather Init Module" "PASS" "weather-init.js module is accessible"
else
    print_result "Weather Init Module" "FAIL" "weather-init.js module not found"
fi

# Test manifest
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8082/manifest.json | grep -q "200"; then
    print_result "PWA Manifest" "PASS" "manifest.json is accessible"
else
    print_result "PWA Manifest" "WARN" "manifest.json not accessible"
fi

# Test service worker
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8082/public/sw.js | grep -q "200"; then
    print_result "Service Worker" "PASS" "Service worker script is accessible"
else
    print_result "Service Worker" "WARN" "Service worker script not accessible"
fi

# Test 4: Check external dependencies
echo
echo "Testing external dependencies..."

# Test OpenLayers CDN
if curl -s -o /dev/null -w "%{http_code}" https://cdn.jsdelivr.net/npm/ol@8.2.0/dist/ol.js | grep -q "200"; then
    print_result "OpenLayers CDN" "PASS" "OpenLayers library is accessible"
else
    print_result "OpenLayers CDN" "WARN" "OpenLayers CDN may be unreachable"
fi

# Test tile servers
echo
echo "Testing tile servers..."

# Test NEXRAD tiles
if curl -s -o /dev/null -w "%{http_code}" "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/4/8/6.png" | grep -q "200"; then
    print_result "NEXRAD Tiles" "PASS" "NEXRAD tile server is accessible"
else
    print_result "NEXRAD Tiles" "WARN" "NEXRAD tile server may be unreachable"
fi

# Test OSM tiles
if curl -s -o /dev/null -w "%{http_code}" "https://tile.openstreetmap.org/4/8/6.png" | grep -q "200"; then
    print_result "OSM Tiles" "PASS" "OpenStreetMap tile server is accessible"
else
    print_result "OSM Tiles" "WARN" "OpenStreetMap tile server may be unreachable"
fi

# Test 5: Check core modules
echo
echo "Testing core modules..."

# Check if core modules are accessible
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8082/src/core/weather-radar-core.js | grep -q "200"; then
    print_result "Core Module" "PASS" "weather-radar-core.js is accessible"
else
    print_result "Core Module" "WARN" "weather-radar-core.js not accessible via HTTP"
fi

# Check if shared modules are accessible
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8082/src/shared/global-weather-radar.js | grep -q "200"; then
    print_result "Shared Module" "PASS" "global-weather-radar.js is accessible"
else
    print_result "Shared Module" "WARN" "global-weather-radar.js not accessible via HTTP"
fi

# Test 6: Docker health check
echo
echo "Testing Docker container..."

if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "weather-radar.*healthy"; then
    print_result "Docker Health" "PASS" "Container is healthy"
elif docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "weather-radar"; then
    print_result "Docker Health" "WARN" "Container is running but health status unknown"
else
    print_result "Docker Health" "FAIL" "Container is not running"
fi

# Summary
echo
echo "=========================================="
echo "🧪 Test Summary"
echo "=========================================="
echo -e "${GREEN}✅ Passed: $PASS${NC}"
echo -e "${RED}❌ Failed: $FAIL${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARN${NC}"
echo

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 All critical tests passed!${NC}"
    echo "The weather radar applications should be working correctly."
    echo
    echo "📝 Test the applications manually:"
    echo "   • Main App: http://localhost:8082/public/weather-radar.html"
    echo "   • Modern App: http://localhost:8082/public/apps/modern-weather-radar.html"
    echo "   • Diagnostics: http://localhost:8082/public/diagnostic-complete.html"
    exit 0
else
    echo -e "${RED}⚠️ Some critical tests failed.${NC}"
    echo "Check the issues above before using the applications."
    exit 1
fi
