/**
 * Mobile Touch Controls Component - Enhanced mobile interface
 */

export class MobileTouchControls {
  constructor(mapComponent) {
    this.mapComponent = mapComponent;
    this.map = mapComponent.getMap();
    this.isMobile = this.detectMobile();
    this.touchStartPos = null;
    this.isDoubleTouch = false;
    this.lastTouchTime = 0;
  }

  /**
   * Detect if device is mobile
   */
  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
  }

  /**
   * Initialize mobile controls
   */
  initialize() {
    if (!this.isMobile) return;

    this.createMobileUI();
    this.setupTouchHandlers();
    this.setupGestureHandlers();
    this.optimizeForMobile();
  }

  /**
   * Create mobile-specific UI elements
   */
  createMobileUI() {
    // Create mobile control panel
    const mobileControls = document.createElement('div');
    mobileControls.className = 'mobile-controls';
    mobileControls.innerHTML = `
      <div class="mobile-controls-top">
        <button class="mobile-btn location-btn" title="My Location">📍</button>
        <button class="mobile-btn layers-btn" title="Layers">🗂️</button>
        <button class="mobile-btn menu-btn" title="Menu">☰</button>
      </div>
      
      <div class="mobile-controls-bottom">
        <div class="zoom-controls">
          <button class="mobile-btn zoom-in-btn" title="Zoom In">+</button>
          <button class="mobile-btn zoom-out-btn" title="Zoom Out">−</button>
        </div>
        <button class="mobile-btn refresh-btn" title="Refresh">🔄</button>
      </div>
      
      <div class="mobile-drawer hidden">
        <div class="drawer-header">
          <h3>Map Layers</h3>
          <button class="close-drawer">✖</button>
        </div>
        <div class="drawer-content" id="mobile-layer-content">
          <!-- Layer controls will be populated here -->
        </div>
      </div>
      
      <div class="mobile-menu hidden">
        <div class="menu-header">
          <h3>Menu</h3>
          <button class="close-menu">✖</button>
        </div>
        <div class="menu-content">
          <button class="menu-item" data-action="fullscreen">🔳 Fullscreen</button>
          <button class="menu-item" data-action="share">📤 Share Location</button>
          <button class="menu-item" data-action="help">❓ Help</button>
          <button class="menu-item" data-action="about">ℹ️ About</button>
        </div>
      </div>
    `;

    document.body.appendChild(mobileControls);
    this.populateLayerDrawer();
  }

  /**
   * Populate the mobile layer drawer
   */
  populateLayerDrawer() {
    const layerContent = document.getElementById('mobile-layer-content');
    const layers = this.mapComponent.layers;

    layerContent.innerHTML = `
      <div class="mobile-layer-group">
        <h4>Weather</h4>
        <div class="mobile-layer-item">
          <label class="mobile-switch">
            <input type="checkbox" id="mobile-radar-toggle" ${layers.radar?.visibility ? 'checked' : ''}>
            <span class="mobile-slider"></span>
          </label>
          <span>NEXRAD Radar</span>
        </div>
      </div>
      
      <div class="mobile-layer-group">
        <h4>Base Maps</h4>
        <div class="mobile-layer-item">
          <label class="mobile-radio">
            <input type="radio" name="mobile-base" value="osm" checked>
            <span>OpenStreetMap</span>
          </label>
        </div>
        <div class="mobile-layer-item">
          <label class="mobile-radio">
            <input type="radio" name="mobile-base" value="streets">
            <span>Streets</span>
          </label>
        </div>
      </div>
      
      <div class="mobile-layer-group">
        <h4>Overlays</h4>
        <div class="mobile-layer-item">
          <label class="mobile-switch">
            <input type="checkbox" id="mobile-states-toggle">
            <span class="mobile-slider"></span>
          </label>
          <span>State Boundaries</span>
        </div>
        <div class="mobile-layer-item">
          <label class="mobile-switch">
            <input type="checkbox" id="mobile-hazard-toggle" checked>
            <span class="mobile-slider"></span>
          </label>
          <span>Hazard Markers</span>
        </div>
      </div>
    `;
  }

  /**
   * Setup touch-specific handlers
   */
  setupTouchHandlers() {
    const mapDiv = this.map.div;

    // Prevent default touch behaviors that interfere with map
    mapDiv.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    mapDiv.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    mapDiv.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });

    // Setup button handlers
    this.setupMobileButtonHandlers();
  }

  /**
   * Setup mobile button handlers
   */
  setupMobileButtonHandlers() {
    // Location button
    document.querySelector('.location-btn')?.addEventListener('click', () => {
      this.getCurrentLocation();
    });

    // Layers button
    document.querySelector('.layers-btn')?.addEventListener('click', () => {
      this.toggleLayerDrawer();
    });

    // Menu button
    document.querySelector('.menu-btn')?.addEventListener('click', () => {
      this.toggleMenu();
    });

    // Zoom controls
    document.querySelector('.zoom-in-btn')?.addEventListener('click', () => {
      this.map.zoomIn();
      this.hapticFeedback();
    });

    document.querySelector('.zoom-out-btn')?.addEventListener('click', () => {
      this.map.zoomOut();
      this.hapticFeedback();
    });

    // Refresh button
    document.querySelector('.refresh-btn')?.addEventListener('click', () => {
      this.mapComponent.loadInitialData();
      this.hapticFeedback();
    });

    // Drawer and menu close buttons
    document.querySelector('.close-drawer')?.addEventListener('click', () => {
      this.toggleLayerDrawer(false);
    });

    document.querySelector('.close-menu')?.addEventListener('click', () => {
      this.toggleMenu(false);
    });

    // Menu items
    document.querySelectorAll('.menu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        this.handleMenuAction(e.target.dataset.action);
      });
    });
  }

  /**
   * Handle touch start
   */
  handleTouchStart(e) {
    const now = Date.now();
    const timeDiff = now - this.lastTouchTime;

    if (e.touches.length === 1) {
      this.touchStartPos = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: now
      };

      // Detect double tap
      if (timeDiff < 300) {
        this.handleDoubleTap(e);
        e.preventDefault();
      }
    } else if (e.touches.length === 2) {
      this.isDoubleTouch = true;
    }

    this.lastTouchTime = now;
  }

  /**
   * Handle touch move
   */
  handleTouchMove(e) {
    // Allow default map panning for single touch
    if (e.touches.length === 1 && !this.isDoubleTouch) {
      return;
    }

    // Prevent zoom for two-finger gestures (let OpenLayers handle it)
    if (e.touches.length === 2) {
      e.preventDefault();
    }
  }

  /**
   * Handle touch end
   */
  handleTouchEnd(e) {
    if (e.touches.length === 0) {
      this.isDoubleTouch = false;
      this.touchStartPos = null;
    }
  }

  /**
   * Handle double tap
   */
  handleDoubleTap(e) {
    const mapPos = this.map.getLonLatFromPixel(
      new OpenLayers.Pixel(e.touches[0].clientX, e.touches[0].clientY)
    );
    
    if (mapPos) {
      this.map.setCenter(mapPos, this.map.getZoom() + 1);
      this.hapticFeedback();
    }
  }

  /**
   * Setup gesture handlers
   */
  setupGestureHandlers() {
    // Pinch to zoom is handled by OpenLayers
    // Add any custom gesture handling here
  }

  /**
   * Get current location
   */
  getCurrentLocation() {
    if (!navigator.geolocation) {
      this.showMobileToast('Geolocation not supported');
      return;
    }

    this.showMobileToast('Getting location...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const lonLat = new OpenLayers.LonLat(longitude, latitude)
          .transform(
            new OpenLayers.Projection('EPSG:4326'),
            this.map.getProjectionObject()
          );
        
        this.map.setCenter(lonLat, Math.max(this.map.getZoom(), 10));
        this.addLocationMarker(lonLat);
        this.showMobileToast('Location found!');
        this.hapticFeedback();
      },
      (error) => {
        this.showMobileToast('Location access denied');
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }

  /**
   * Add location marker
   */
  addLocationMarker(lonLat) {
    // Remove existing location marker
    if (this.locationMarker) {
      this.locationMarker.destroy();
    }

    // Create location marker
    const locationLayer = new OpenLayers.Layer.Markers('Your Location');
    const marker = new OpenLayers.Marker(lonLat);
    
    // Style the marker for current location
    marker.icon.url = 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="8" fill="#4285F4" stroke="white" stroke-width="2"/>
        <circle cx="10" cy="10" r="3" fill="white"/>
      </svg>
    `);
    
    locationLayer.addMarker(marker);
    this.map.addLayer(locationLayer);
    this.locationMarker = locationLayer;
  }

  /**
   * Toggle layer drawer
   */
  toggleLayerDrawer(show = null) {
    const drawer = document.querySelector('.mobile-drawer');
    const isVisible = !drawer.classList.contains('hidden');
    
    if (show === null) show = !isVisible;
    
    if (show) {
      drawer.classList.remove('hidden');
      document.body.classList.add('drawer-open');
    } else {
      drawer.classList.add('hidden');
      document.body.classList.remove('drawer-open');
    }
  }

  /**
   * Toggle menu
   */
  toggleMenu(show = null) {
    const menu = document.querySelector('.mobile-menu');
    const isVisible = !menu.classList.contains('hidden');
    
    if (show === null) show = !isVisible;
    
    if (show) {
      menu.classList.remove('hidden');
      document.body.classList.add('menu-open');
    } else {
      menu.classList.add('hidden');
      document.body.classList.remove('menu-open');
    }
  }

  /**
   * Handle menu actions
   */
  handleMenuAction(action) {
    switch (action) {
      case 'fullscreen':
        this.toggleFullscreen();
        break;
      case 'share':
        this.shareLocation();
        break;
      case 'help':
        this.showHelp();
        break;
      case 'about':
        this.showAbout();
        break;
    }
    this.toggleMenu(false);
  }

  /**
   * Toggle fullscreen
   */
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        this.showMobileToast('Fullscreen not supported');
      });
    } else {
      document.exitFullscreen();
    }
  }

  /**
   * Share current location
   */
  shareLocation() {
    const center = this.map.getCenter().transform(
      this.map.getProjectionObject(),
      new OpenLayers.Projection('EPSG:4326')
    );
    
    const url = `${window.location.origin}${window.location.pathname}?lat=${center.lat.toFixed(4)}&lon=${center.lon.toFixed(4)}&zoom=${this.map.getZoom()}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Radar Map Location',
        text: 'Check out this location on the radar map',
        url: url
      });
    } else {
      navigator.clipboard.writeText(url).then(() => {
        this.showMobileToast('Location link copied!');
      });
    }
  }

  /**
   * Show help
   */
  showHelp() {
    this.showMobileToast('Pinch to zoom, drag to pan, double-tap to zoom in');
  }

  /**
   * Show about
   */
  showAbout() {
    this.showMobileToast('NEXRAD Radar Visualization v2.0');
  }

  /**
   * Optimize interface for mobile
   */
  optimizeForMobile() {
    // Increase touch target sizes
    const style = document.createElement('style');
    style.textContent = `
      .olControlLayerSwitcher {
        font-size: 16px !important;
      }
      .olControlLayerSwitcher .layersDiv {
        padding: 15px !important;
      }
      .olControlLayerSwitcher input {
        transform: scale(1.5) !important;
        margin: 8px !important;
      }
    `;
    document.head.appendChild(style);

    // Disable text selection on map
    this.map.div.style.userSelect = 'none';
    this.map.div.style.webkitUserSelect = 'none';
  }

  /**
   * Show mobile toast notification
   */
  showMobileToast(message, duration = 3000) {
    // Remove existing toast
    const existing = document.querySelector('.mobile-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'mobile-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Auto remove
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  /**
   * Provide haptic feedback
   */
  hapticFeedback() {
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }
}
