# Project Structure

## Core Directories

- `/src/` - Source code
  - `/core/` - Core application logic
  - `/modules/` - Feature modules
  - `/utils/` - Utility functions
  - `/types/` - TypeScript definitions (if applicable)

- `/public/` - Public assets and web files
  - `/debug/` - Debugging and diagnostic tools
    - `debug-map-test.html` - Map debugging interface
    - `diagnostic-test.html` - System diagnostics interface
  - `/css/` - Stylesheets
  - `/js/` - Client-side JavaScript
  - `/img/` - Images and icons

- `/tests/` - Test files
  - `/unit/` - Unit tests
  - `/integration/` - Integration tests
  - `/e2e/` - End-to-end tests

- `/docs/` - Documentation
  - `DEBUG-GUIDE.md` - Debugging guide
  - `WEATHER-RADAR-README.md` - Weather radar documentation

- `/scripts/` - Utility scripts
  - `test-current-setup.sh` - Setup testing
  - `test-radar.sh` - Radar testing
  - `start-weather-radar.sh` - Startup script

- `/logs/` - Log files
  - `server.log` - Server logs

- `/data/` - Data files and configurations

- `/assets/` - Static assets

## Configuration Files

- `.dockerignore` - Docker ignore rules
- `.editorconfig` - Editor configuration
- `.eslintrc.json` - ESLint configuration
- `.prettierrc` - Prettier configuration
- `docker-compose.yml` - Docker Compose configuration
- `manifest.json` - Application manifest
- `package.json` - NPM package configuration

## Documentation Files

- `README.md` - Main project documentation
- `CHANGELOG.md` - Version history
- `REORGANIZATION-SUMMARY.md` - Codebase reorganization notes
- `SOLUTION-SUMMARY.md` - Solution architecture overview

## Development Environment

- `.vscode/` - VS Code settings
- `.github/` - GitHub configuration
- `.git/` - Git repository

## Archived Content

- `/archive/` - Archived files and old versions
