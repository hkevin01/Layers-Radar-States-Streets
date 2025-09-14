#!/bin/bash

# Enhanced Testing and Diagnostics Script for Layers Radar States Streets
# Usage: ./test.sh [command]

set -e

show_help() {
    echo "🧪 Testing and Diagnostics Commands:"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  all, test           Run all tests (unit + integration)"
    echo "  unit                Run unit tests with Vitest"
    echo "  integration         Run integration tests"
    echo "  quick               Run quick test suite"
    echo "  cypress             Run Cypress E2E tests"
    echo "  selenium            Run Selenium tests"
    echo "  performance         Run performance tests"
    echo "  diagnostics, diag   Show system diagnostics"
    echo "  report              Generate test report"
    echo "  help                Show this help"
    echo ""
    echo "Examples:"
    echo "  ./test.sh all                # Run all tests"
    echo "  ./test.sh unit               # Run only unit tests"
    echo "  ./test.sh diagnostics        # Show system diagnostics"
    echo "  ./test.sh quick              # Run quick test suite"
    echo ""
}

run_all_tests() {
    echo "🧪 Running comprehensive test suite..."
    echo ""
    
    local start_time=$(date +%s)
    local failed_tests=0
    local total_tests=0
    
    # Start dev server if not running
    if ! curl -s http://localhost:8082/ > /dev/null 2>&1; then
        echo "🚀 Starting development server..."
        npm run start:8082 &
        sleep 3
    fi
    
    # Run unit tests
    echo "1️⃣ Running unit tests..."
    if npm run test:unit; then
        echo "✅ Unit tests passed"
    else
        echo "❌ Unit tests failed"
        ((failed_tests++))
    fi
    ((total_tests++))
    echo ""
    
    # Run integration tests
    echo "2️⃣ Running integration tests..."
    if npm run test:integration; then
        echo "✅ Integration tests passed"
    else
        echo "❌ Integration tests failed"
        ((failed_tests++))
    fi
    ((total_tests++))
    echo ""
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo "📊 Test Summary:"
    echo "  Total test suites: $total_tests"
    echo "  Passed: $((total_tests - failed_tests))"
    echo "  Failed: $failed_tests"
    echo "  Duration: ${duration}s"
    echo ""
    
    if [ $failed_tests -eq 0 ]; then
        echo "🎉 All tests passed!"
        return 0
    else
        echo "💥 Some tests failed!"
        return 1
    fi
}

run_unit_tests() {
    echo "🧪 Running unit tests with Vitest..."
    npm run test:unit
}

run_integration_tests() {
    echo "🔗 Running integration tests..."
    npm run test:integration
}

run_cypress_tests() {
    echo "🌐 Running Cypress E2E tests..."
    npm run test:cypress
}

run_selenium_tests() {
    echo "🚀 Running Selenium tests..."
    npm run test:selenium
}

run_performance_tests() {
    echo "⚡ Running performance tests..."
    npm run test:performance
}

