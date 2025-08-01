/**
 * Advanced Data Visualization Component
 * Provides enhanced data visualization features including real-time streaming,
 * historical playback, and custom color schemes
 */

export class DataVisualization {
  constructor(mapComponent) {
    this.mapComponent = mapComponent;
    this.isPlaying = false;
    this.currentFrame = 0;
    this.totalFrames = 0;
    this.animationSpeed = 1000; // ms between frames
    this.animationTimer = null;
    this.historicalData = [];
    this.colorSchemes = {
      classic: {
        name: 'Classic',
        colors: ['#40E0D0', '#0000FF', '#00FF00', '#FFFF00', '#FFA500', '#FF0000', '#FF00FF']
      },
      viridis: {
        name: 'Viridis',
        colors: ['#440154', '#31688e', '#35b779', '#fde725']
      },
      plasma: {
        name: 'Plasma', 
        colors: ['#0d0887', '#6a00a8', '#b12a90', '#e16462', '#fca636', '#f0f921']
      },
      grayscale: {
        name: 'Grayscale',
        colors: ['#000000', '#404040', '#808080', '#c0c0c0', '#ffffff']
      }
    };
    this.currentColorScheme = 'classic';
    this.webSocket = null;
    this.isStreaming = false;
    
    this.init();
  }

  /**
   * Initialize data visualization features
   */
  init() {
    this.createVisualizationControls();
    this.setupWebSocketConnection();
    this.loadHistoricalData();
  }

  /**
   * Create visualization control panel
   */
  createVisualizationControls() {
    const container = document.getElementById('map') || document.body;
    
    const controlPanel = document.createElement('div');
    controlPanel.className = 'data-viz-controls';
    controlPanel.innerHTML = `
      <div class="viz-panel">
        <div class="viz-section">
          <h3>🎬 Animation Controls</h3>
          <div class="animation-controls">
            <button class="play-pause-btn" title="Play/Pause Animation">
              <svg class="play-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <svg class="pause-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="display: none;">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            </button>
            <button class="prev-frame-btn" title="Previous Frame">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
              </svg>
            </button>
            <button class="next-frame-btn" title="Next Frame">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
              </svg>
            </button>
            <div class="timeline-container">
              <input type="range" class="timeline-slider" min="0" max="100" value="0">
              <div class="timeline-labels">
                <span class="current-time">00:00</span>
                <span class="total-time">--:--</span>
              </div>
            </div>
          </div>
          <div class="speed-controls">
            <label>Speed:</label>
            <select class="speed-selector">
              <option value="2000">0.5x</option>
              <option value="1000" selected>1x</option>
              <option value="500">2x</option>
              <option value="250">4x</option>
            </select>
          </div>
        </div>
        
        <div class="viz-section">
          <h3>🎨 Color Schemes</h3>
          <div class="color-scheme-selector">
            ${Object.entries(this.colorSchemes).map(([key, scheme]) => `
              <button class="color-scheme-btn ${key === this.currentColorScheme ? 'active' : ''}" 
                      data-scheme="${key}">
                <div class="color-preview">
                  ${scheme.colors.map(color => `<div class="color-swatch" style="background-color: ${color}"></div>`).join('')}
                </div>
                <span>${scheme.name}</span>
              </button>
            `).join('')}
          </div>
        </div>
        
        <div class="viz-section">
          <h3>📡 Real-time Data</h3>
          <div class="streaming-controls">
            <button class="stream-toggle-btn">
              <span class="stream-status">Start Streaming</span>
              <div class="stream-indicator"></div>
            </button>
            <div class="data-info">
              <div class="last-update">Last update: <span class="update-time">--:--</span></div>
              <div class="connection-status">Status: <span class="status-text">Disconnected</span></div>
            </div>
          </div>
        </div>
        
        <div class="viz-section">
          <h3>📊 Data Layers</h3>
          <div class="layer-visualization">
            <div class="layer-option">
              <label>
                <input type="checkbox" class="layer-checkbox" data-layer="precipitation" checked>
                <span>Precipitation</span>
              </label>
              <input type="range" class="layer-opacity" min="0" max="100" value="80">
            </div>
            <div class="layer-option">
              <label>
                <input type="checkbox" class="layer-checkbox" data-layer="temperature">
                <span>Temperature</span>
              </label>
              <input type="range" class="layer-opacity" min="0" max="100" value="60">
            </div>
            <div class="layer-option">
              <label>
                <input type="checkbox" class="layer-checkbox" data-layer="wind">
                <span>Wind Speed</span>
              </label>
              <input type="range" class="layer-opacity" min="0" max="100" value="50">
            </div>
          </div>
        </div>
        
        <div class="viz-section">
          <h3>⚡ Performance</h3>
          <div class="performance-controls">
            <label>
              <input type="checkbox" class="performance-checkbox" data-feature="webgl" checked>
              WebGL Acceleration
            </label>
            <label>
              <input type="checkbox" class="performance-checkbox" data-feature="caching" checked>
              Smart Caching
            </label>
            <label>
              <input type="checkbox" class="performance-checkbox" data-feature="compression">
              Data Compression
            </label>
          </div>
        </div>
      </div>
    `;
    
    container.appendChild(controlPanel);
    this.attachEventListeners();
  }

