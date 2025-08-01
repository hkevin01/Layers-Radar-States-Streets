/**
 * UI Controls Component - Enhanced map controls and interface elements
 */

export class UIControls {
  constructor(mapComponent) {
    this.mapComponent = mapComponent;
    this.map = mapComponent.getMap();
    this.controlsContainer = null;
    this.isVisible = true;
  }

  /**
   * Initialize all UI controls
   */
  initialize() {
    this.createControlsContainer();
    this.createLayerTogglePanel();
    this.createMapControls();
    this.createLoadingIndicator();
    this.createErrorDisplay();
    this.createInfoPanel();
    this.setupEventHandlers();
  }

  /**
   * Create the main controls container
   */
  createControlsContainer() {
    this.controlsContainer = document.createElement('div');
    this.controlsContainer.className = 'map-ui-controls';
    this.controlsContainer.innerHTML = `
      <div class="controls-header">
        <h3>🗺️ Map Controls</h3>
        <button class="toggle-controls" title="Toggle Controls">▼</button>
      </div>
      <div class="controls-content">
        <div id="layer-controls"></div>
        <div id="map-tools"></div>
        <div id="info-panel"></div>
      </div>
    `;
    
    document.body.appendChild(this.controlsContainer);
  }

  /**
   * Create enhanced layer toggle panel
   */
  createLayerTogglePanel() {
    const layerControls = document.getElementById('layer-controls');
    const layers = this.mapComponent.layers;
    
    layerControls.innerHTML = `
      <div class="layer-section">
        <h4>🌩️ Weather Layers</h4>
        <div class="layer-control">
          <label class="layer-toggle">
            <input type="checkbox" id="radar-toggle" ${layers.radar?.visibility ? 'checked' : ''}>
            <span class="slider"></span>
            NEXRAD Radar
          </label>
          <div class="layer-options">
            <label>Opacity: <input type="range" id="radar-opacity" min="0" max="100" value="80"></label>
          </div>
        </div>
      </div>
      
      <div class="layer-section">
        <h4>🗺️ Base Layers</h4>
        <div class="layer-control">
          <label class="layer-toggle">
            <input type="radio" name="baselayer" value="osm" checked>
            OpenStreetMap
          </label>
        </div>
        <div class="layer-control">
          <label class="layer-toggle">
            <input type="radio" name="baselayer" value="streets">
            Streets
          </label>
        </div>
      </div>
      
      <div class="layer-section">
        <h4>📍 Overlay Layers</h4>
        <div class="layer-control">
          <label class="layer-toggle">
            <input type="checkbox" id="states-toggle">
            <span class="slider"></span>
            State Boundaries
          </label>
        </div>
        <div class="layer-control">
          <label class="layer-toggle">
            <input type="checkbox" id="hazard-toggle" checked>
            <span class="slider"></span>
            Hazard Markers
          </label>
        </div>
      </div>
    `;
  }

  /**
   * Create map tools panel
   */
  createMapControls() {
    const mapTools = document.getElementById('map-tools');
    
    mapTools.innerHTML = `
      <div class="tools-section">
        <h4>🛠️ Map Tools</h4>
        <div class="tool-buttons">
          <button class="tool-btn" id="zoom-extent" title="Zoom to Full Extent">🌍</button>
          <button class="tool-btn" id="zoom-in" title="Zoom In">🔍+</button>
          <button class="tool-btn" id="zoom-out" title="Zoom Out">🔍-</button>
          <button class="tool-btn" id="refresh-data" title="Refresh Data">🔄</button>
          <button class="tool-btn" id="screenshot" title="Take Screenshot">📸</button>
        </div>
        
        <div class="coordinate-display">
          <label>📍 Mouse Position:</label>
          <div id="mouse-coords">--, --</div>
        </div>
        
        <div class="zoom-display">
          <label>🔍 Zoom Level:</label>
          <div id="zoom-level">4</div>
        </div>
      </div>
    `;
  }

  /**
   * Create loading indicator
   */
  createLoadingIndicator() {
    const loader = document.createElement('div');
    loader.id = 'enhanced-loading';
    loader.className = 'loading-overlay hidden';
    loader.innerHTML = `
      <div class="loading-content">
        <div class="spinner"></div>
        <div class="loading-text">Loading radar data...</div>
        <div class="loading-progress">
          <div class="progress-bar"></div>
        </div>
      </div>
    `;
    document.body.appendChild(loader);
  }

  /**
   * Create error display
   */
  createErrorDisplay() {
    const errorDisplay = document.createElement('div');
    errorDisplay.id = 'enhanced-error';
    errorDisplay.className = 'error-overlay hidden';
    errorDisplay.innerHTML = `
      <div class="error-content">
        <div class="error-icon">⚠️</div>
        <div class="error-message"></div>
        <div class="error-actions">
          <button class="retry-btn">🔄 Retry</button>
          <button class="dismiss-btn">✖ Dismiss</button>
        </div>
      </div>
    `;
    document.body.appendChild(errorDisplay);
  }

  /**
   * Create info panel
   */
  createInfoPanel() {
    const infoPanel = document.getElementById('info-panel');
    
    infoPanel.innerHTML = `
      <div class="info-section">
        <h4>ℹ️ Information</h4>
        <div class="info-item">
          <label>🕒 Last Update:</label>
          <div id="last-update">--</div>
        </div>
        <div class="info-item">
          <label>📡 Data Source:</label>
          <div id="data-source">NEXRAD</div>
        </div>
        <div class="info-item">
          <label>🎯 Center:</label>
          <div id="map-center">-97.0°, 38.0°</div>
        </div>
      </div>
    `;
  }

