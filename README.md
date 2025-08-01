# 🗺️ Layers Radar States Streets

> A modern, accessible Progressive Web Application for visualizing NEXRAD radar data, state boundaries, and street maps using OpenLayers.

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](CHANGELOG.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)
[![ES Modules](https://img.shields.io/badge/ES-Modules-orange.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)

## ✨ Key Features

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

### 🎯 Advanced Features
- **Interactive state boundaries** and street maps
- **Touch-optimized controls** for mobile devices
- **Geolocation services** with privacy controls
- **Performance optimization** with WebGL acceleration
- **Modern UI/UX** with glassmorphism design

## 🏗️ Project Structure

```
├── public/                 # Static files served to browser
│   └── index.html         # Main HTML file
├── src/                   # Source code
│   ├── components/        # Reusable components
│   │   └── map-component.js
│   ├── config/           # Configuration files
│   │   └── map-config.js
│   ├── layers/           # Layer factory and definitions
│   │   └── layer-factory.js
│   ├── utils/            # Utility functions
│   │   └── map-utils.js
│   ├── js/               # Legacy code (deprecated)
│   └── main.js           # Main entry point
├── tests/                # Test files
├── scripts/              # Build and utility scripts
├── docs/                 # Documentation
├── data/                 # Sample data files
└── assets/               # Static assets
```

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm 8+
- Modern web browser with ES6 module support

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/hkevin01/Layers-Radar-States-Streets.git
   cd Layers-Radar-States-Streets
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Open your browser to:** `http://localhost:8080`

### Alternative: Direct File Access

Open `public/index.html` directly in a modern browser that supports ES6 modules.

## 🛠️ Development

### Available Scripts

- `npm start` - Start development server
- `npm test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run build` - Run full build pipeline

### Architecture Overview

The application follows a modular architecture:

- **`src/main.js`** - Application entry point and initialization
- **`src/components/`** - Reusable components (MapComponent)
- **`src/config/`** - Configuration and constants
- **`src/layers/`** - Layer creation and management
- **`src/utils/`** - Utility functions and helpers

### Key Classes

#### MapComponent
```javascript
import { MapComponent } from './src/components/map-component.js';

const mapComponent = new MapComponent('map-container-id');
mapComponent.initialize();
```

#### Configuration
```javascript
import { MAP_CONFIG } from './src/config/map-config.js';

// Access layer configurations
const radarConfig = MAP_CONFIG.layers.radar;
```

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Watch mode for development:
```bash
npm run test:watch
```

## 📚 Documentation

Our comprehensive documentation is designed to help users, developers, and contributors:

| Document | Purpose | Audience |
|----------|---------|----------|
| **[README.md](README.md)** | Project overview and quick start | All users |
| **[REQUIREMENTS.md](docs/REQUIREMENTS.md)** | Functional and technical requirements | Developers, PMs |
| **[DESIGN.md](docs/DESIGN.md)** | System architecture and design decisions | Developers, Architects |
| **[API.md](docs/API.md)** | Complete API documentation | Developers, Integrators |
| **[INSTALLATION.md](docs/INSTALLATION.md)** | Setup and deployment guide | DevOps, Developers |
| **[CONTRIBUTING.md](docs/CONTRIBUTING.md)** | Contribution guidelines | Contributors |
| **[TESTING.md](docs/TESTING.md)** | Testing strategies and procedures | QA, Developers |
| **[TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** | Common issues and solutions | All users |
| **[CHANGELOG.md](CHANGELOG.md)** | Version history and changes | All users |

### Quick Links

- **🚀 [Quick Start Guide](docs/INSTALLATION.md#quick-start)** - Get up and running in 5 minutes
- **🏗️ [Architecture Overview](docs/DESIGN.md#system-architecture)** - Understand the system design
- **🔧 [API Reference](docs/API.md)** - Complete API documentation
- **🤝 [Contributing](docs/CONTRIBUTING.md)** - How to contribute to the project
- **❓ [Getting Help](docs/TROUBLESHOOTING.md)** - Solutions to common problems

## 🤝 Contributing

We welcome contributions from developers of all skill levels! Whether you're fixing bugs, adding features, improving documentation, or helping with testing, your contributions make this project better.

### Quick Contribution Steps

1. **Fork the repository** and clone your fork
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Follow our coding standards** and write tests
4. **Submit a pull request** with clear description

For detailed guidelines, see our [Contributing Guide](docs/CONTRIBUTING.md).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔄 Version History

See [CHANGELOG.md](CHANGELOG.md) for detailed version history and release notes.

## � Support & Community

- **📧 Issues**: [GitHub Issues](https://github.com/hkevin01/Layers-Radar-States-Streets/issues)
- **� Discussions**: [GitHub Discussions](https://github.com/hkevin01/Layers-Radar-States-Streets/discussions)
- **📖 Documentation**: [docs/](docs/) directory
- **�️ Troubleshooting**: [Troubleshooting Guide](docs/TROUBLESHOOTING.md)

---

**Built with ❤️ by the open source community**

*For meteorologists, emergency management professionals, GIS developers, and weather enthusiasts worldwide.*