# API Documentation

## Table of Contents

- [API Overview](#api-overview)
- [Core APIs](#core-apis)
- [Component APIs](#component-apis)
- [Integration APIs](#integration-apis)
- [Data APIs](#data-apis)
- [Event System](#event-system)
- [Configuration API](#configuration-api)
- [Error Handling](#error-handling)

---

## API Overview

The Layers Radar States Streets application provides both internal component APIs for development and integration APIs for external systems. All APIs follow consistent patterns for error handling, data validation, and accessibility support.

### API Design Principles
- **Consistent Interface**: All APIs follow the same patterns and conventions
- **Error Resilience**: Graceful error handling with meaningful error messages
- **Type Safety**: Input validation and type checking for all parameters
- **Accessibility**: APIs support accessibility features and screen reader integration
- **Performance**: Optimized for performance with lazy loading and caching

### Usage Patterns
```javascript
// ES6 Module Import
import { MapComponent } from './src/components/map-component.js';

// Initialization
const map = new MapComponent('map-container');
await map.initialize();

// API Usage
const result = await map.addLayer(layerConfig);
```

---

## Core APIs

### MapComponent API

#### Constructor
```javascript
new MapComponent(containerId, options = {})
```

**Parameters:**
- `containerId` (string): HTML element ID for map container
- `options` (object, optional): Configuration options

**Example:**
```javascript
const mapComponent = new MapComponent('map', {
  center: [-95, 40],
  zoom: 6,
  projection: 'EPSG:3857'
});
```

#### Methods

##### `initialize()`
Initializes the map component and creates the OpenLayers map instance.

```javascript
async initialize() -> Promise<void>
```

**Example:**
```javascript
await mapComponent.initialize();
```

##### `addLayer(layerConfig)`
Adds a new layer to the map with the specified configuration.

```javascript
addLayer(layerConfig) -> Promise<Layer>
```

**Parameters:**
- `layerConfig` (object): Layer configuration object

**Returns:** Promise resolving to the created layer

**Example:**
```javascript
const layer = await mapComponent.addLayer({
  type: 'radar',
  url: 'https://api.weather.gov/radar/{z}/{x}/{y}.png',
  opacity: 0.7,
  visible: true
});
```

##### `removeLayer(layerId)`
Removes a layer from the map by ID.

```javascript
removeLayer(layerId) -> boolean
```

**Parameters:**
- `layerId` (string): Unique identifier for the layer

**Returns:** Boolean indicating success

##### `setLayerVisibility(layerId, visible)`
Controls layer visibility without removing the layer.

```javascript
setLayerVisibility(layerId, visible) -> boolean
```

**Parameters:**
- `layerId` (string): Layer identifier
- `visible` (boolean): Visibility state

##### `setLayerOpacity(layerId, opacity)`
Adjusts layer opacity for blending effects.

```javascript
setLayerOpacity(layerId, opacity) -> boolean
```

**Parameters:**
- `layerId` (string): Layer identifier
- `opacity` (number): Opacity value between 0 and 1

##### `getCenter()`
Returns the current map center coordinates.

```javascript
getCenter() -> {lon: number, lat: number}
```

##### `setCenter(coordinates)`
Sets the map center to specified coordinates.

```javascript
setCenter(coordinates) -> void
```

**Parameters:**
- `coordinates` (object): `{lon: number, lat: number}`

##### `getZoom()`
Returns the current zoom level.

```javascript
getZoom() -> number
```

##### `setZoom(level)`
Sets the map zoom level.

```javascript
setZoom(level) -> void
```

**Parameters:**
- `level` (number): Zoom level (typically 1-18)

#### Events

The MapComponent emits events for state changes:

```javascript
// Layer events
mapComponent.on('layerAdded', (event) => {
  console.log('Layer added:', event.layer);
});

mapComponent.on('layerRemoved', (event) => {
  console.log('Layer removed:', event.layerId);
});

// Map interaction events
mapComponent.on('centerChanged', (event) => {
  console.log('Center:', event.center);
});

mapComponent.on('zoomChanged', (event) => {
  console.log('Zoom:', event.zoom);
});
```

---

## Component APIs

### UIControls API

#### Constructor
```javascript
new UIControls(mapComponent, container)
```

**Parameters:**
- `mapComponent` (MapComponent): Map component instance
- `container` (HTMLElement): Container for UI controls

#### Methods

##### `updateCoordinates(coordinates)`
Updates the coordinate display in the UI.

```javascript
updateCoordinates(coordinates) -> void
```

##### `updateZoomLevel(level)`
Updates the zoom level display.

```javascript
updateZoomLevel(level) -> void
```

##### `showLoading(message)`
Displays loading indicator with optional message.

```javascript
showLoading(message = 'Loading...') -> void
```

##### `hideLoading()`
Hides the loading indicator.

```javascript
hideLoading() -> void
```

##### `showError(message, options)`
Displays error message with retry options.

```javascript
showError(message, options = {}) -> void
```

**Parameters:**
- `message` (string): Error message to display
- `options` (object): Configuration options
  - `retry` (boolean): Show retry button
  - `duration` (number): Auto-hide duration in milliseconds

### MobileTouchControls API

#### Constructor
```javascript
new MobileTouchControls(mapComponent, container)
```

#### Methods

##### `enableGestures()`
Enables touch gesture handling.

```javascript
enableGestures() -> void
```

##### `disableGestures()`
Disables touch gesture handling.

```javascript
disableGestures() -> void
```

##### `getCurrentLocation()`
Requests user's current location.

```javascript
getCurrentLocation() -> Promise<{lat: number, lon: number}>
```

##### `shareLocation(coordinates)`
Opens native sharing dialog for location.

```javascript
shareLocation(coordinates) -> Promise<void>
```

### DataVisualization API

#### Constructor
```javascript
new DataVisualization(mapComponent)
```

#### Methods

##### `startStreaming(url)`
Initiates real-time data streaming.

```javascript
startStreaming(url) -> Promise<void>
```

##### `stopStreaming()`
Stops real-time data streaming.

```javascript
stopStreaming() -> void
```

##### `loadHistoricalData(timeRange)`
Loads historical radar data for animation.

```javascript
loadHistoricalData(timeRange) -> Promise<AnimationData>
```

**Parameters:**
- `timeRange` (object): `{start: Date, end: Date}`

##### `setColorScheme(scheme)`
Changes the radar color scheme.

```javascript
setColorScheme(scheme) -> void
```

**Parameters:**
- `scheme` (string): Color scheme name ('classic', 'viridis', 'plasma', 'grayscale')

##### `playAnimation()`
Starts historical data animation playback.

```javascript
playAnimation() -> void
```

##### `pauseAnimation()`
Pauses animation playback.

```javascript
pauseAnimation() -> void
```

##### `setAnimationSpeed(speed)`
Adjusts animation playback speed.

```javascript
setAnimationSpeed(speed) -> void
```

**Parameters:**
- `speed` (number): Speed multiplier (0.5 to 4.0)

### AccessibilityHelper API

#### Constructor
```javascript
new AccessibilityHelper(mapComponent)
```

#### Methods

##### `announce(message, priority)`
Announces message to screen readers.

```javascript
announce(message, priority = 'polite') -> void
```

**Parameters:**
- `message` (string): Message to announce
- `priority` (string): 'polite' or 'assertive'

##### `enableKeyboardNavigation()`
Enables keyboard navigation shortcuts.

```javascript
enableKeyboardNavigation() -> void
```

##### `setHighContrastMode(enabled)`
Toggles high contrast mode.

```javascript
setHighContrastMode(enabled) -> void
```

##### `setLargeTextMode(enabled)`
Toggles large text mode.

```javascript
setLargeTextMode(enabled) -> void
```

##### `setReducedMotion(enabled)`
Toggles reduced motion preferences.

```javascript
setReducedMotion(enabled) -> void
```

### PWAHelper API

#### Constructor
```javascript
new PWAHelper()
```

#### Methods

##### `checkInstallability()`
Checks if app can be installed as PWA.

```javascript
checkInstallability() -> boolean
```

##### `promptInstall()`
Shows installation prompt to user.

```javascript
promptInstall() -> Promise<boolean>
```

##### `isStandalone()`
Checks if app is running in standalone mode.

```javascript
isStandalone() -> boolean
```

##### `getOnlineStatus()`
Returns current online/offline status.

```javascript
getOnlineStatus() -> boolean
```

##### `requestNotificationPermission()`
Requests permission for push notifications.

```javascript
requestNotificationPermission() -> Promise<string>
```

---

## Integration APIs

### External System Integration

#### Weather Data API Integration
```javascript
// Configure external weather data source
const weatherAPI = {
  baseURL: 'https://api.weather.gov',
  endpoints: {
    radar: '/radar/{z}/{x}/{y}.png',
    alerts: '/alerts/{state}',
    observations: '/stations/{stationId}/observations'
  }
};

// Integrate with map component
mapComponent.addDataSource('weather', weatherAPI);
```

#### Custom Layer Integration
```javascript
// Define custom layer type
const customLayerConfig = {
  type: 'custom',
  name: 'Traffic Data',
  url: 'https://api.traffic.com/tiles/{z}/{x}/{y}',
  attribution: 'Traffic data by TrafficAPI',
  minZoom: 6,
  maxZoom: 18,
  opacity: 0.8
};

// Add to map
const layer = await mapComponent.addLayer(customLayerConfig);
```

#### Webhook Integration
```javascript
// Setup webhook for real-time alerts
const webhookConfig = {
  url: 'https://yourapp.com/webhooks/weather',
  events: ['severe-weather', 'radar-update'],
  authentication: {
    type: 'bearer',
    token: 'your-api-token'
  }
};

pwaHelper.registerWebhook(webhookConfig);
```

---

## Data APIs

### Layer Data Formats

#### Radar Data Format
```javascript
// Expected radar data structure
const radarData = {
  timestamp: '2024-01-01T12:00:00Z',
  bbox: [-100, 35, -90, 45], // [west, south, east, north]
  data: {
    reflectivity: {
      values: [/* 2D array of values */],
      units: 'dBZ',
      noDataValue: -999
    }
  }
};
```

#### GeoJSON Layer Format
```javascript
// State boundaries or other vector data
const geoJSONData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        name: 'Texas',
        code: 'TX',
        population: 29500000
      },
      geometry: {
        type: 'Polygon',
        coordinates: [/* coordinate arrays */]
      }
    }
  ]
};
```

#### Observation Data Format
```javascript
// Weather station observations
const observationData = {
  stationId: 'KAUS',
  timestamp: '2024-01-01T12:00:00Z',
  coordinates: [-97.75, 30.25],
  data: {
    temperature: { value: 25.5, units: 'C' },
    windSpeed: { value: 15, units: 'mph' },
    pressure: { value: 1013.25, units: 'hPa' }
  }
};
```

### Data Validation

#### Input Validation
```javascript
// Coordinate validation
function validateCoordinates(coords) {
  if (!coords || typeof coords !== 'object') {
    throw new Error('Coordinates must be an object');
  }
  
  if (typeof coords.lat !== 'number' || coords.lat < -90 || coords.lat > 90) {
    throw new Error('Latitude must be between -90 and 90');
  }
  
  if (typeof coords.lon !== 'number' || coords.lon < -180 || coords.lon > 180) {
    throw new Error('Longitude must be between -180 and 180');
  }
  
  return true;
}

// Layer configuration validation
function validateLayerConfig(config) {
  const required = ['type', 'url'];
  for (const field of required) {
    if (!config[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  return true;
}
```

---

## Event System

### Event Types

#### Map Events
```javascript
// Map state changes
'centerChanged'    // Map center coordinates changed
'zoomChanged'      // Zoom level changed
'layerAdded'       // New layer added to map
'layerRemoved'     // Layer removed from map
'layerVisibilityChanged' // Layer visibility toggled

// User interactions
'mapClick'         // User clicked on map
'mapDoubleClick'   // User double-clicked on map
'mapDrag'          // User dragged the map
```

#### Component Events
```javascript
// UI events
'uiControlsReady'  // UI controls initialized
'loadingStart'     // Loading indicator shown
'loadingEnd'       // Loading indicator hidden
'errorOccurred'    // Error message displayed

// Data events
'dataLoaded'       // New data loaded successfully
'dataError'        // Data loading failed
'streamingStarted' // Real-time streaming initiated
'streamingStopped' // Real-time streaming stopped
```

#### Accessibility Events
```javascript
// Accessibility events
'announcementMade' // Screen reader announcement
'shortcutPressed'  // Keyboard shortcut activated
'focusChanged'     // Focus moved to new element
'settingsChanged'  // Accessibility settings modified
```

### Event Handling

#### Event Registration
```javascript
// Register event listeners
mapComponent.on('centerChanged', (event) => {
  console.log('New center:', event.center);
  updateURL(event.center);
});

// Multiple event types
mapComponent.on(['zoomChanged', 'centerChanged'], (event) => {
  updateMapState(event);
});

// One-time event listener
mapComponent.once('mapReady', (event) => {
  initializeCustomFeatures();
});
```

#### Event Emission
```javascript
// Emit custom events
mapComponent.emit('customEvent', {
  type: 'customEvent',
  data: customData,
  timestamp: new Date()
});
```

#### Event Cleanup
```javascript
// Remove specific listener
mapComponent.off('centerChanged', specificHandler);

// Remove all listeners for event type
mapComponent.off('centerChanged');

// Remove all listeners
mapComponent.off();
```

---

## Configuration API

### Application Configuration

#### Map Configuration
```javascript
// Default map configuration
const mapConfig = {
  center: [-95, 40],
  zoom: 6,
  projection: 'EPSG:3857',
  minZoom: 2,
  maxZoom: 18,
  controls: {
    zoom: true,
    attribution: true,
    scale: false
  }
};
```

#### Layer Configuration
```javascript
// Layer definitions
const layerConfigs = {
  radar: {
    type: 'tile',
    url: 'https://api.weather.gov/radar/{z}/{x}/{y}.png',
    opacity: 0.7,
    visible: true,
    attribution: 'NOAA/NWS'
  },
  states: {
    type: 'vector',
    url: '/data/states.geojson',
    style: {
      stroke: '#333',
      strokeWidth: 2,
      fill: 'transparent'
    }
  }
};
```

#### UI Configuration
```javascript
// UI component settings
const uiConfig = {
  controls: {
    position: 'top-right',
    theme: 'glassmorphism',
    animations: true
  },
  mobile: {
    gestures: true,
    hapticFeedback: true,
    drawer: true
  },
  accessibility: {
    screenReader: true,
    keyboardNavigation: true,
    highContrast: false,
    reduceMotion: false
  }
};
```

### Runtime Configuration

#### Dynamic Configuration Updates
```javascript
// Update configuration at runtime
mapComponent.updateConfig({
  center: [-100, 35],
  zoom: 8
});

// Update layer configuration
mapComponent.updateLayerConfig('radar', {
  opacity: 0.5,
  visible: false
});
```

---

## Error Handling

### Error Types

#### Network Errors
```javascript
class NetworkError extends Error {
  constructor(message, status, url) {
    super(message);
    this.name = 'NetworkError';
    this.status = status;
    this.url = url;
  }
}
```

#### Validation Errors
```javascript
class ValidationError extends Error {
  constructor(message, field, value) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }
}
```

#### Configuration Errors
```javascript
class ConfigurationError extends Error {
  constructor(message, config) {
    super(message);
    this.name = 'ConfigurationError';
    this.config = config;
  }
}
```

### Error Handling Patterns

#### API Error Handling
```javascript
try {
  const layer = await mapComponent.addLayer(layerConfig);
  console.log('Layer added successfully:', layer);
} catch (error) {
  switch (error.name) {
    case 'NetworkError':
      handleNetworkError(error);
      break;
    case 'ValidationError':
      handleValidationError(error);
      break;
    default:
      handleGenericError(error);
  }
}
```

#### Error Recovery
```javascript
// Automatic retry with exponential backoff
async function retryOperation(operation, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000);
    }
  }
}
```

#### User-Friendly Error Messages
```javascript
function getUserFriendlyMessage(error) {
  const messages = {
    'NetworkError': 'Unable to connect to weather services. Please check your internet connection.',
    'ValidationError': 'Invalid input provided. Please check your data and try again.',
    'ConfigurationError': 'Configuration error. Please contact support if this persists.'
  };
  
  return messages[error.name] || 'An unexpected error occurred. Please try again.';
}
```

---

## API Examples

### Complete Integration Example

```javascript
// Initialize application
import { MapComponent } from './src/components/map-component.js';
import { UIControls } from './src/components/ui-controls.js';
import { DataVisualization } from './src/components/data-visualization.js';

async function initializeWeatherApp() {
  try {
    // Create map component
    const map = new MapComponent('map-container', {
      center: [-95, 40],
      zoom: 6
    });
    
    await map.initialize();
    
    // Add weather layers
    await map.addLayer({
      id: 'radar',
      type: 'radar',
      url: 'https://api.weather.gov/radar/{z}/{x}/{y}.png'
    });
    
    await map.addLayer({
      id: 'states',
      type: 'vector',
      url: '/data/states.geojson'
    });
    
    // Initialize UI controls
    const ui = new UIControls(map, document.getElementById('controls'));
    
    // Initialize data visualization
    const dataViz = new DataVisualization(map);
    await dataViz.startStreaming('wss://api.weather.gov/stream');
    
    // Setup event handlers
    map.on('layerAdded', (event) => {
      console.log('Layer added:', event.layer.id);
    });
    
    ui.on('layerToggle', (event) => {
      map.setLayerVisibility(event.layerId, event.visible);
    });
    
    console.log('Weather application initialized successfully');
    
  } catch (error) {
    console.error('Failed to initialize weather application:', error);
    showErrorMessage('Failed to load weather application. Please refresh and try again.');
  }
}

// Start the application
initializeWeatherApp();
```

---

*This API documentation provides comprehensive coverage of all public APIs in the Layers Radar States Streets application. For implementation details, refer to the source code and inline documentation.*
