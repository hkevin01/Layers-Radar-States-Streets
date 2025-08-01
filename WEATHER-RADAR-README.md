# NEXRAD Weather Radar Application

A modern, professional weather radar visualization application built with OpenLayers for meteorologists and weather enthusiasts.

## Features

### 🌦️ Real-time Weather Radar
- **NEXRAD Radar Data**: Live weather radar from National Weather Service
- **Multiple Radar Types**: Base reflectivity, velocity, and precipitation
- **Automatic Updates**: Real-time data refresh every 5 minutes
- **High-Resolution Display**: Professional-grade radar visualization

### 🎬 Interactive Animation
- **Radar Loop Animation**: 10-frame animated radar sequences
- **Timeline Controls**: Play, pause, step through frames
- **Variable Speed**: Adjustable animation speed (0.5x to 5x)
- **Timeline Scrubbing**: Click and drag to any point in time

### 🚨 Weather Alerts
- **Live NWS Alerts**: Real-time warnings, watches, and advisories
- **Alert Overlays**: Visual alert boundaries on the map
- **Priority Display**: Alerts sorted by severity and urgency
- **Interactive Info**: Click alerts for detailed information

### 🗺️ Advanced Mapping
- **Multiple Base Maps**: Street, satellite, and dark themes
- **Overlay Layers**: State boundaries, counties, cities, highways
- **Interactive Controls**: Pan, zoom, rotate with smooth animations
- **Geographic Search**: Find locations and center map view

### 📱 Modern Interface
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark Theme**: Optimized for weather monitoring
- **Accessibility**: WCAG 2.1 AA compliant with screen reader support
- **Progressive Web App**: Installable with offline capabilities

### 🛠️ Professional Tools
- **Geolocation**: Automatic location detection and tracking
- **Measurement Tools**: Distance and area calculation
- **Export Features**: Save radar images and data
- **Customizable Settings**: Personalize display and behavior

## Technical Stack

- **Frontend**: Vanilla JavaScript ES6 modules
- **Mapping**: OpenLayers 8.2.0
- **Data Sources**: National Weather Service APIs
- **Styling**: Modern CSS with custom properties
- **PWA**: Service worker with offline support
- **Accessibility**: ARIA labels and semantic HTML

## Architecture

### Modular Design
The application follows a clean modular architecture with separate controllers for different concerns:

- **WeatherRadarApp**: Main application controller
- **LayerManager**: Map layer management and rendering
- **RadarController**: NEXRAD data loading and animation
- **WeatherAlertsManager**: NWS alerts integration
- **TimelineController**: Animation timeline and playback
- **UIController**: User interface interactions
- **GeolocationService**: Location detection and tracking
- **SettingsManager**: User preferences and configuration

### Key Files

```
js/
├── weather-radar-app.js          # Main application entry point
└── modules/
    ├── layer-manager.js          # Map layers and styling
    ├── radar-controller.js       # NEXRAD radar data
    ├── weather-alerts.js         # Weather alerts and warnings
    ├── timeline-controller.js    # Animation timeline
    ├── ui-controller.js          # User interface management
    ├── geolocation-service.js    # Location services
    └── settings-manager.js       # Settings and preferences

public/
├── weather-radar.html            # Main application page
├── css/weather-gui.css          # Application styling
└── manifest.json                # PWA configuration
```

## Usage

### Basic Navigation
1. **Current View**: Shows latest radar data
2. **Animation View**: Plays radar loop animation
3. **Alerts View**: Highlights active weather alerts

### Controls
- **Space**: Play/pause animation
- **Arrow Keys**: Step through animation frames
- **L**: Center on your location
- **R**: Refresh radar data
- **F**: Toggle fullscreen
- **Esc**: Close modals and popups

### Radar Types
- **Base Reflectivity**: Shows precipitation intensity
- **Velocity**: Shows wind speed and direction
- **Precipitation**: Shows rainfall rates

### Mobile Usage
- Touch and drag to pan the map
- Pinch to zoom in/out
- Tap the menu button for layer controls
- Swipe to navigate between views

## Data Sources

- **NEXRAD Radar**: NOAA/NWS Geoserver WMS services
- **Weather Alerts**: National Weather Service API
- **Base Maps**: OpenStreetMap, Esri World Imagery
- **Geographic Data**: Natural Earth boundaries

## Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile Browsers**: iOS Safari 14+, Chrome Mobile 90+
- **WebGL**: Required for radar rendering
- **Geolocation**: Optional for location features

## Installation

### As a Web App
1. Visit the application in your browser
2. Look for "Install" or "Add to Home Screen" prompt
3. Follow browser instructions to install as PWA

### Development Setup
1. Clone the repository
2. Serve files from a web server (required for modules)
3. Open `public/weather-radar.html` in browser

## Configuration

Settings are automatically saved to browser localStorage:

- **Display**: Theme, units, language preferences
- **Radar**: Default type, opacity, update intervals
- **Animation**: Speed, frame count, loop settings
- **Alerts**: Which alert types to display
- **Location**: Auto-locate and tracking preferences

## Performance

### Optimizations
- **Lazy Loading**: Radar frames loaded on demand
- **Data Caching**: Intelligent caching with expiration
- **Progressive Enhancement**: Core features work without JavaScript
- **Efficient Rendering**: WebGL acceleration for smooth animation

### Best Practices
- Keep browser tabs active for real-time updates
- Use WiFi connection for best performance
- Enable location services for local weather focus
- Clear browser cache periodically for latest features

## Accessibility Features

- **Screen Reader Support**: Full ARIA labeling
- **Keyboard Navigation**: All features accessible via keyboard
- **High Contrast**: Supports OS high contrast modes
- **Reduced Motion**: Respects user motion preferences
- **Focus Management**: Clear focus indicators
- **Alternative Text**: Descriptive text for all imagery

## Weather Safety

This application is for informational purposes only. For official weather warnings and emergency information, always consult your local National Weather Service office and follow official emergency management guidance.

## License

Built for educational and research purposes. Weather data courtesy of NOAA/National Weather Service.

---

*Last Updated: December 2024*
*Version: 2.0.0*