show_diagnostics() {
    echo "🔍 System Diagnostics:"
    echo ""
    
    echo "📋 Environment:"
    echo "  Node.js: $(node --version 2>/dev/null || echo 'Not installed')"
    echo "  NPM: $(npm --version 2>/dev/null || echo 'Not installed')"
    echo "  Git: $(git --version 2>/dev/null | cut -d' ' -f3 || echo 'Not installed')"
    echo ""
    
    echo "🌐 Server Status:"
    if curl -s http://localhost:8082/ > /dev/null 2>&1; then
        echo "  Dev Server (8082): ✅ Running"
        echo "  Response time: $(curl -s -w '%{time_total}' http://localhost:8082/ -o /dev/null)s"
    else
        echo "  Dev Server (8082): ❌ Not running"
    fi
    echo ""
    
    echo "📦 Dependencies:"
    if [ -f "package.json" ]; then
        echo "  Package.json: ✅ Found"
        if command -v jq > /dev/null; then
            local deps=$(jq -r ".dependencies | length" package.json 2>/dev/null || echo "unknown")
            local devDeps=$(jq -r ".devDependencies | length" package.json 2>/dev/null || echo "unknown")
            echo "  Dependencies: $deps"
            echo "  Dev Dependencies: $devDeps"
        fi
    else
        echo "  Package.json: ❌ Not found"
    fi
    echo ""
    
    echo "🧪 Testing Infrastructure:"
    echo "  Vitest config: $([ -f 'tests/vitest.config.js' ] && echo '✅ Found' || echo '❌ Missing')"
    echo "  Cypress config: $([ -f 'config/cypress.config.js' ] && echo '✅ Found' || echo '❌ Missing')"
    echo "  Playwright config: $([ -f 'config/playwright.config.js' ] && echo '✅ Found' || echo '❌ Missing')"
    echo "  Selenium tests: $([ -f 'tests/selenium/selenium-test.js' ] && echo '✅ Found' || echo '❌ Missing')"
    echo ""
    
    echo "📁 Project Structure:"
    echo "  Source files: $(find src/ -name '*.js' 2>/dev/null | wc -l || echo '0') JS files"
    echo "  Test files: $(find tests/ -name '*.test.js' 2>/dev/null | wc -l || echo '0') test files"
    echo "  Public files: $(find public/ -type f 2>/dev/null | wc -l || echo '0') files"
    echo ""
    
    echo "💾 System Resources:"
    echo "  Memory: $(free -h 2>/dev/null | grep '^Mem:' | awk '{print $3"/"$2}' || echo 'Unknown')"
    echo "  Disk: $(df -h . 2>/dev/null | tail -1 | awk '{print $3"/"$2" ("$5" used)"}' || echo 'Unknown')"
    echo ""
    
    echo "🔍 Application Health:"
    if [ -f "src/main.js" ]; then
        echo "  Main.js syntax: $(node -c src/main.js && echo '✅ Valid' || echo '❌ Invalid')"
    fi
    if [ -f "public/index.html" ]; then
        echo "  Index.html: ✅ Found"
    fi
    echo ""
}

run_quick_tests() {
    echo "⚡ Running quick test suite..."
    echo ""
    
    local start_time=$(date +%s)
    
    # Quick unit tests
    echo "🧪 Quick unit tests..."
    npm run test:quick
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo "⏱️  Quick tests completed in ${duration}s"
}

generate_test_report() {
    echo "📊 Generating comprehensive test report..."
    echo ""
    
    local report_dir="tests/reports"
    mkdir -p "$report_dir"
    local report_file="$report_dir/test-report-$(date +%Y%m%d-%H%M%S).md"
    
    echo "# Test Report - $(date)" > "$report_file"
    echo "" >> "$report_file"
    
    echo "## Environment" >> "$report_file"
    echo "- Node.js: $(node --version)" >> "$report_file"
    echo "- NPM: $(npm --version)" >> "$report_file"
    echo "- Date: $(date)" >> "$report_file"
    echo "" >> "$report_file"
    
    echo "## Test Results" >> "$report_file"
    
    # Run tests and capture output
    echo "Running tests and capturing results..."
    
    if npm run test:unit >> "$report_file" 2>&1; then
        echo "✅ Unit tests completed"
    else
        echo "❌ Unit tests failed"
    fi
    
    echo "📋 Report generated: $report_file"
    echo "📂 View report: cat $report_file"
}

# Main command handling
CMD="${1:-help}"

case "$CMD" in
    all|test)
        run_all_tests
        ;;
    unit)
        run_unit_tests
        ;;
    integration)
        run_integration_tests
        ;;
    cypress)
        run_cypress_tests
        ;;
    selenium)
        run_selenium_tests
        ;;
    performance)
        run_performance_tests
        ;;
    quick)
        run_quick_tests
        ;;
    diagnostics|diag)
        show_diagnostics
        ;;
    report)
        generate_test_report
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "❌ Unknown command: $CMD" >&2
        echo ""
        show_help
        exit 1
        ;;
esac
