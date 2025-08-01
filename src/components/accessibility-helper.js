/**
 * Accessibility Helper Component
 * Provides comprehensive accessibility features for WCAG 2.1 AA compliance
 */

export class AccessibilityHelper {
  constructor(mapComponent) {
    this.mapComponent = mapComponent;
    this.announcer = null;
    this.keyboardTrapStack = [];
    this.lastFocusedElement = null;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.highContrast = window.matchMedia('(prefers-contrast: high)').matches;
    this.colorBlindnessMode = null;
    this.announcements = [];
    this.skipLinks = [];
    
    this.init();
  }

  /**
   * Initialize accessibility features
   */
  init() {
    this.createScreenReaderAnnouncer();
    this.createSkipLinks();
    this.setupKeyboardNavigation();
    this.setupFocusManagement();
    this.setupColorBlindnessSupport();
    this.setupScreenReaderSupport();
    this.setupReducedMotionSupport();
    this.setupAccessibilityMenu();
    this.addARIALabels();
    
    console.log('♿ Accessibility Helper initialized');
  }

  /**
   * Create screen reader announcer
   */
  createScreenReaderAnnouncer() {
    this.announcer = document.createElement('div');
    this.announcer.id = 'sr-announcer';
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.setAttribute('aria-atomic', 'true');
    this.announcer.style.cssText = `
      position: absolute !important;
      left: -10000px !important;
      width: 1px !important;
      height: 1px !important;
      overflow: hidden !important;
      clip: rect(1px, 1px, 1px, 1px) !important;
      clip-path: inset(50%) !important;
    `;
    
    document.body.appendChild(this.announcer);
  }

  /**
   * Create skip links for keyboard navigation
   */
  createSkipLinks() {
    const skipLinksContainer = document.createElement('nav');
    skipLinksContainer.className = 'skip-links';
    skipLinksContainer.setAttribute('aria-label', 'Skip navigation links');
    
    const skipLinks = [
      { href: '#main-content', text: 'Skip to main content' },
      { href: '#map', text: 'Skip to map' },
      { href: '#ui-controls', text: 'Skip to map controls' },
      { href: '#accessibility-menu', text: 'Skip to accessibility menu' }
    ];
    
    skipLinks.forEach(link => {
      const skipLink = document.createElement('a');
      skipLink.href = link.href;
      skipLink.textContent = link.text;
      skipLink.className = 'skip-link';
      skipLinksContainer.appendChild(skipLink);
      this.skipLinks.push(skipLink);
    });
    
    document.body.insertBefore(skipLinksContainer, document.body.firstChild);
  }

