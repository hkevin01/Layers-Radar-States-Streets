/**
 * UI Controller Module
 * Manages all user interface interactions and updates
 * @author NEXRAD Radar Team
 * @version 2.0.0
 */

/**
 * UI Controller Class
 * Handles all UI interactions, updates, and responsive behavior
 */
export class UIController extends EventTarget {
    constructor(app) {
        super();
        this.app = app;
        this.map = app.map;
        this.layerManager = app.layerManager;
        this.radarController = app.radarController;
        this.alertsManager = app.alertsManager;
        this.timelineController = app.timelineController;
        
        this.activeView = 'current';
        this.isMobile = window.innerWidth <= 768;
        this.isFullscreen = false;
        this.sidebarCollapsed = this.isMobile;
        
        // UI element references
        this.elements = {};
        
        this.isInitialized = false;
    }

    /**
     * Initialize the UI controller
     */
    async init() {
        try {
            console.log('Initializing UI Controller...');
            
            // Cache DOM elements
            this.cacheElements();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize UI components
            this.initializeComponents();
            
            // Setup responsive behavior
            this.setupResponsiveBehavior();
            
            // Initial UI state
            this.updateUIState();
            
            this.isInitialized = true;
            console.log('UI Controller initialized successfully');
            
            this.dispatchEvent(new CustomEvent('ui:initialized'));
            
        } catch (error) {
            console.error('Failed to initialize UI Controller:', error);
            throw error;
        }
    }

