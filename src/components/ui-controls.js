// ui-controls.js (OL v8 compatible)

import { toLonLat } from 'ol/proj.js';

export class UIControls {
  // Accept either { map } or { mapComponent } or both
  constructor(opts = {}) {
    const mapFromComponent = opts.mapComponent && typeof opts.mapComponent.getMap === 'function'
      ? opts.mapComponent.getMap()
      : null;

    this.map = opts.map || mapFromComponent;
    if (!this.map || typeof this.map.getView !== 'function') {
      throw new TypeError('UIControls requires an OpenLayers v8 map or a mapComponent with getMap()');
    }

    // Optional: for layer lookup and other app-specific methods
    this.mapComponent = opts.mapComponent || null;

    // Layers registry (if provided by mapComponent)
    // Expect mapComponent.layers to be a dictionary of ol/layer/Layer
    this.layers = (this.mapComponent && this.mapComponent.layers) || {};

    this.controlsContainer = null;
    this.isVisible = true;
  }

  initialize() {
    this.createControlsContainer();
    this.createLayerTogglePanel();
    this.createMapControls();
    this.createLoadingIndicator();
    this.createErrorDisplay();
    this.createInfoPanel();
    this.setupEventHandlers();
  }

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

    // Append to sidebar instead of document.body
    const target = document.getElementById('sidebar') || document.body;

    // Create collapse toggle only once
    if (!target.querySelector('.collapse-toggle')) {
      const toggleBar = document.createElement('div');
      toggleBar.className = 'collapse-toggle';
      toggleBar.innerHTML = `<button id="sidebar-toggle" title="Toggle panel">☰ Controls</button>`;
      target.prepend(toggleBar);

      // Add toggle functionality
      toggleBar.addEventListener('click', () => {
        if (window.innerWidth <= 900) {
          // Mobile: toggle slide-over
          target.classList.toggle('open');
        } else {
          // Desktop: toggle collapse
          target.classList.toggle('collapsed');
          // Trigger map resize after panel animation
          setTimeout(() => {
            if (this.map && this.map.updateSize) {
              this.map.updateSize();
            }
          }, 250);
        }
      });
    }

    target.appendChild(this.controlsContainer);