  /**
   * Setup comprehensive keyboard navigation
   */
  setupKeyboardNavigation() {
    document.addEventListener('keydown', (event) => {
      this.handleGlobalKeyboard(event);
    });
    
    // Focus trap for modals
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        this.handleTabTrapping(event);
      }
    });
    
    // Escape key handling
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.handleEscapeKey(event);
      }
    });
  }

  /**
   * Handle global keyboard shortcuts
   */
  handleGlobalKeyboard(event) {
    const { key, ctrlKey, altKey, shiftKey } = event;
    
    // Alt + M: Focus map
    if (altKey && key === 'm') {
      event.preventDefault();
      this.focusMap();
      this.announce('Map focused');
    }
    
    // Alt + C: Focus controls
    if (altKey && key === 'c') {
      event.preventDefault();
      this.focusControls();
      this.announce('Map controls focused');
    }
    
    // Alt + A: Open accessibility menu
    if (altKey && key === 'a') {
      event.preventDefault();
      this.toggleAccessibilityMenu();
    }
    
    // Alt + H: Show keyboard shortcuts help
    if (altKey && key === 'h') {
      event.preventDefault();
      this.showKeyboardHelp();
    }
    
    // Ctrl + Plus/Minus: Zoom in/out
    if (ctrlKey && (key === '+' || key === '=')) {
      event.preventDefault();
      this.zoomIn();
      this.announce('Map zoomed in');
    }
    
    if (ctrlKey && key === '-') {
      event.preventDefault();
      this.zoomOut();
      this.announce('Map zoomed out');
    }
    
    // Arrow keys: Pan map when focused
    if (document.activeElement?.id === 'map') {
      this.handleMapArrowKeys(event);
    }
  }

  /**
   * Handle map arrow key navigation
   */
  handleMapArrowKeys(event) {
    const { key } = event;
    const panDistance = 50; // pixels
    
    switch (key) {
      case 'ArrowUp':
        event.preventDefault();
        this.panMap(0, -panDistance);
        this.announce('Map panned up');
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.panMap(0, panDistance);
        this.announce('Map panned down');
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.panMap(-panDistance, 0);
        this.announce('Map panned left');
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.panMap(panDistance, 0);
        this.announce('Map panned right');
        break;
    }
  }

  /**
   * Setup focus management
   */
  setupFocusManagement() {
    // Track focus changes
    document.addEventListener('focusin', (event) => {
      this.lastFocusedElement = event.target;
      this.announceFocusChange(event.target);
    });
    
    // Ensure visible focus indicators
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    });
    
    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });
  }

  /**
   * Announce focus changes to screen readers
   */
  announceFocusChange(element) {
    if (!element) return;
    
    const label = this.getElementLabel(element);
    const role = element.getAttribute('role') || element.tagName.toLowerCase();
    
    if (label && role !== 'generic') {
      // Debounce announcements
      clearTimeout(this.focusAnnounceTimer);
      this.focusAnnounceTimer = setTimeout(() => {
        this.announce(`${label}, ${role}`, 'assertive');
      }, 100);
    }
  }

  /**
   * Get accessible label for element
   */
  getElementLabel(element) {
    return element.getAttribute('aria-label') ||
           element.getAttribute('aria-labelledby') ||
           element.getAttribute('title') ||
           element.textContent?.trim() ||
           element.getAttribute('alt') ||
           element.getAttribute('placeholder') ||
           '';
  }

  /**
   * Setup color blindness support
   */
  setupColorBlindnessSupport() {
    // Add color blindness simulation filters
    const style = document.createElement('style');
    style.textContent = `
      .deuteranopia-filter {
        filter: url(#deuteranopia);
      }
      .protanopia-filter {
        filter: url(#protanopia);
      }
      .tritanopia-filter {
        filter: url(#tritanopia);
      }
    `;
    document.head.appendChild(style);
    
    // Create SVG filters
    this.createColorBlindnessFilters();
  }

  /**
   * Create SVG filters for color blindness simulation
   */
  createColorBlindnessFilters() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.position = 'absolute';
    svg.style.width = '0';
    svg.style.height = '0';
    
    svg.innerHTML = `
      <defs>
        <filter id="deuteranopia">
          <feColorMatrix type="matrix" values="0.625 0.375 0   0 0
                                              0.7   0.3   0   0 0
                                              0     0.3   0.7 0 0
                                              0     0     0   1 0"/>
        </filter>
        <filter id="protanopia">
          <feColorMatrix type="matrix" values="0.567 0.433 0   0 0
                                              0.558 0.442 0   0 0
                                              0     0.242 0.758 0 0
                                              0     0     0   1 0"/>
        </filter>
        <filter id="tritanopia">
          <feColorMatrix type="matrix" values="0.95  0.05  0   0 0
                                              0     0.433 0.567 0 0
                                              0     0.475 0.525 0 0
                                              0     0     0   1 0"/>
        </filter>
      </defs>
    `;
    
    document.body.appendChild(svg);
  }

  /**
   * Setup screen reader support
   */
  setupScreenReaderSupport() {
    // Add live regions for dynamic content updates
    this.createLiveRegions();
    
    // Add descriptions for complex elements
    this.addComplexElementDescriptions();
    
    // Setup table headers and captions
    this.enhanceTablesAccessibility();
  }

  /**
   * Create live regions for dynamic announcements
   */
  createLiveRegions() {
    // Polite announcements (non-interrupting)
    const politeRegion = document.createElement('div');
    politeRegion.id = 'polite-announcements';
    politeRegion.setAttribute('aria-live', 'polite');
    politeRegion.setAttribute('aria-atomic', 'true');
    politeRegion.className = 'sr-only';
    
    // Assertive announcements (interrupting)
    const assertiveRegion = document.createElement('div');
    assertiveRegion.id = 'assertive-announcements';
    assertiveRegion.setAttribute('aria-live', 'assertive');
    assertiveRegion.setAttribute('aria-atomic', 'true');
    assertiveRegion.className = 'sr-only';
    
    document.body.appendChild(politeRegion);
    document.body.appendChild(assertiveRegion);
  }

  /**
   * Add descriptions for complex UI elements
   */
  addComplexElementDescriptions() {
    // Map description
    const mapElement = document.getElementById('map');
    if (mapElement) {
      mapElement.setAttribute('role', 'application');
      mapElement.setAttribute('aria-label', 'Interactive weather radar map');
      mapElement.setAttribute('aria-describedby', 'map-instructions');
      mapElement.setAttribute('tabindex', '0');
      
      // Add instructions
      const instructions = document.createElement('div');
      instructions.id = 'map-instructions';
      instructions.className = 'sr-only';
      instructions.textContent = 'Interactive map showing weather radar data. Use arrow keys to pan, plus and minus keys to zoom. Press Alt+C to access map controls.';
      mapElement.appendChild(instructions);
    }
  }

  /**
   * Setup accessibility menu
   */
  setupAccessibilityMenu() {
    const menu = document.createElement('div');
    menu.id = 'accessibility-menu';
    menu.className = 'accessibility-menu';
    menu.setAttribute('role', 'dialog');
    menu.setAttribute('aria-labelledby', 'accessibility-menu-title');
    menu.setAttribute('aria-hidden', 'true');
    
    menu.innerHTML = `
      <div class="accessibility-menu-content">
        <div class="accessibility-menu-header">
          <h2 id="accessibility-menu-title">Accessibility Settings</h2>
          <button class="close-accessibility-menu" aria-label="Close accessibility menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        
        <div class="accessibility-options">
          <fieldset>
            <legend>Visual Settings</legend>
            
            <label>
              <input type="checkbox" id="high-contrast-toggle">
              <span>High Contrast Mode</span>
            </label>
            
            <label>
              <input type="checkbox" id="large-text-toggle">
              <span>Large Text</span>
            </label>
            
            <label>
              <input type="checkbox" id="reduced-motion-toggle" ${this.reducedMotion ? 'checked' : ''}>
              <span>Reduce Motion</span>
            </label>
            
            <div class="color-blindness-options">
              <label>Color Blindness Simulation:</label>
              <select id="color-blindness-select">
                <option value="">None</option>
                <option value="deuteranopia">Deuteranopia (Green-blind)</option>
                <option value="protanopia">Protanopia (Red-blind)</option>
                <option value="tritanopia">Tritanopia (Blue-blind)</option>
              </select>
            </div>
          </fieldset>
          
          <fieldset>
            <legend>Navigation</legend>
            
            <label>
              <input type="checkbox" id="keyboard-shortcuts-toggle" checked>
              <span>Enable Keyboard Shortcuts</span>
            </label>
            
            <label>
              <input type="checkbox" id="focus-indicators-toggle" checked>
              <span>Enhanced Focus Indicators</span>
            </label>
            
            <button type="button" id="show-shortcuts-btn">Show Keyboard Shortcuts</button>
          </fieldset>
          
          <fieldset>
            <legend>Audio</legend>
            
            <label>
              <input type="checkbox" id="audio-cues-toggle">
              <span>Audio Cues</span>
            </label>
            
            <label>
              <input type="range" id="announcement-volume" min="0" max="100" value="70">
              <span>Announcement Volume</span>
            </label>
          </fieldset>
        </div>
        
        <div class="accessibility-menu-footer">
          <button type="button" id="reset-accessibility-btn">Reset to Defaults</button>
          <button type="button" id="save-accessibility-btn">Save Settings</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(menu);
    this.attachAccessibilityMenuListeners();
  }

  /**
   * Attach event listeners to accessibility menu
   */
  attachAccessibilityMenuListeners() {
    // Close menu
    const closeBtn = document.querySelector('.close-accessibility-menu');
    closeBtn?.addEventListener('click', () => this.toggleAccessibilityMenu());
    
    // High contrast toggle
    const highContrastToggle = document.getElementById('high-contrast-toggle');
    highContrastToggle?.addEventListener('change', (e) => {
      this.toggleHighContrast(e.target.checked);
    });
    
    // Large text toggle
    const largeTextToggle = document.getElementById('large-text-toggle');
    largeTextToggle?.addEventListener('change', (e) => {
      this.toggleLargeText(e.target.checked);
    });
    
    // Reduced motion toggle
    const reducedMotionToggle = document.getElementById('reduced-motion-toggle');
    reducedMotionToggle?.addEventListener('change', (e) => {
      this.toggleReducedMotion(e.target.checked);
    });
    
    // Color blindness select
    const colorBlindnessSelect = document.getElementById('color-blindness-select');
    colorBlindnessSelect?.addEventListener('change', (e) => {
      this.setColorBlindnessMode(e.target.value);
    });
    
    // Show shortcuts button
    const showShortcutsBtn = document.getElementById('show-shortcuts-btn');
    showShortcutsBtn?.addEventListener('click', () => {
      this.showKeyboardHelp();
    });
    
    // Reset button
    const resetBtn = document.getElementById('reset-accessibility-btn');
    resetBtn?.addEventListener('click', () => {
      this.resetAccessibilitySettings();
    });
    
    // Save button
    const saveBtn = document.getElementById('save-accessibility-btn');
    saveBtn?.addEventListener('click', () => {
      this.saveAccessibilitySettings();
    });
  }

  /**
   * Add ARIA labels and descriptions
   */
  addARIALabels() {
    // Add labels to common elements
    const buttons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
    buttons.forEach(button => {
      if (!button.getAttribute('aria-label')) {
        const text = button.textContent?.trim() || button.getAttribute('title') || 'Button';
        button.setAttribute('aria-label', text);
      }
    });
    
    // Add landmarks
    this.addLandmarks();
    
    // Add headings hierarchy
    this.enforceHeadingHierarchy();
  }

  /**
   * Add semantic landmarks
   */
  addLandmarks() {
    const main = document.querySelector('main') || document.body;
    if (!main.getAttribute('role')) {
      main.setAttribute('role', 'main');
    }
    
    // Add navigation landmark to controls
    const controls = document.querySelector('.ui-controls');
    if (controls) {
      controls.setAttribute('role', 'navigation');
      controls.setAttribute('aria-label', 'Map controls');
    }
  }

  /**
   * Show keyboard shortcuts help
   */
  showKeyboardHelp() {
    const helpDialog = document.createElement('div');
    helpDialog.className = 'keyboard-help-dialog';
    helpDialog.setAttribute('role', 'dialog');
    helpDialog.setAttribute('aria-labelledby', 'keyboard-help-title');
    helpDialog.setAttribute('aria-modal', 'true');
    
    helpDialog.innerHTML = `
      <div class="keyboard-help-content">
        <h2 id="keyboard-help-title">Keyboard Shortcuts</h2>
        
        <div class="shortcuts-grid">
          <div class="shortcut-category">
            <h3>Navigation</h3>
            <dl>
              <dt>Tab</dt><dd>Move to next element</dd>
              <dt>Shift + Tab</dt><dd>Move to previous element</dd>
              <dt>Enter/Space</dt><dd>Activate button or link</dd>
              <dt>Escape</dt><dd>Close dialog or menu</dd>
            </dl>
          </div>
          
          <div class="shortcut-category">
            <h3>Map Controls</h3>
            <dl>
              <dt>Alt + M</dt><dd>Focus map</dd>
              <dt>Arrow Keys</dt><dd>Pan map (when focused)</dd>
              <dt>Ctrl + Plus</dt><dd>Zoom in</dd>
              <dt>Ctrl + Minus</dt><dd>Zoom out</dd>
            </dl>
          </div>
          
          <div class="shortcut-category">
            <h3>Quick Access</h3>
            <dl>
              <dt>Alt + C</dt><dd>Focus controls</dd>
              <dt>Alt + A</dt><dd>Open accessibility menu</dd>
              <dt>Alt + H</dt><dd>Show this help</dd>
            </dl>
          </div>
        </div>
        
        <button class="close-help-dialog">Close</button>
      </div>
    `;
    
    document.body.appendChild(helpDialog);
    
    // Focus the dialog
    helpDialog.focus();
    
    // Add close functionality
    const closeBtn = helpDialog.querySelector('.close-help-dialog');
    closeBtn.addEventListener('click', () => {
      helpDialog.remove();
      this.restoreFocus();
    });
    
    // Close on escape
    helpDialog.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        helpDialog.remove();
        this.restoreFocus();
      }
    });
    
    this.announce('Keyboard shortcuts help opened');
  }

  // Accessibility Feature Methods

  toggleAccessibilityMenu() {
    const menu = document.getElementById('accessibility-menu');
    const isOpen = menu.getAttribute('aria-hidden') === 'false';
    
    if (isOpen) {
      menu.setAttribute('aria-hidden', 'true');
      menu.classList.remove('open');
      this.restoreFocus();
    } else {
      menu.setAttribute('aria-hidden', 'false');
      menu.classList.add('open');
      menu.focus();
      this.createFocusTrap(menu);
    }
  }

  toggleHighContrast(enabled) {
    document.body.classList.toggle('high-contrast', enabled);
    this.announce(`High contrast mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  toggleLargeText(enabled) {
    document.body.classList.toggle('large-text', enabled);
    this.announce(`Large text ${enabled ? 'enabled' : 'disabled'}`);
  }

  toggleReducedMotion(enabled) {
    this.reducedMotion = enabled;
    document.body.classList.toggle('reduced-motion', enabled);
    this.announce(`Reduced motion ${enabled ? 'enabled' : 'disabled'}`);
  }

  setColorBlindnessMode(mode) {
    // Remove existing filters
    document.body.classList.remove('deuteranopia-filter', 'protanopia-filter', 'tritanopia-filter');
    
    if (mode) {
      document.body.classList.add(`${mode}-filter`);
      this.announce(`Color blindness simulation: ${mode}`);
    } else {
      this.announce('Color blindness simulation disabled');
    }
    
    this.colorBlindnessMode = mode;
  }

  // Utility Methods

  announce(message, priority = 'polite') {
    if (!message) return;
    
    const regionId = priority === 'assertive' ? 'assertive-announcements' : 'polite-announcements';
    const region = document.getElementById(regionId) || this.announcer;
    
    // Clear previous announcement
    region.textContent = '';
    
    // Add new announcement after a brief delay
    setTimeout(() => {
      region.textContent = message;
    }, 50);
    
    // Log announcements for debugging
    this.announcements.push({
      message,
      priority,
      timestamp: Date.now()
    });
  }

  focusMap() {
    const mapElement = document.getElementById('map');
    if (mapElement) {
      mapElement.focus();
    }
  }

  focusControls() {
    const controlsElement = document.querySelector('.ui-controls button');
    if (controlsElement) {
      controlsElement.focus();
    }
  }

  zoomIn() {
    if (this.mapComponent && this.mapComponent.zoomIn) {
      this.mapComponent.zoomIn();
    }
  }

  zoomOut() {
    if (this.mapComponent && this.mapComponent.zoomOut) {
      this.mapComponent.zoomOut();
    }
  }

  panMap(x, y) {
    if (this.mapComponent && this.mapComponent.pan) {
      this.mapComponent.pan(x, y);
    }
  }

  createFocusTrap(element) {
    this.keyboardTrapStack.push(element);
  }

  removeFocusTrap() {
    this.keyboardTrapStack.pop();
  }

  restoreFocus() {
    if (this.lastFocusedElement) {
      this.lastFocusedElement.focus();
    }
  }

  handleTabTrapping(event) {
    if (this.keyboardTrapStack.length === 0) return;
    
    const currentTrap = this.keyboardTrapStack[this.keyboardTrapStack.length - 1];
    const focusableElements = currentTrap.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  handleEscapeKey(event) {
    // Close accessibility menu
    const accessibilityMenu = document.getElementById('accessibility-menu');
    if (accessibilityMenu && accessibilityMenu.getAttribute('aria-hidden') === 'false') {
      this.toggleAccessibilityMenu();
      return;
    }
    
    // Close keyboard help
    const keyboardHelp = document.querySelector('.keyboard-help-dialog');
    if (keyboardHelp) {
      keyboardHelp.remove();
      this.restoreFocus();
      return;
    }
    
    // Remove focus traps
    if (this.keyboardTrapStack.length > 0) {
      this.removeFocusTrap();
    }
  }

  saveAccessibilitySettings() {
    const settings = {
      highContrast: document.body.classList.contains('high-contrast'),
      largeText: document.body.classList.contains('large-text'),
      reducedMotion: this.reducedMotion,
      colorBlindnessMode: this.colorBlindnessMode
    };
    
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
    this.announce('Accessibility settings saved');
  }

  loadAccessibilitySettings() {
    try {
      const settings = JSON.parse(localStorage.getItem('accessibility-settings') || '{}');
      
      if (settings.highContrast) this.toggleHighContrast(true);
      if (settings.largeText) this.toggleLargeText(true);
      if (settings.reducedMotion) this.toggleReducedMotion(true);
      if (settings.colorBlindnessMode) this.setColorBlindnessMode(settings.colorBlindnessMode);
      
    } catch (error) {
      console.error('Failed to load accessibility settings:', error);
    }
  }

  resetAccessibilitySettings() {
    this.toggleHighContrast(false);
    this.toggleLargeText(false);
    this.toggleReducedMotion(false);
    this.setColorBlindnessMode('');
    
    // Reset form values
    const menu = document.getElementById('accessibility-menu');
    if (menu) {
      const form = menu.querySelector('.accessibility-options');
      if (form) {
        form.reset();
      }
    }
    
    localStorage.removeItem('accessibility-settings');
    this.announce('Accessibility settings reset to defaults');
  }

  /**
   * Destroy accessibility helper
   */
  destroy() {
    // Remove event listeners
    document.removeEventListener('keydown', this.handleGlobalKeyboard);
    
    // Remove accessibility menu
    const menu = document.getElementById('accessibility-menu');
    if (menu) {
      menu.remove();
    }
    
    // Remove announcer
    if (this.announcer) {
      this.announcer.remove();
    }
    
    // Remove skip links
    const skipLinks = document.querySelector('.skip-links');
    if (skipLinks) {
      skipLinks.remove();
    }
  }
}
