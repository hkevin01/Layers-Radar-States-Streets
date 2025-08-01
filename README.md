# 🗺️ Layers Radar States Streets

A modern, modular web application for visualizing NEXRAD radar data, state boundaries, and street maps using OpenLayers. Completely refactored with ES6+ modules and modern development practices.

## ✨ Features

- **Real-time NEXRAD radar visualization**
- **Interactive state boundaries and street maps**
- **Modular ES6+ architecture**
- **Responsive design**
- **Layer switching controls**
- **Zoom restrictions and map controls**
- **AJAX-based data loading**

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

## 📚 API Reference

### Global Functions (Legacy Compatibility)

- `initLoad()` - Initialize the map (legacy)
- `initializeApp(containerId)` - Modern initialization
- `window.loading(show)` - Show/hide loading indicator
- `window.errorAlert(xhr, exception, error)` - Display error messages

### Layer Types

- **Radar Layer** - NEXRAD weather radar data
- **States Layer** - US state boundaries
- **Streets Layer** - Road and street data
- **OSM Layer** - OpenStreetMap base layer
- **Hazard Layer** - Hazard marker overlays

## 🔧 Configuration

Edit `src/config/map-config.js` to customize:

- Map projections and center point
- Layer URLs and settings
- AJAX endpoints
- Default zoom levels

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Follow the coding standards in `.editorconfig`, `.prettierrc`, `.eslintrc.json`
4. Write or update tests for new features
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Submit a pull request

See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for detailed guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔄 Migration from v1.x

If upgrading from the legacy version:

1. The main script has moved from `script.js` to `src/main.js`
2. Code is now modular - import specific components as needed
3. HTML should reference `public/index.html`
4. Configuration is centralized in `src/config/map-config.js`

Legacy function names are maintained for backward compatibility.

## 📈 Roadmap

- [ ] Add TypeScript support
- [ ] Implement real-time data streaming
- [ ] Add mobile touch controls
- [ ] Enhance error handling and recovery
- [ ] Add more layer types and data sources

## 🐛 Known Issues

- Legacy OpenLayers 2.x compatibility maintained for existing data sources
- Some external tile services may have CORS restrictions
- Modern browser required for ES6 module support

## 📞 Support

- 📧 Issues: [GitHub Issues](https://github.com/hkevin01/Layers-Radar-States-Streets/issues)
- 📖 Documentation: [docs/](docs/)
- 🔧 Architecture: [docs/project-plan.md](docs/project-plan.md)