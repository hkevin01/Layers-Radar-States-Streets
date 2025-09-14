#!/bin/bash

# Root folder cleanup script
echo "🧹 Starting root folder cleanup..."

# Move configuration files to config/
echo "📝 Moving configuration files to config/..."
mv cypress.config.js config/ 2>/dev/null || echo "cypress.config.js already moved or doesn't exist"
mv playwright.config.js config/ 2>/dev/null || echo "playwright.config.js already moved or doesn't exist"
mv playwright.config.ts config/ 2>/dev/null || echo "playwright.config.ts already moved or doesn't exist"
mv vitest.config.js config/ 2>/dev/null || echo "vitest.config.js already moved or doesn't exist"
mv tsconfig.test.json config/ 2>/dev/null || echo "tsconfig.test.json already moved or doesn't exist"
mv .lighthouserc.cjs config/ 2>/dev/null || echo ".lighthouserc.cjs already moved or doesn't exist"
mv .lighthouserc.js config/ 2>/dev/null || echo ".lighthouserc.js already moved or doesn't exist"
mv lighthouserc.js config/ 2>/dev/null || echo "lighthouserc.js already moved or doesn't exist"

# Move backup files to backups/
echo "💾 Moving backup files to backups/..."
mv package.json.backup backups/ 2>/dev/null || echo "package.json.backup already moved or doesn't exist"
mv run.sh.backup backups/ 2>/dev/null || echo "run.sh.backup already moved or doesn't exist"
mv run.sh.original backups/ 2>/dev/null || echo "run.sh.original already moved or doesn't exist"

# Move log files to logs/
echo "📋 Moving log files to logs/..."
mv backend.log logs/ 2>/dev/null || echo "backend.log already moved or doesn't exist"
mv frontend.log logs/ 2>/dev/null || echo "frontend.log already moved or doesn't exist"

# Move documentation files to docs/
echo "📚 Moving documentation files to docs/..."
mv AIRPORT_WEATHER_IMPLEMENTATION.md docs/ 2>/dev/null || echo "AIRPORT_WEATHER_IMPLEMENTATION.md already moved or doesn't exist"
mv ANIMATION_CONTROLS_INTEGRATION.md docs/ 2>/dev/null || echo "ANIMATION_CONTROLS_INTEGRATION.md already moved or doesn't exist"
mv DOCKER.md docs/ 2>/dev/null || echo "DOCKER.md already moved or doesn't exist"
mv FRONTEND-BACKEND-INTEGRATION.md docs/ 2>/dev/null || echo "FRONTEND-BACKEND-INTEGRATION.md already moved or doesn't exist"
mv LAYOUT_FIXES_SUMMARY.md docs/ 2>/dev/null || echo "LAYOUT_FIXES_SUMMARY.md already moved or doesn't exist"
mv MAP_LAYOUT_FIX_SUMMARY.md docs/ 2>/dev/null || echo "MAP_LAYOUT_FIX_SUMMARY.md already moved or doesn't exist"
mv OPENLAYERS_CONTAINER_REPLACEMENT.md docs/ 2>/dev/null || echo "OPENLAYERS_CONTAINER_REPLACEMENT.md already moved or doesn't exist"
mv TROUBLESHOOTING.md docs/ 2>/dev/null || echo "TROUBLESHOOTING.md already moved or doesn't exist"
mv WEATHER-RADAR-README.md docs/ 2>/dev/null || echo "WEATHER-RADAR-README.md already moved or doesn't exist"

# Move temporary and debug files to temp/
echo "🔧 Moving temporary and debug files to temp/..."
mv copilot_debug_log.txt temp/ 2>/dev/null || echo "copilot_debug_log.txt already moved or doesn't exist"
mv copilot_project_debug_log.txt temp/ 2>/dev/null || echo "copilot_project_debug_log.txt already moved or doesn't exist"
mv diagnostic-test.html temp/ 2>/dev/null || echo "diagnostic-test.html already moved or doesn't exist"
mv quick-test.js temp/ 2>/dev/null || echo "quick-test.js already moved or doesn't exist"
mv test-runner.js temp/ 2>/dev/null || echo "test-runner.js already moved or doesn't exist"
mv simple-map.html temp/ 2>/dev/null || echo "simple-map.html already moved or doesn't exist"

# Move scripts to scripts/ folder (exists)
echo "⚙️ Moving scripts to scripts/..."
mv fix_chat.sh scripts/ 2>/dev/null || echo "fix_chat.sh already moved or doesn't exist"
mv fix_data_viz.sh scripts/ 2>/dev/null || echo "fix_data_viz.sh already moved or doesn't exist"
mv restore_data_viz.sh scripts/ 2>/dev/null || echo "restore_data_viz.sh already moved or doesn't exist"
mv start-weather-radar.sh scripts/ 2>/dev/null || echo "start-weather-radar.sh already moved or doesn't exist"
mv run.sh scripts/ 2>/dev/null || echo "run.sh already moved or doesn't exist"

# Move pid files to temp/
echo "🔒 Moving PID files to temp/..."
mv .backend.pid temp/ 2>/dev/null || echo ".backend.pid already moved or doesn't exist"
mv .frontend.pid temp/ 2>/dev/null || echo ".frontend.pid already moved or doesn't exist"

echo "✅ Root folder cleanup completed!"
echo ""
echo "📁 Files organized into:"
echo "  - config/     - Configuration files"
echo "  - backups/    - Backup files"
echo "  - logs/       - Log files"
echo "  - docs/       - Documentation files"
echo "  - temp/       - Temporary and debug files"
echo "  - scripts/    - Shell scripts"
echo ""
echo "🏠 Root folder now contains only essential files!"