    /**
     * Cache DOM element references
     */
    cacheElements() {
        this.elements = {
            // Main containers
            sidebar: document.getElementById('sidebar'),
            mainContent: document.getElementById('main-content'),
            mapContainer: document.getElementById('map'),
            
            // Header elements
            alertsBanner: document.getElementById('alerts-banner'),
            alertsCount: document.querySelector('.alerts-count'),
            alertsText: document.querySelector('.alerts-text'),
            
            // Navigation
            navButtons: document.querySelectorAll('.nav-button'),
            currentBtn: document.getElementById('current-btn'),
            animationBtn: document.getElementById('animation-btn'),
            alertsBtn: document.getElementById('alerts-btn'),
            
            // Sidebar sections
            layerControls: document.getElementById('layer-controls'),
            radarControls: document.getElementById('radar-controls'),
            animationControls: document.getElementById('animation-controls'),
            weatherInfo: document.getElementById('weather-info'),
            
            // Layer controls
            baseLayerSelect: document.getElementById('base-layer-select'),
            radarTypeSelect: document.getElementById('radar-type-select'),
            radarOpacitySlider: document.getElementById('radar-opacity'),
            overlayToggles: document.querySelectorAll('.overlay-toggle'),
            
            // Animation controls
            playPauseBtn: document.getElementById('play-pause-btn'),
            prevFrameBtn: document.getElementById('prev-frame-btn'),
            nextFrameBtn: document.getElementById('next-frame-btn'),
            speedSelect: document.getElementById('speed-select'),
            loopToggle: document.getElementById('loop-toggle'),
            timelineSlider: document.getElementById('timeline-slider'),
            currentTimeDisplay: document.getElementById('current-time'),
            
            // Weather info
            radarTypeDisplay: document.getElementById('radar-type-display'),
            lastUpdateDisplay: document.getElementById('last-update'),
            frameInfoDisplay: document.getElementById('frame-info'),
            
            // Settings modal
            settingsBtn: document.getElementById('settings-btn'),
            settingsModal: document.getElementById('settings-modal'),
            settingsCloseBtn: document.querySelector('.settings-close'),
            
            // Mobile elements
            menuToggle: document.getElementById('menu-toggle'),
            mobileDrawer: document.getElementById('mobile-drawer'),
            drawerClose: document.getElementById('drawer-close'),
            
            // Loading indicator
            loadingIndicator: document.getElementById('loading-indicator'),
            
            // Feature info popup
            featurePopup: document.getElementById('feature-popup'),
            popupClose: document.querySelector('.popup-close'),
            popupContent: document.querySelector('.popup-content')
        };
        
        console.log('DOM elements cached');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Navigation buttons
        this.elements.navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleNavigation(e));
        });
        
        // Layer controls
        if (this.elements.baseLayerSelect) {
            this.elements.baseLayerSelect.addEventListener('change', (e) => {
                this.layerManager.switchBaseLayer(e.target.value);
            });
        }
        
        if (this.elements.radarTypeSelect) {
            this.elements.radarTypeSelect.addEventListener('change', (e) => {
                this.radarController.setRadarType(e.target.value);
            });
        }
        
        if (this.elements.radarOpacitySlider) {
            this.elements.radarOpacitySlider.addEventListener('input', (e) => {
                const opacity = parseFloat(e.target.value);
                this.updateRadarOpacity(opacity);
            });
        }
        
        // Overlay toggles
        this.elements.overlayToggles.forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const layerKey = e.target.dataset.layer;
                this.layerManager.setLayerVisibility(`overlay_${layerKey}`, e.target.checked);
            });
        });
        
        // Animation controls
        if (this.elements.playPauseBtn) {
            this.elements.playPauseBtn.addEventListener('click', () => {
                this.timelineController.togglePlayback();
            });
        }
        
        if (this.elements.prevFrameBtn) {
            this.elements.prevFrameBtn.addEventListener('click', () => {
                this.timelineController.previousFrame();
            });
        }
        
        if (this.elements.nextFrameBtn) {
            this.elements.nextFrameBtn.addEventListener('click', () => {
                this.timelineController.nextFrame();
            });
        }
        
        if (this.elements.speedSelect) {
            this.elements.speedSelect.addEventListener('change', (e) => {
                this.timelineController.setSpeed(parseInt(e.target.value));
            });
        }
        
        if (this.elements.loopToggle) {
            this.elements.loopToggle.addEventListener('change', () => {
                this.timelineController.toggleLoop();
            });
        }
        
        if (this.elements.timelineSlider) {
            this.elements.timelineSlider.addEventListener('input', (e) => {
                const percent = parseFloat(e.target.value);
                this.timelineController.seekToPercent(percent);
            });
        }
        
        // Settings modal
        if (this.elements.settingsBtn) {
            this.elements.settingsBtn.addEventListener('click', () => {
                this.openSettingsModal();
            });
        }
        
        if (this.elements.settingsCloseBtn) {
            this.elements.settingsCloseBtn.addEventListener('click', () => {
                this.closeSettingsModal();
            });
        }
        
        // Mobile menu
        if (this.elements.menuToggle) {
            this.elements.menuToggle.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }
        
        if (this.elements.drawerClose) {
            this.elements.drawerClose.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        }
        
        // Feature popup
        if (this.elements.popupClose) {
            this.elements.popupClose.addEventListener('click', () => {
                this.closeFeaturePopup();
            });
        }
        
        // Module event listeners
        this.setupModuleEventListeners();
        
        console.log('Event listeners set up');
    }

    /**
     * Setup module event listeners
     */
    setupModuleEventListeners() {
        // Radar controller events
        this.radarController.addEventListener('radar:updated', (e) => {
            this.updateRadarInfo(e.detail);
        });
        
        this.radarController.addEventListener('radar:type:changed', (e) => {
            this.updateRadarTypeDisplay(e.detail);
        });
        
        // Timeline controller events
        this.timelineController.addEventListener('timeline:frame:changed', (e) => {
            this.updateTimelineDisplay(e.detail);
        });
        
        this.timelineController.addEventListener('timeline:play', () => {
            this.updatePlaybackButton(true);
        });
        
        this.timelineController.addEventListener('timeline:pause', () => {
            this.updatePlaybackButton(false);
        });
        
        // Alerts manager events
        this.alertsManager.addEventListener('alerts:updated', (e) => {
            this.updateAlertsDisplay(e.detail);
        });
        
        // Layer manager events
        this.layerManager.addEventListener('layer:visibility:changed', (e) => {
            this.updateLayerControls(e.detail);
        });
    }

    /**
     * Initialize UI components
     */
    initializeComponents() {
        // Populate radar type options
        this.populateRadarTypes();
        
        // Populate speed options
        this.populateSpeedOptions();
        
        // Initialize layer controls
        this.initializeLayerControls();
        
        // Set initial opacity values
        this.initializeOpacityControls();
        
        console.log('UI components initialized');
    }

    /**
     * Populate radar type select options
     */
    populateRadarTypes() {
        if (!this.elements.radarTypeSelect) return;
        
        const radarTypes = this.radarController.getAvailableRadarTypes();
        
        this.elements.radarTypeSelect.innerHTML = '';
        radarTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type.key;
            option.textContent = type.name;
            option.selected = type.active;
            this.elements.radarTypeSelect.appendChild(option);
        });
    }

    /**
     * Populate animation speed options
     */
    populateSpeedOptions() {
        if (!this.elements.speedSelect) return;
        
        const speedOptions = this.timelineController.getSpeedOptions();
        
        this.elements.speedSelect.innerHTML = '';
        speedOptions.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.label;
            optionElement.selected = option.active;
            this.elements.speedSelect.appendChild(optionElement);
        });
    }

    /**
     * Initialize layer controls
     */
    initializeLayerControls() {
        const layerConfig = this.layerManager.getLayerConfiguration();
        
        // Set overlay toggle states
        this.elements.overlayToggles.forEach(toggle => {
            const layerKey = toggle.dataset.layer;
            const overlayLayer = layerConfig.overlay.find(layer => layer.key === layerKey);
            if (overlayLayer) {
                toggle.checked = overlayLayer.visible;
            }
        });
    }

    /**
     * Initialize opacity controls
     */
    initializeOpacityControls() {
        if (this.elements.radarOpacitySlider) {
            this.elements.radarOpacitySlider.value = '0.7'; // Default radar opacity
        }
    }

    /**
     * Setup responsive behavior
     */
    setupResponsiveBehavior() {
        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // Handle orientation change on mobile
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleResize(), 100);
        });
        
        // Initial responsive setup
        this.handleResize();
    }

    /**
     * Handle navigation button clicks
     */
    handleNavigation(event) {
        const target = event.currentTarget;
        const view = target.dataset.view;
        
        if (view) {
            this.app.setView(view);
        }
    }

    /**
     * Set active view
     */
    setActiveView(view) {
        this.activeView = view;
        
        // Update navigation buttons
        this.elements.navButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        // Show/hide relevant controls
        this.updateControlsVisibility(view);
        
        // Update URL hash
        window.location.hash = view;
        
        console.log(`Active view set to: ${view}`);
    }

    /**
     * Update controls visibility based on active view
     */
    updateControlsVisibility(view) {
        if (this.elements.animationControls) {
            this.elements.animationControls.style.display = 
                view === 'animation' ? 'block' : 'none';
        }
        
        if (this.elements.radarControls) {
            this.elements.radarControls.style.display = 
                view === 'alerts' ? 'none' : 'block';
        }
    }

    /**
     * Update radar opacity
     */
    updateRadarOpacity(opacity) {
        const currentRadarType = this.radarController.getCurrentRadarInfo().type;
        this.layerManager.setLayerOpacity(`radar_${currentRadarType}`, opacity);
    }

    /**
     * Update radar information display
     */
    updateRadarInfo(data) {
        if (this.elements.radarTypeDisplay) {
            this.elements.radarTypeDisplay.textContent = data.radarType || 'Unknown';
        }
        
        if (this.elements.lastUpdateDisplay && data.timestamp) {
            const updateTime = new Date(data.timestamp);
            this.elements.lastUpdateDisplay.textContent = 
                updateTime.toLocaleTimeString();
        }
    }

    /**
     * Update radar type display
     */
    updateRadarTypeDisplay(data) {
        if (this.elements.radarTypeSelect) {
            this.elements.radarTypeSelect.value = data.currentType;
        }
        
        if (this.elements.radarTypeDisplay) {
            this.elements.radarTypeDisplay.textContent = data.config.name;
        }
    }

    /**
     * Update timeline display
     */
    updateTimelineDisplay(data) {
        if (this.elements.timelineSlider) {
            const progress = ((data.currentFrame + 1) / data.totalFrames) * 100;
            this.elements.timelineSlider.value = progress;
        }
        
        if (this.elements.currentTimeDisplay && data.timestamp) {
            const frameTime = new Date(data.timestamp);
            this.elements.currentTimeDisplay.textContent = 
                frameTime.toLocaleTimeString();
        }
        
        if (this.elements.frameInfoDisplay) {
            this.elements.frameInfoDisplay.textContent = 
                `Frame ${data.currentFrame + 1} of ${data.totalFrames}`;
        }
    }

    /**
     * Update playback button state
     */
    updatePlaybackButton(isPlaying) {
        if (this.elements.playPauseBtn) {
            const icon = this.elements.playPauseBtn.querySelector('i');
            if (icon) {
                icon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
            }
            
            this.elements.playPauseBtn.setAttribute('aria-label', 
                isPlaying ? 'Pause animation' : 'Play animation');
        }
    }

    /**
     * Update alerts display
     */
    updateAlertsDisplay(data) {
        if (this.elements.alertsCount) {
            this.elements.alertsCount.textContent = data.alertCount || 0;
        }
        
        if (this.elements.alertsText) {
            const text = data.alertCount === 1 ? 'active alert' : 'active alerts';
            this.elements.alertsText.textContent = text;
        }
        
        // Show/hide alerts banner
        if (this.elements.alertsBanner) {
            this.elements.alertsBanner.style.display = 
                data.alertCount > 0 ? 'flex' : 'none';
        }
    }

    /**
     * Update layer controls
     */
    updateLayerControls(data) {
        const toggle = document.querySelector(`[data-layer="${data.key}"]`);
        if (toggle && toggle.type === 'checkbox') {
            toggle.checked = data.visible;
        }
    }

    /**
     * Show feature information popup
     */
    showFeatureInfo(features, coordinate) {
        if (!this.elements.featurePopup || features.length === 0) {
            return;
        }
        
        const feature = features[0]; // Show first feature
        const properties = feature.getProperties();
        
        // Build popup content
        let content = '<div class="feature-info">';
        
        if (properties.alertId) {
            // Weather alert feature
            const alert = this.alertsManager.getAlert(properties.alertId);
            if (alert) {
                content += `
                    <h4>${alert.event}</h4>
                    <p><strong>Areas:</strong> ${alert.areas}</p>
                    <p><strong>Severity:</strong> ${alert.severity}</p>
                    <p>${alert.headline}</p>
                `;
            }
        } else {
            // Generic feature
            content += '<h4>Feature Information</h4>';
            Object.entries(properties).forEach(([key, value]) => {
                if (key !== 'geometry' && value !== null && value !== undefined) {
                    content += `<p><strong>${key}:</strong> ${value}</p>`;
                }
            });
        }
        
        content += '</div>';
        
        // Update popup content
        this.elements.popupContent.innerHTML = content;
        
        // Position popup
        const pixel = this.map.getPixelFromCoordinate(coordinate);
        this.elements.featurePopup.style.left = `${pixel[0]}px`;
        this.elements.featurePopup.style.top = `${pixel[1]}px`;
        this.elements.featurePopup.style.display = 'block';
    }

    /**
     * Close feature information popup
     */
    closeFeaturePopup() {
        if (this.elements.featurePopup) {
            this.elements.featurePopup.style.display = 'none';
        }
    }

    /**
     * Open settings modal
     */
    openSettingsModal() {
        if (this.elements.settingsModal) {
            this.elements.settingsModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Close settings modal
     */
    closeSettingsModal() {
        if (this.elements.settingsModal) {
            this.elements.settingsModal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    /**
     * Toggle mobile menu
     */
    toggleMobileMenu() {
        if (this.elements.mobileDrawer) {
            this.elements.mobileDrawer.classList.toggle('open');
        }
    }

    /**
     * Close mobile menu
     */
    closeMobileMenu() {
        if (this.elements.mobileDrawer) {
            this.elements.mobileDrawer.classList.remove('open');
        }
    }

    /**
     * Close all modals and popups
     */
    closeAllModals() {
        this.closeSettingsModal();
        this.closeFeaturePopup();
        this.closeMobileMenu();
    }

    /**
     * Toggle fullscreen mode
     */
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            this.isFullscreen = true;
        } else {
            document.exitFullscreen();
            this.isFullscreen = false;
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        const newIsMobile = window.innerWidth <= 768;
        
        if (newIsMobile !== this.isMobile) {
            this.isMobile = newIsMobile;
            
            // Update sidebar collapse state
            if (this.isMobile) {
                this.sidebarCollapsed = true;
            }
            
            // Update UI layout
            this.updateUIState();
        }
        
        // Update map size
        if (this.map) {
            this.map.updateSize();
        }
    }

    /**
     * Update overall UI state
     */
    updateUIState() {
        // Update sidebar visibility
        if (this.elements.sidebar) {
            this.elements.sidebar.classList.toggle('collapsed', this.sidebarCollapsed);
        }
        
        // Update mobile-specific UI
        if (this.isMobile) {
            document.body.classList.add('mobile');
        } else {
            document.body.classList.remove('mobile');
        }
        
        // Update main content margin
        if (this.elements.mainContent) {
            const sidebarWidth = this.sidebarCollapsed ? '0' : '320px';
            this.elements.mainContent.style.marginLeft = this.isMobile ? '0' : sidebarWidth;
        }
    }

    /**
     * Show loading indicator
     */
    showLoading(message = 'Loading...') {
        if (this.elements.loadingIndicator) {
            this.elements.loadingIndicator.textContent = message;
            this.elements.loadingIndicator.style.display = 'flex';
        }
    }

    /**
     * Hide loading indicator
     */
    hideLoading() {
        if (this.elements.loadingIndicator) {
            this.elements.loadingIndicator.style.display = 'none';
        }
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        // Remove event listeners
        this.elements.navButtons.forEach(btn => {
            btn.removeEventListener('click', this.handleNavigation);
        });
        
        // Clear element references
        this.elements = {};
        
        console.log('UI Controller cleanup completed');
    }
}

export default UIController;