  /**
   * Attach event listeners to controls
   */
  attachEventListeners() {
    // Animation controls
    const playPauseBtn = document.querySelector('.play-pause-btn');
    const prevFrameBtn = document.querySelector('.prev-frame-btn');
    const nextFrameBtn = document.querySelector('.next-frame-btn');
    const timelineSlider = document.querySelector('.timeline-slider');
    const speedSelector = document.querySelector('.speed-selector');

    playPauseBtn?.addEventListener('click', () => this.togglePlayback());
    prevFrameBtn?.addEventListener('click', () => this.previousFrame());
    nextFrameBtn?.addEventListener('click', () => this.nextFrame());
    timelineSlider?.addEventListener('input', (e) => this.seekToFrame(parseInt(e.target.value)));
    speedSelector?.addEventListener('change', (e) => this.setAnimationSpeed(parseInt(e.target.value)));

    // Color scheme selector
    document.querySelectorAll('.color-scheme-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const scheme = e.currentTarget.dataset.scheme;
        this.setColorScheme(scheme);
      });
    });

    // Streaming controls
    const streamToggleBtn = document.querySelector('.stream-toggle-btn');
    streamToggleBtn?.addEventListener('click', () => this.toggleStreaming());

    // Layer controls
    document.querySelectorAll('.layer-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const layer = e.target.dataset.layer;
        const enabled = e.target.checked;
        this.toggleDataLayer(layer, enabled);
      });
    });

    document.querySelectorAll('.layer-opacity').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const opacity = parseInt(e.target.value) / 100;
        this.setLayerOpacity(e.target.closest('.layer-option').querySelector('.layer-checkbox').dataset.layer, opacity);
      });
    });

    // Performance controls
    document.querySelectorAll('.performance-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const feature = e.target.dataset.feature;
        const enabled = e.target.checked;
        this.togglePerformanceFeature(feature, enabled);
      });
    });
  }

  /**
   * Setup WebSocket connection for real-time data
   */
  setupWebSocketConnection() {
    // This would connect to your real-time data service
    const wsUrl = 'wss://api.weather.gov/radar/stream'; // Example URL
    
    try {
      this.webSocket = new WebSocket(wsUrl);
      
      this.webSocket.onopen = () => {
        console.log('✅ WebSocket connected for real-time data');
        this.updateConnectionStatus('Connected', 'success');
      };
      
      this.webSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleRealtimeData(data);
      };
      
      this.webSocket.onclose = () => {
        console.log('📡 WebSocket disconnected');
        this.updateConnectionStatus('Disconnected', 'error');
        this.isStreaming = false;
        this.updateStreamingUI();
      };
      
      this.webSocket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.updateConnectionStatus('Error', 'error');
      };
      
    } catch (error) {
      console.error('❌ Failed to establish WebSocket connection:', error);
      this.updateConnectionStatus('Failed to connect', 'error');
    }
  }

  /**
   * Load historical radar data for animation
   */
  async loadHistoricalData() {
    try {
      // This would fetch historical data from your API
      const response = await fetch('/api/radar/historical?hours=2');
      
      if (response.ok) {
        this.historicalData = await response.json();
        this.totalFrames = this.historicalData.length;
        this.updateTimelineUI();
        console.log(`✅ Loaded ${this.totalFrames} historical frames`);
      }
    } catch (error) {
      console.error('❌ Failed to load historical data:', error);
      // Use mock data for demonstration
      this.generateMockHistoricalData();
    }
  }

  /**
   * Generate mock historical data for demonstration
   */
  generateMockHistoricalData() {
    this.historicalData = [];
    const now = new Date();
    
    for (let i = 0; i < 24; i++) {
      const timestamp = new Date(now.getTime() - (i * 5 * 60 * 1000)); // 5-minute intervals
      this.historicalData.unshift({
        timestamp: timestamp.toISOString(),
        frame: i,
        intensity: Math.random() * 100,
        coverage: Math.random() * 80 + 20
      });
    }
    
    this.totalFrames = this.historicalData.length;
    this.updateTimelineUI();
    console.log(`✅ Generated ${this.totalFrames} mock historical frames`);
  }

  /**
   * Toggle animation playback
   */
  togglePlayback() {
    if (this.isPlaying) {
      this.pauseAnimation();
    } else {
      this.playAnimation();
    }
  }

  /**
   * Play animation
   */
  playAnimation() {
    if (this.totalFrames === 0) return;
    
    this.isPlaying = true;
    this.updatePlayPauseUI();
    
    this.animationTimer = setInterval(() => {
      this.nextFrame();
      
      if (this.currentFrame >= this.totalFrames - 1) {
        this.currentFrame = 0; // Loop back to start
      }
    }, this.animationSpeed);
  }

  /**
   * Pause animation
   */
  pauseAnimation() {
    this.isPlaying = false;
    this.updatePlayPauseUI();
    
    if (this.animationTimer) {
      clearInterval(this.animationTimer);
      this.animationTimer = null;
    }
  }

  /**
   * Go to next frame
   */
  nextFrame() {
    if (this.currentFrame < this.totalFrames - 1) {
      this.currentFrame++;
    } else {
      this.currentFrame = 0; // Loop to beginning
    }
    this.displayFrame(this.currentFrame);
  }

  /**
   * Go to previous frame
   */
  previousFrame() {
    if (this.currentFrame > 0) {
      this.currentFrame--;
    } else {
      this.currentFrame = this.totalFrames - 1; // Loop to end
    }
    this.displayFrame(this.currentFrame);
  }

  /**
   * Seek to specific frame
   */
  seekToFrame(frameIndex) {
    this.currentFrame = Math.max(0, Math.min(frameIndex, this.totalFrames - 1));
    this.displayFrame(this.currentFrame);
  }

  /**
   * Display specific frame
   */
  displayFrame(frameIndex) {
    if (frameIndex >= 0 && frameIndex < this.totalFrames) {
      const frameData = this.historicalData[frameIndex];
      
      // Update the map with frame data
      this.updateMapWithFrameData(frameData);
      
      // Update UI
      this.updateTimelineUI();
      this.updateCurrentTimeDisplay(frameData.timestamp);
    }
  }

  /**
   * Update map with frame data
   */
  updateMapWithFrameData(frameData) {
    // This would update the actual map layers with the frame data
    console.log('🎬 Displaying frame:', frameData);
    
    // Example: Update radar layer with new data
    if (this.mapComponent && this.mapComponent.updateRadarData) {
      this.mapComponent.updateRadarData(frameData);
    }
  }

  /**
   * Set animation speed
   */
  setAnimationSpeed(speed) {
    this.animationSpeed = speed;
    
    if (this.isPlaying) {
      this.pauseAnimation();
      this.playAnimation(); // Restart with new speed
    }
  }

  /**
   * Set color scheme
   */
  setColorScheme(schemeName) {
    if (this.colorSchemes[schemeName]) {
      this.currentColorScheme = schemeName;
      
      // Update UI
      document.querySelectorAll('.color-scheme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.scheme === schemeName);
      });
      
      // Apply color scheme to map layers
      this.applyColorSchemeToMap(this.colorSchemes[schemeName]);
      
      console.log(`🎨 Color scheme changed to: ${schemeName}`);
    }
  }

  /**
   * Apply color scheme to map
   */
  applyColorSchemeToMap(colorScheme) {
    // This would update the map's color palette
    if (this.mapComponent && this.mapComponent.setColorScheme) {
      this.mapComponent.setColorScheme(colorScheme.colors);
    }
  }

  /**
   * Toggle real-time streaming
   */
  toggleStreaming() {
    if (this.isStreaming) {
      this.stopStreaming();
    } else {
      this.startStreaming();
    }
  }

  /**
   * Start real-time streaming
   */
  startStreaming() {
    if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
      this.isStreaming = true;
      this.webSocket.send(JSON.stringify({ action: 'start_stream' }));
      this.updateStreamingUI();
      console.log('📡 Started real-time streaming');
    }
  }

  /**
   * Stop real-time streaming
   */
  stopStreaming() {
    this.isStreaming = false;
    if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
      this.webSocket.send(JSON.stringify({ action: 'stop_stream' }));
    }
    this.updateStreamingUI();
    console.log('📡 Stopped real-time streaming');
  }

  /**
   * Handle real-time data from WebSocket
   */
  handleRealtimeData(data) {
    console.log('📡 Received real-time data:', data);
    
    // Update map with new data
    this.updateMapWithFrameData(data);
    
    // Update last update time
    const updateTime = new Date().toLocaleTimeString();
    const updateTimeEl = document.querySelector('.update-time');
    if (updateTimeEl) {
      updateTimeEl.textContent = updateTime;
    }
    
    // Add to historical data for playback
    this.historicalData.push(data);
    this.totalFrames = this.historicalData.length;
    
    // Keep only last 2 hours of data
    const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
    this.historicalData = this.historicalData.filter(frame => 
      new Date(frame.timestamp).getTime() > twoHoursAgo
    );
  }

  /**
   * Toggle data layer visibility
   */
  toggleDataLayer(layerName, enabled) {
    console.log(`🗂️ ${enabled ? 'Enabling' : 'Disabling'} layer: ${layerName}`);
    
    if (this.mapComponent && this.mapComponent.toggleLayer) {
      this.mapComponent.toggleLayer(layerName, enabled);
    }
  }

  /**
   * Set layer opacity
   */
  setLayerOpacity(layerName, opacity) {
    console.log(`🔍 Setting ${layerName} opacity to ${opacity}`);
    
    if (this.mapComponent && this.mapComponent.setLayerOpacity) {
      this.mapComponent.setLayerOpacity(layerName, opacity);
    }
  }

  /**
   * Toggle performance feature
   */
  togglePerformanceFeature(feature, enabled) {
    console.log(`⚡ ${enabled ? 'Enabling' : 'Disabling'} ${feature}`);
    
    switch (feature) {
      case 'webgl':
        this.toggleWebGLAcceleration(enabled);
        break;
      case 'caching':
        this.toggleSmartCaching(enabled);
        break;
      case 'compression':
        this.toggleDataCompression(enabled);
        break;
    }
  }

  /**
   * Toggle WebGL acceleration
   */
  toggleWebGLAcceleration(enabled) {
    if (this.mapComponent && this.mapComponent.setWebGLAcceleration) {
      this.mapComponent.setWebGLAcceleration(enabled);
    }
  }

  /**
   * Toggle smart caching
   */
  toggleSmartCaching(enabled) {
    // Implementation for smart caching
    console.log(`💾 Smart caching ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Toggle data compression
   */
  toggleDataCompression(enabled) {
    // Implementation for data compression
    console.log(`📦 Data compression ${enabled ? 'enabled' : 'disabled'}`);
  }

  // UI Update Methods

  updatePlayPauseUI() {
    const playIcon = document.querySelector('.play-icon');
    const pauseIcon = document.querySelector('.pause-icon');
    
    if (playIcon && pauseIcon) {
      playIcon.style.display = this.isPlaying ? 'none' : 'block';
      pauseIcon.style.display = this.isPlaying ? 'block' : 'none';
    }
  }

  updateTimelineUI() {
    const slider = document.querySelector('.timeline-slider');
    if (slider) {
      slider.max = Math.max(0, this.totalFrames - 1);
      slider.value = this.currentFrame;
    }
    
    const totalTimeEl = document.querySelector('.total-time');
    if (totalTimeEl && this.totalFrames > 0) {
      const totalMinutes = Math.floor(this.totalFrames * 5 / 60); // Assuming 5-minute intervals
      totalTimeEl.textContent = `${totalMinutes}:00`;
    }
  }

  updateCurrentTimeDisplay(timestamp) {
    const currentTimeEl = document.querySelector('.current-time');
    if (currentTimeEl && timestamp) {
      const time = new Date(timestamp);
      currentTimeEl.textContent = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }

  updateStreamingUI() {
    const statusEl = document.querySelector('.stream-status');
    const indicatorEl = document.querySelector('.stream-indicator');
    
    if (statusEl) {
      statusEl.textContent = this.isStreaming ? 'Stop Streaming' : 'Start Streaming';
    }
    
    if (indicatorEl) {
      indicatorEl.classList.toggle('active', this.isStreaming);
    }
  }

  updateConnectionStatus(status, type) {
    const statusEl = document.querySelector('.status-text');
    if (statusEl) {
      statusEl.textContent = status;
      statusEl.className = `status-text ${type}`;
    }
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    this.pauseAnimation();
    
    if (this.webSocket) {
      this.webSocket.close();
    }
    
    const controlPanel = document.querySelector('.data-viz-controls');
    if (controlPanel) {
      controlPanel.remove();
    }
  }
}
