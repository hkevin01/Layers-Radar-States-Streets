/**
 * PWA Helper Component
 * Manages Progressive Web App features including service worker registration,
 * install prompts, and offline functionality
 */

export class PWAHelper {
  constructor(options = {}) {
    this.deferredPrompt = null;
    this.isOnline = navigator.onLine;
    this.serviceWorkerRegistration = null;

    // Options
    this.options = Object.assign({ enableServiceWorker: true }, options);

    this.init();
  }

  /**
   * Initialize PWA features
   */
  async init() {
    try {
      // Register service worker
      await this.registerServiceWorker();

      // Set up install prompt handling
      this.setupInstallPrompt();

      // Set up online/offline handling
      this.setupOnlineOfflineHandling();

      // Set up background sync
      this.setupBackgroundSync();

      // Set up push notifications
      this.setupPushNotifications();

      console.log('✅ PWA Helper initialized successfully');
    } catch (error) {
      console.error('❌ PWA Helper initialization failed:', error);
    }
  }

  /**
   * Register the service worker
   */
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        // Allow disabling during automated tests or via URL flag
        const url = new URL(window.location.href);
        const e2eDisabled = url.searchParams.has('e2e') || window.__E2E_TEST__ || navigator.webdriver;
        if (e2eDisabled || this.options.enableServiceWorker === false) {
          console.warn('PWAHelper: Service Worker registration skipped (test mode or disabled).');
          return;
        }

        // Service worker served at web root for proper scope
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');

        console.log('✅ Service Worker registered successfully');

