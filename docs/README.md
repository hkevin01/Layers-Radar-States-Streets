# 🗺️ Layers Radar States Streets

> A modern, accessible Progressive Web Application for visualizing NEXRAD radar data, state boundaries, and street maps using OpenLayers.

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](CHANGELOG.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](../LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)
[![ES Modules](https://img.shields.io/badge/ES-Modules-orange.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Support](#support)

## Overview

Layers Radar States Streets is a sophisticated web mapping application designed for meteorologists, emergency management professionals, GIS developers, and weather enthusiasts. Built with modern web technologies, it provides real-time weather radar visualization with comprehensive accessibility features and offline capabilities.

### Target Audience

- **Meteorologists** - Professional weather analysis and forecasting
- **Emergency Management** - Weather hazard monitoring and response
- **GIS Developers** - Mapping application development and integration
- **Weather Enthusiasts** - Personal weather tracking and education
- **Researchers** - Academic study and data analysis

## Key Features

### 🌦️ Weather Visualization
- **Real-time NEXRAD radar data** with WebSocket streaming
- **Historical radar animation** with timeline controls
- **Multiple color schemes** for different analysis needs
- **Multi-layer data visualization** with opacity controls

### 📱 Progressive Web App
- **Offline functionality** with service worker caching
- **Installable** on mobile and desktop devices
- **Push notifications** for weather alerts
- **Background sync** for data updates

### ♿ Universal Accessibility
- **WCAG 2.1 AA compliant** interface design
- **Screen reader optimization** with ARIA labels
- **Keyboard navigation** with customizable shortcuts
- **Color blindness support** with alternative color schemes
- **High contrast mode** and motion controls

### 🎯 Advanced Features
- **Interactive state boundaries** and street maps
- **Touch-optimized controls** for mobile devices
- **Geolocation services** with privacy controls
- **Performance optimization** with WebGL acceleration
- **Modern UI/UX** with glassmorphism design

## Quick Start

### Prerequisites

- Node.js 16+ and npm 8+
- Modern web browser with ES6 module support
- Internet connection for initial setup

### Installation

1. **Clone and setup:**
   ```bash
   git clone https://github.com/hkevin01/Layers-Radar-States-Streets.git
   cd Layers-Radar-States-Streets
   npm install
   ```

2. **Start development server:**
   ```bash
   npm start
   ```

3. **Open application:**
   Navigate to `http://localhost:8080` in your browser

### Alternative Setup

For direct file access without a development server:
```bash
# Open the application directly
open public/index.html
```

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Application                     │
├─────────────────────────────────────────────────────────────┤
│  UI Components  │  Map Component  │  PWA Services         │
│  • UI Controls  │  • OpenLayers   │  • Service Worker     │
│  • Mobile Touch │  • Layer Mgmt   │  • Background Sync    │
│  • Data Viz     │  • Event Handling│  • Push Notifications │
├─────────────────────────────────────────────────────────────┤
│                    Core Services                            │
│  • Performance Optimizer  • Accessibility Helper           │
│  • Configuration Manager  • Utility Functions              │
├─────────────────────────────────────────────────────────────┤
│                  External Data Sources                      │
│  • NEXRAD Radar APIs     • State Boundary Services         │
│  • Street Map Tiles      • Weather Alert Services          │
└─────────────────────────────────────────────────────────────┘
```

### Project Structure

```
├── public/                 # Static assets and entry point
│   ├── index.html         # Main application HTML
│   ├── manifest.json      # PWA manifest
│   └── sw.js             # Service worker
├── src/                   # Source code
│   ├── components/        # Modular UI components
│   ├── config/           # Application configuration
│   ├── layers/           # Map layer definitions
│   ├── utils/            # Utility functions
│   └── main.js           # Application entry point
├── tests/                # Comprehensive test suite
├── docs/                 # Documentation
└── scripts/              # Build and utility scripts
```

## Documentation

| <sub>Document</sub> | <sub>Purpose</sub> |
|----------|---------|
| <sub>[REQUIREMENTS.md](REQUIREMENTS.md)</sub> | <sub>Functional and technical requirements</sub> |
| <sub>[DESIGN.md](DESIGN.md)</sub> | <sub>System architecture and design decisions</sub> |
| <sub>[API.md](API.md)</sub> | <sub>API documentation and integration guides</sub> |
| <sub>[INSTALLATION.md](INSTALLATION.md)</sub> | <sub>Setup and deployment instructions</sub> |
| <sub>[TESTING.md](TESTING.md)</sub> | <sub>Testing strategies and procedures</sub> |
| <sub>[TROUBLESHOOTING.md](TROUBLESHOOTING.md)</sub> | <sub>Common issues and solutions</sub> |
| <sub>[CONTRIBUTING.md](../CONTRIBUTING.md)</sub> | <sub>Contribution guidelines</sub> |
| <sub>[CHANGELOG.md](../CHANGELOG.md)</sub> | <sub>Version history and changes</sub> |

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](../CONTRIBUTING.md) for details on:

- Code of conduct
- Development workflow
- Coding standards
- Testing requirements
- Pull request process

### Quick Contribution Steps

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Follow coding standards and write tests
4. Submit a pull request with clear description

## Support

### Getting Help

- **Documentation**: Browse the [docs/](.) directory
- **Issues**: Report bugs via [GitHub Issues](https://github.com/hkevin01/Layers-Radar-States-Streets/issues)
- **Discussions**: Join conversations in [GitHub Discussions](https://github.com/hkevin01/Layers-Radar-States-Streets/discussions)

### Status and Roadmap

- **Current Version**: 2.0.0 (See [CHANGELOG.md](../CHANGELOG.md))
- **Development Status**: Active development with regular updates
- **Future Plans**: See [project board](https://github.com/hkevin01/Layers-Radar-States-Streets/projects) for upcoming features

---

**Built with ❤️ by the open source community**

*For detailed technical information, please refer to the documentation in the `docs/` directory.*