  /**
   * Setup event handlers for UI controls
   */
  setupEventHandlers() {
    // Toggle controls visibility
    const toggleBtn = this.controlsContainer.querySelector('.toggle-controls');
    const content = this.controlsContainer.querySelector('.controls-content');
    
    toggleBtn.addEventListener('click', () => {
      this.isVisible = !this.isVisible;
      content.style.display = this.isVisible ? 'block' : 'none';
      toggleBtn.textContent = this.isVisible ? '▼' : '▶';
    });

    // Layer toggles
    this.setupLayerToggles();
    
    // Map tools
    this.setupMapTools();
    
    // Mouse position tracking
    this.setupMouseTracking();
    
    // Zoom level tracking
    this.setupZoomTracking();
  }

  /**
   * Setup layer toggle functionality
   */
  setupLayerToggles() {
    const radarToggle = document.getElementById('radar-toggle');
    const radarOpacity = document.getElementById('radar-opacity');
    const statesToggle = document.getElementById('states-toggle');
    const hazardToggle = document.getElementById('hazard-toggle');

    if (radarToggle) {
      radarToggle.addEventListener('change', (e) => {
        const layer = this.mapComponent.getLayer('radar');
        if (layer) {
          layer.setVisibility(e.target.checked);
        }
      });
    }

    if (radarOpacity) {
      radarOpacity.addEventListener('input', (e) => {
        const layer = this.mapComponent.getLayer('radar');
        if (layer) {
          layer.setOpacity(e.target.value / 100);
        }
      });
    }

    // Base layer radio buttons
    const baseLayerRadios = document.querySelectorAll('input[name="baselayer"]');
    baseLayerRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.switchBaseLayer(e.target.value);
        }
      });
    });
  }

  /**
   * Setup map tools functionality
   */
  setupMapTools() {
    document.getElementById('zoom-extent')?.addEventListener('click', () => {
      this.map.zoomToMaxExtent();
    });

    document.getElementById('zoom-in')?.addEventListener('click', () => {
      this.map.zoomIn();
    });

    document.getElementById('zoom-out')?.addEventListener('click', () => {
      this.map.zoomOut();
    });

    document.getElementById('refresh-data')?.addEventListener('click', () => {
      this.refreshMapData();
    });

    document.getElementById('screenshot')?.addEventListener('click', () => {
      this.takeScreenshot();
    });
  }

  /**
   * Setup mouse position tracking
   */
  setupMouseTracking() {
    const coordsDisplay = document.getElementById('mouse-coords');
    
    this.map.events.register('mousemove', this, (e) => {
      const position = this.map.getLonLatFromPixel(e.xy);
      if (position) {
        const transformed = position.transform(
          this.map.getProjectionObject(),
          new OpenLayers.Projection('EPSG:4326')
        );
        coordsDisplay.textContent = `${transformed.lon.toFixed(3)}°, ${transformed.lat.toFixed(3)}°`;
      }
    });
  }

  /**
   * Setup zoom level tracking
   */
  setupZoomTracking() {
    const zoomDisplay = document.getElementById('zoom-level');
    
    this.map.events.register('zoomend', this, () => {
      zoomDisplay.textContent = this.map.getZoom();
    });
  }

  /**
   * Switch base layer
   */
  switchBaseLayer(layerType) {
    const layers = this.mapComponent.layers;
    
    // Hide all base layers
    Object.values(layers).forEach(layer => {
      if (layer && layer.isBaseLayer) {
        layer.setVisibility(false);
      }
    });
    
    // Show selected layer
    if (layers[layerType]) {
      layers[layerType].setVisibility(true);
    }
  }

  /**
   * Refresh map data
   */
  refreshMapData() {
    this.showLoading('Refreshing data...');
    this.mapComponent.loadInitialData();
    setTimeout(() => this.hideLoading(), 2000);
  }

  /**
   * Take screenshot of map
   */
  takeScreenshot() {
    // Implementation would depend on available libraries
    console.log('Screenshot functionality to be implemented');
  }

  /**
   * Show loading indicator
   */
  showLoading(message = 'Loading...') {
    const loader = document.getElementById('enhanced-loading');
    const text = loader.querySelector('.loading-text');
    text.textContent = message;
    loader.classList.remove('hidden');
  }

  /**
   * Hide loading indicator
   */
  hideLoading() {
    const loader = document.getElementById('enhanced-loading');
    loader.classList.add('hidden');
  }

  /**
   * Show error message
   */
  showError(message, canRetry = true) {
    const errorDisplay = document.getElementById('enhanced-error');
    const messageEl = errorDisplay.querySelector('.error-message');
    const retryBtn = errorDisplay.querySelector('.retry-btn');
    
    messageEl.textContent = message;
    retryBtn.style.display = canRetry ? 'block' : 'none';
    errorDisplay.classList.remove('hidden');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      errorDisplay.classList.add('hidden');
    }, 5000);
  }

  /**
   * Update info panel
   */
  updateInfo(info) {
    if (info.lastUpdate) {
      document.getElementById('last-update').textContent = info.lastUpdate;
    }
    if (info.center) {
      document.getElementById('map-center').textContent = 
        `${info.center.lon.toFixed(1)}°, ${info.center.lat.toFixed(1)}°`;
    }
  }
}