    // Add mobile toggle button if on mobile
    if (window.innerWidth <= 900 && !document.querySelector('.mobile-sidebar-toggle')) {
      const mobileToggle = document.createElement('button');
      mobileToggle.className = 'mobile-sidebar-toggle';
      mobileToggle.innerHTML = '☰';
      mobileToggle.title = 'Toggle Controls';
      mobileToggle.addEventListener('click', () => {
        target.classList.toggle('open');
      });
      document.body.appendChild(mobileToggle);
    }
  }

  createLayerTogglePanel() {
    const layerControls = this.controlsContainer.querySelector('#layer-controls');
    const layers = this.layers || {};

    const radarVisible = layers.radar ? layers.radar.getVisible?.() === true || layers.radar.visibility === true : false;

    layerControls.innerHTML = `
      <div class="layer-section">
        <h4>🌩️ Weather Layers</h4>
        <div class="layer-control">
          <label class="layer-toggle">
            <input type="checkbox" id="radar-toggle" ${radarVisible ? 'checked' : ''}>
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

  createMapControls() {
    const mapTools = this.controlsContainer.querySelector('#map-tools');
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

  createInfoPanel() {
    const infoPanel = this.controlsContainer.querySelector('#info-panel');
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

  setupEventHandlers() {
    const toggleBtn = this.controlsContainer.querySelector('.toggle-controls');
    const content = this.controlsContainer.querySelector('.controls-content');

    toggleBtn.addEventListener('click', () => {
      this.isVisible = !this.isVisible;
      content.style.display = this.isVisible ? 'block' : 'none';
      toggleBtn.textContent = this.isVisible ? '▼' : '▶';
    });

    this.setupLayerToggles();
    this.setupMapTools();
    this.setupMouseTracking();
    this.setupZoomTracking();

    // Setup ResizeObserver to handle map resize when sidebar changes
    this.setupMapResizeHandler();
  }

  setupMapResizeHandler() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar && this.map && typeof ResizeObserver !== 'undefined') {
      // Ensure map is fully initialized before setting up observer
      setTimeout(() => {
        const resizeObserver = new ResizeObserver(() => {
          // Debounce the resize to avoid excessive calls
          if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
          this.resizeTimeout = setTimeout(() => {
            if (this.map && this.map.updateSize) {
              this.map.updateSize();
            }
          }, 100);
        });
        resizeObserver.observe(sidebar);
      }, 100);
    }

    // Also handle window resize
    window.addEventListener('resize', () => {
      if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        if (this.map && this.map.updateSize) {
          this.map.updateSize();
        }
      }, 100);
    });
  }

  setupLayerToggles() {
    const radarToggle = this.controlsContainer.querySelector('#radar-toggle');
    const radarOpacity = this.controlsContainer.querySelector('#radar-opacity');
    const statesToggle = this.controlsContainer.querySelector('#states-toggle');
    const hazardToggle = this.controlsContainer.querySelector('#hazard-toggle');

    if (radarToggle) {
      radarToggle.addEventListener('change', (e) => {
        const layer = this.getLayer('radar');
        if (layer && typeof layer.setVisible === 'function') {
          layer.setVisible(e.target.checked);
        }
      });
    }

    if (radarOpacity) {
      radarOpacity.addEventListener('input', (e) => {
        const layer = this.getLayer('radar');
        if (layer && typeof layer.setOpacity === 'function') {
          layer.setOpacity(Number(e.target.value) / 100);
        }
      });
    }

    const baseLayerRadios = this.controlsContainer.querySelectorAll('input[name="baselayer"]');
    baseLayerRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.switchBaseLayer(e.target.value);
        }
      });
    });

    if (statesToggle) {
      statesToggle.addEventListener('change', (e) => {
        const layer = this.getLayer('states');
        if (layer?.setVisible) layer.setVisible(e.target.checked);
      });
    }

    if (hazardToggle) {
      hazardToggle.addEventListener('change', (e) => {
        const layer = this.getLayer('hazards');
        if (layer?.setVisible) layer.setVisible(e.target.checked);
      });
    }
  }

  setupMapTools() {
    const view = this.map.getView();

    this.controlsContainer.querySelector('#zoom-extent')?.addEventListener('click', () => {
      // Fit the view to world extent in web mercator, leaving some padding
      const worldExtent3857 = [-20037508.34, -20037508.34, 20037508.34, 20037508.34];
      view.fit(worldExtent3857, { size: this.map.getSize(), padding: [20, 20, 20, 20], duration: 250 });
    });

    this.controlsContainer.querySelector('#zoom-in')?.addEventListener('click', () => {
      const z = view.getZoom() ?? 0;
      view.setZoom(z + 1);
    });

    this.controlsContainer.querySelector('#zoom-out')?.addEventListener('click', () => {
      const z = view.getZoom() ?? 0;
      view.setZoom(z - 1);
    });

    this.controlsContainer.querySelector('#refresh-data')?.addEventListener('click', () => {
      this.refreshMapData();
    });

    this.controlsContainer.querySelector('#screenshot')?.addEventListener('click', () => {
      this.takeScreenshot();
    });
  }

  setupMouseTracking() {
    const coordsDisplay = this.controlsContainer.querySelector('#mouse-coords');
    if (!coordsDisplay) return;

    this.map.on('pointermove', (evt) => {
      if (!evt.coordinate) {
        coordsDisplay.textContent = '--, --';
        return;
      }
      const lonLat = toLonLat(evt.coordinate);
      coordsDisplay.textContent = `${lonLat[0].toFixed(3)}°, ${lonLat[1].toFixed(3)}°`;
    });
  }

  setupZoomTracking() {
    const zoomDisplay = this.controlsContainer.querySelector('#zoom-level');
    if (!zoomDisplay) return;
    const view = this.map.getView();

    const update = () => {
      const z = view.getZoom();
      zoomDisplay.textContent = Number.isFinite(z) ? String(z) : '--';
    };
    update();

    view.on('change:resolution', update);
    view.on('change:zoom', update);
  }

  switchBaseLayer(layerKey) {
    // Expect base layers keyed in this.layers, e.g. { osm: TileLayer, streets: TileLayer }
    const layers = this.layers || {};

    // Hide all known base layers
    Object.entries(layers).forEach(([key, layer]) => {
      if (!layer || typeof layer.setVisible !== 'function') return;
      // either check metadata isBaseLayer or use a whitelist of keys
      const isBase = layer.get('isBaseLayer') || ['osm', 'streets', 'satellite'].includes(key);
      if (isBase) layer.setVisible(false);
    });

    // Show selected base layer
    const target = layers[layerKey];
    if (target?.setVisible) {
      target.setVisible(true);
    }
  }

  refreshMapData() {
    this.showLoading('Refreshing data...');
    try {
      if (this.mapComponent && typeof this.mapComponent.loadInitialData === 'function') {
        this.mapComponent.loadInitialData();
      }
    } finally {
      setTimeout(() => this.hideLoading(), 1200);
    }
  }

  takeScreenshot() {
    console.log('Screenshot functionality to be implemented');
  }

  showLoading(message = 'Loading...') {
    const loader = document.getElementById('enhanced-loading');
    if (!loader) return;
    const text = loader.querySelector('.loading-text');
    if (text) text.textContent = message;
    loader.classList.remove('hidden');
  }

  hideLoading() {
    const loader = document.getElementById('enhanced-loading');
    if (!loader) return;
    loader.classList.add('hidden');
  }

  showError(message, canRetry = true) {
    const errorDisplay = document.getElementById('enhanced-error');
    if (!errorDisplay) return;
    const messageEl = errorDisplay.querySelector('.error-message');
    const retryBtn = errorDisplay.querySelector('.retry-btn');

    if (messageEl) messageEl.textContent = message;
    if (retryBtn) retryBtn.style.display = canRetry ? 'block' : 'none';
    errorDisplay.classList.remove('hidden');

    setTimeout(() => {
      errorDisplay.classList.add('hidden');
    }, 5000);
  }

  updateInfo(info) {
    if (!info) return;
    if (info.lastUpdate) {
      const el = document.getElementById('last-update');
      if (el) el.textContent = info.lastUpdate;
    }
    if (info.center && Array.isArray(info.center)) {
      const el = document.getElementById('map-center');
      if (el) el.textContent = `${info.center[0].toFixed(1)}°, ${info.center[1].toFixed(1)}°`;
    }
  }

  // Helper to retrieve a layer by key from mapComponent.layers registry
  getLayer(key) {
    if (this.layers && this.layers[key]) return this.layers[key];
    // Fallback: search by custom property 'key'
    const groups = this.map.getLayers().getArray();
    for (const layer of groups) {
      if (layer && layer.get && layer.get('key') === key) return layer;
    }
    return null;
  }
}