        // Listen for service worker updates
        this.serviceWorkerRegistration.addEventListener('updatefound', () => {
          const newWorker = this.serviceWorkerRegistration.installing;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showUpdateAvailableNotification();
            }
          });
        });

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          this.handleServiceWorkerMessage(event.data);
        });

      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
      }
    } else {
      console.warn('⚠️ Service Workers not supported in this browser');
    }
  }

  /**
   * Set up install prompt handling
   */
  setupInstallPrompt() {
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.deferredPrompt = event;
      this.showInstallButton();
    });

    // Listen for the appinstalled event
    window.addEventListener('appinstalled', () => {
      console.log('✅ PWA installed successfully');
      this.hideInstallButton();
      this.showInstalledMessage();
    });
  }

  /**
   * Set up online/offline handling
   */
  setupOnlineOfflineHandling() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.showOnlineMessage();
      this.syncWhenOnline();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.showOfflineMessage();
    });
  }

  /**
   * Set up background sync
   */
  setupBackgroundSync() {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      // Register for background sync when data needs updating
      this.registerBackgroundSync('radar-data-sync');
    }
  }

  /**
   * Set up push notifications
   */
  async setupPushNotifications() {
    if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
      const permission = await this.requestNotificationPermission();

      if (permission === 'granted') {
        await this.subscribeToPushNotifications();
      }
    }
  }

  /**
   * Show install button in UI
   */
  showInstallButton() {
    const installContainer = document.getElementById('pwa-install-container') || this.createInstallContainer();
    const installButton = installContainer.querySelector('.install-button');

    if (installButton) {
      installButton.style.display = 'block';
      installButton.addEventListener('click', () => this.installApp());
    }
  }

  /**
   * Hide install button
   */
  hideInstallButton() {
    const installButton = document.querySelector('.install-button');
    if (installButton) {
      installButton.style.display = 'none';
    }
  }

  /**
   * Install the PWA
   */
  async installApp() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();

      const choiceResult = await this.deferredPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        console.log('✅ User accepted the install prompt');
      } else {
        console.log('❌ User dismissed the install prompt');
      }

      this.deferredPrompt = null;
    }
  }

  /**
   * Create install container UI
   */
  createInstallContainer() {
    const container = document.createElement('div');
    container.id = 'pwa-install-container';
    container.innerHTML = `
      <div class="pwa-install-banner">
        <div class="install-content">
          <div class="install-icon">📱</div>
          <div class="install-text">
            <h3>Install Radar Map</h3>
            <p>Get quick access with our mobile app experience</p>
          </div>
          <button class="install-button" style="display: none;">
            <span>Install</span>
            <svg class="install-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
          </button>
          <button class="dismiss-install" onclick="this.closest('.pwa-install-banner').style.display='none'">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(container);
    return container;
  }

  /**
   * Show online message
   */
  showOnlineMessage() {
    this.showStatusMessage('🟢 Back online - Data syncing', 'success', 3000);
  }

  /**
   * Show offline message
   */
  showOfflineMessage() {
    this.showStatusMessage('🔴 Offline mode - Limited functionality', 'warning', 5000);
  }

  /**
   * Show installed message
   */
  showInstalledMessage() {
    this.showStatusMessage('✅ App installed successfully!', 'success', 4000);
  }

  /**
   * Show update available notification
   */
  showUpdateAvailableNotification() {
    const updateBanner = document.createElement('div');
    updateBanner.className = 'update-banner';
    updateBanner.innerHTML = `
      <div class="update-content">
        <span>🔄 New version available!</span>
        <button class="update-button" onclick="window.location.reload()">Update</button>
        <button class="dismiss-update" onclick="this.closest('.update-banner').remove()">Later</button>
      </div>
    `;

    document.body.appendChild(updateBanner);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (updateBanner.parentNode) {
        updateBanner.remove();
      }
    }, 10000);
  }

  /**
   * Show status message
   */
  showStatusMessage(message, type = 'info', duration = 4000) {
    const statusContainer = document.getElementById('pwa-status-container') || this.createStatusContainer();

    const statusMessage = document.createElement('div');
    statusMessage.className = `status-message ${type}`;
    statusMessage.textContent = message;

    statusContainer.appendChild(statusMessage);

    // Animate in
    setTimeout(() => statusMessage.classList.add('show'), 100);

    // Remove after duration
    setTimeout(() => {
      statusMessage.classList.remove('show');
      setTimeout(() => statusMessage.remove(), 300);
    }, duration);
  }

  /**
   * Create status container
   */
  createStatusContainer() {
    const container = document.createElement('div');
    container.id = 'pwa-status-container';
    document.body.appendChild(container);
    return container;
  }

  /**
   * Register background sync
   */
  async registerBackgroundSync(tag) {
    if (this.serviceWorkerRegistration && this.serviceWorkerRegistration.sync) {
      try {
        await this.serviceWorkerRegistration.sync.register(tag);
        console.log(`✅ Background sync registered: ${tag}`);
      } catch (error) {
        console.error(`❌ Background sync registration failed: ${tag}`, error);
      }
    }
  }

  /**
   * Sync when back online
   */
  async syncWhenOnline() {
    if (this.isOnline) {
      await this.registerBackgroundSync('radar-data-sync');
      await this.registerBackgroundSync('location-sync');
    }
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      console.log(`📢 Notification permission: ${permission}`);
      return permission;
    }
    return 'denied';
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPushNotifications() {
    if (this.serviceWorkerRegistration) {
      try {
        const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.getVapidPublicKey())
        });

        console.log('✅ Push notification subscription successful');

        // Send subscription to server
        await this.sendSubscriptionToServer(subscription);

      } catch (error) {
        console.error('❌ Push notification subscription failed:', error);
      }
    }
  }

  /**
   * Handle messages from service worker
   */
  handleServiceWorkerMessage(data) {
    switch (data.type) {
      case 'RADAR_DATA_UPDATED':
        this.showStatusMessage('🔄 Radar data updated', 'info', 3000);
        // Trigger map refresh if needed
        if (window.mapComponent && window.mapComponent.refresh) {
          window.mapComponent.refresh();
        }
        break;

      case 'CACHE_UPDATED':
        console.log('📦 Cache updated by service worker');
        break;

      default:
        console.log('📨 Service worker message:', data);
    }
  }

  /**
   * Send push subscription to server
   */
  async sendSubscriptionToServer(subscription) {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription)
      });

      if (response.ok) {
        console.log('✅ Push subscription sent to server');
      }
    } catch (error) {
      console.error('❌ Failed to send push subscription to server:', error);
    }
  }

  /**
   * Get VAPID public key (should be from your push service)
   */
  getVapidPublicKey() {
    // This should be your actual VAPID public key
    return 'BCd-GdXKp1q1n7E8L8xT8o6J5K3P2Q9R0S1T2U3V4W5X6Y7Z8A9B0C1D2E3F4G5H6I7J8K9L0M1N2O3P4Q5R6S7T8U9V0W1X2Y3Z4A5B6C7D8E9F0';
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Check if app is running in standalone mode
   */
  isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone ||
           document.referrer.includes('android-app://');
  }

  /**
   * Get connection info
   */
  getConnectionInfo() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };
    }
    return null;
  }

  /**
   * Destroy PWA helper
   */
  destroy() {
    // Remove event listeners
    window.removeEventListener('beforeinstallprompt', this.handleInstallPrompt);
    window.removeEventListener('appinstalled', this.handleAppInstalled);
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);

    // Remove UI elements
    const installContainer = document.getElementById('pwa-install-container');
    if (installContainer) {
      installContainer.remove();
    }

    const statusContainer = document.getElementById('pwa-status-container');
    if (statusContainer) {
      statusContainer.remove();
    }
  }
}
