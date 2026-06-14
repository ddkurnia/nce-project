// ============================================================================
// NCE PWA Module - Registration & Management
// Nusantara Commodity Exchange
// Version: 1.0.0
//
// Provides:
//   - Service worker registration and update management
//   - Install prompt handling (beforeinstallprompt)
//   - Install status detection
//   - Custom install banner UI
//   - Lifecycle callbacks (onInstall, onUpdateAvailable)
//   - Auto-registration on DOMContentLoaded
// ============================================================================

const NCE_PWA = (() => {
  // --------------------------------------------------------------------------
  // Private state
  // --------------------------------------------------------------------------
  let _registration = null;
  let _deferredPrompt = null;
  let _installCallbacks = [];
  let _updateCallbacks = [];
  let _installStatus = 'not-installed'; // 'not-installed' | 'installable' | 'installed'
  let _swPath = '/sw.js';
  let _swScope = '/';

  // --------------------------------------------------------------------------
  // DOM references for the install banner
  // --------------------------------------------------------------------------
  let _bannerElement = null;

  // --------------------------------------------------------------------------
  // Service Worker Registration
  // --------------------------------------------------------------------------

  /**
   * Register the service worker.
   * @param {Object} options - Optional configuration
   * @param {string} options.swPath - Path to the service worker file (default: '/sw.js')
   * @param {string} options.scope - Service worker scope (default: '/')
   * @returns {Promise<ServiceWorkerRegistration|null>}
   */
  async function registerSW(options = {}) {
    _swPath = options.swPath || _swPath;
    _swScope = options.scope || _swScope;

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.warn('[NCE PWA] Service workers are not supported in this browser');
      return null;
    }

    try {
      console.log('[NCE PWA] Registering service worker at:', _swPath);

      _registration = await navigator.serviceWorker.register(_swPath, {
        scope: _swScope
      });

      console.log('[NCE PWA] Service worker registered successfully:', _registration.scope);

      // Listen for updates
      _listenForUpdates(_registration);

      // Check if there's already a waiting service worker
      if (_registration.waiting) {
        console.log('[NCE PWA] Service worker is waiting to activate');
        _notifyUpdateAvailable(_registration.waiting);
      }

      // Listen for controller change (new SW took control)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[NCE PWA] Controller changed — new service worker is active');
      });

      return _registration;
    } catch (error) {
      console.error('[NCE PWA] Service worker registration failed:', error);
      return null;
    }
  }

  // --------------------------------------------------------------------------
  // Update Detection
  // --------------------------------------------------------------------------

  /**
   * Listen for service worker updates on the given registration.
   * @param {ServiceWorkerRegistration} registration
   */
  function _listenForUpdates(registration) {
    // Fired when a new service worker is found
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;

      if (!newWorker) return;

      console.log('[NCE PWA] New service worker found, state:', newWorker.state);

      newWorker.addEventListener('statechange', () => {
        console.log('[NCE PWA] New service worker state:', newWorker.state);

        switch (newWorker.state) {
          case 'installed':
            if (navigator.serviceWorker.controller) {
              // New update available — there's already an active SW
              console.log('[NCE PWA] Update available');
              _notifyUpdateAvailable(newWorker);
            } else {
              // First install — no previous SW, content is cached for offline use
              console.log('[NCE PWA] Content is cached for offline use');
            }
            break;

          case 'activating':
            console.log('[NCE PWA] New service worker is activating');
            break;

          case 'activated':
            console.log('[NCE PWA] New service worker is activated');
            break;

          case 'redundant':
            console.log('[NCE PWA] New service worker became redundant');
            break;
        }
      });
    });
  }

  /**
   * Notify all registered update callbacks that an update is available.
   * @param {ServiceWorker} worker - The waiting/new service worker
   */
  function _notifyUpdateAvailable(worker) {
    _updateCallbacks.forEach((callback) => {
      try {
        callback({
          registration: _registration,
          worker: worker,
          applyUpdate: () => applyUpdate(worker)
        });
      } catch (error) {
        console.error('[NCE PWA] Update callback error:', error);
      }
    });
  }

  /**
   * Check for service worker updates manually.
   * @returns {Promise<ServiceWorkerRegistration|null>}
   */
  async function checkUpdate() {
    if (!_registration) {
      console.warn('[NCE PWA] No service worker registration found');
      return null;
    }

    try {
      console.log('[NCE PWA] Checking for service worker update...');
      await _registration.update();
      return _registration;
    } catch (error) {
      console.error('[NCE PWA] Update check failed:', error);
      return null;
    }
  }

  /**
   * Apply a waiting service worker update by sending SKIP_WAITING.
   * @param {ServiceWorker} worker - The waiting service worker
   */
  function applyUpdate(worker) {
    if (!worker) {
      // Try to get the waiting worker from registration
      worker = _registration?.waiting;
    }

    if (worker) {
      console.log('[NCE PWA] Sending SKIP_WAITING to new service worker');
      worker.postMessage({ type: 'SKIP_WAITING' });
    } else {
      console.warn('[NCE PWA] No waiting service worker to activate');
    }
  }

  // --------------------------------------------------------------------------
  // Install Prompt Handling
  // --------------------------------------------------------------------------

  /**
   * Capture the beforeinstallprompt event for deferred install.
   * This is called automatically during module initialization.
   */
  function _captureInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (event) => {
      console.log('[NCE PWA] beforeinstallprompt event fired');

      // Prevent the default mini-infobar from showing
      event.preventDefault();

      // Store the event so it can be triggered later
      _deferredPrompt = event;

      // Update install status
      _installStatus = 'installable';

      // Notify any waiting callbacks
      _installCallbacks.forEach((callback) => {
        try {
          callback({ status: 'installable', prompt: _deferredPrompt });
        } catch (error) {
          console.error('[NCE PWA] Install callback error:', error);
        }
      });
    });
  }

  /**
   * Listen for the appinstalled event.
   */
  function _listenForAppInstalled() {
    window.addEventListener('appinstalled', (event) => {
      console.log('[NCE PWA] App installed successfully');

      _installStatus = 'installed';
      _deferredPrompt = null;

      // Remove the install banner if visible
      _removeInstallBanner();

      // Notify callbacks
      _installCallbacks.forEach((callback) => {
        try {
          callback({ status: 'installed' });
        } catch (error) {
          console.error('[NCE PWA] Install callback error:', error);
        }
      });
    });
  }

  /**
   * Request install permission by showing the native install prompt.
   * @returns {Promise<Object>} Result of the prompt: { outcome: 'accepted'|'dismissed' }
   */
  async function requestInstallPermission() {
    if (!_deferredPrompt) {
      console.warn('[NCE PWA] No deferred install prompt available');
      return { outcome: 'unavailable' };
    }

    try {
      // Show the install prompt
      _deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const result = await _deferredPrompt.userChoice;

      console.log('[NCE PWA] Install prompt result:', result.outcome);

      // Clear the deferred prompt — it can only be used once
      _deferredPrompt = null;

      if (result.outcome === 'accepted') {
        _installStatus = 'installed';
        _removeInstallBanner();
      }

      return result;
    } catch (error) {
      console.error('[NCE PWA] Install prompt failed:', error);
      return { outcome: 'error', error: error };
    }
  }

  // --------------------------------------------------------------------------
  // Install Status
  // --------------------------------------------------------------------------

  /**
   * Check if the app is already installed (running in standalone mode).
   * @returns {boolean}
   */
  function isInstalled() {
    // Check if the app is running in standalone display mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    // Also check for iOS Safari's standalone mode
    const isIOSStandalone = window.navigator.standalone === true;

    return isStandalone || isIOSStandalone;
  }

  /**
   * Get the current install status.
   * @returns {string} 'not-installed' | 'installable' | 'installed'
   */
  function getInstallStatus() {
    if (isInstalled()) {
      return 'installed';
    }
    return _installStatus;
  }

  // --------------------------------------------------------------------------
  // Callback Registration
  // --------------------------------------------------------------------------

  /**
   * Register a callback to be called when the app is installed or installable.
   * @param {Function} callback - Called with { status: 'installable'|'installed', prompt? }
   */
  function onInstall(callback) {
    if (typeof callback === 'function') {
      _installCallbacks.push(callback);

      // If already installable or installed, call immediately
      const currentStatus = getInstallStatus();
      if (currentStatus === 'installable') {
        callback({ status: 'installable', prompt: _deferredPrompt });
      } else if (currentStatus === 'installed') {
        callback({ status: 'installed' });
      }
    }
  }

  /**
   * Register a callback to be called when a service worker update is available.
   * @param {Function} callback - Called with { registration, worker, applyUpdate }
   */
  function onUpdateAvailable(callback) {
    if (typeof callback === 'function') {
      _updateCallbacks.push(callback);

      // If there's already a waiting worker, call immediately
      if (_registration && _registration.waiting) {
        callback({
          registration: _registration,
          worker: _registration.waiting,
          applyUpdate: () => applyUpdate(_registration.waiting)
        });
      }
    }
  }

  // --------------------------------------------------------------------------
  // Custom Install Banner
  // --------------------------------------------------------------------------

  /**
   * Show a custom install banner at the bottom of the screen.
   * The banner uses the NCE dark fintech theme (Navy #0a0e27, Emerald #10b981, Cyan #06b6d4).
   */
  function showInstallBanner() {
    // Don't show if already installed or banner is already visible
    if (isInstalled() || _bannerElement) return;

    // Create the banner element
    _bannerElement = document.createElement('div');
    _bannerElement.id = 'nce-install-banner';
    _bannerElement.setAttribute('role', 'alert');
    _bannerElement.setAttribute('aria-label', 'Install NCE app');

    // Apply styles
    _bannerElement.style.cssText = [
      'position: fixed',
      'bottom: 0',
      'left: 0',
      'right: 0',
      'z-index: 9999',
      'background: #0a0e27',
      'border-top: 1px solid rgba(16, 185, 129, 0.3)',
      'padding: 12px 16px',
      'display: flex',
      'align-items: center',
      'justify-content: space-between',
      'gap: 12px',
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.5)',
      'animation: nceBannerSlideUp 0.3s ease-out',
      'backdrop-filter: blur(10px)',
      'max-width: 100vw'
    ].join('; ');

    // Left side: icon + text
    const infoContainer = document.createElement('div');
    infoContainer.style.cssText = 'display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;';

    // App icon
    const icon = document.createElement('img');
    icon.src = 'assets/images/icons/icon-72x72.png';
    icon.alt = 'NCE';
    icon.style.cssText = 'width: 40px; height: 40px; border-radius: 8px; flex-shrink: 0;';
    icon.onerror = function () {
      // Fallback: create a text-based icon
      const fallbackIcon = document.createElement('div');
      fallbackIcon.style.cssText = [
        'width: 40px',
        'height: 40px',
        'border-radius: 8px',
        'background: linear-gradient(135deg, #10b981, #06b6d4)',
        'display: flex',
        'align-items: center',
        'justify-content: center',
        'color: #0a0e27',
        'font-weight: 700',
        'font-size: 14px',
        'flex-shrink: 0'
      ].join('; ');
      fallbackIcon.textContent = 'NCE';
      icon.replaceWith(fallbackIcon);
    };

    // Text content
    const textContainer = document.createElement('div');
    textContainer.style.cssText = 'min-width: 0;';

    const title = document.createElement('div');
    title.textContent = 'Install NCE';
    title.style.cssText = 'color: #10b981; font-weight: 600; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';

    const subtitle = document.createElement('div');
    subtitle.textContent = 'Tambahkan ke home screen untuk akses cepat';
    subtitle.style.cssText = 'color: rgba(255, 255, 255, 0.6); font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';

    textContainer.appendChild(title);
    textContainer.appendChild(subtitle);

    infoContainer.appendChild(icon);
    infoContainer.appendChild(textContainer);

    // Right side: action buttons
    const actionsContainer = document.createElement('div');
    actionsContainer.style.cssText = 'display: flex; align-items: center; gap: 8px; flex-shrink: 0;';

    // Install button
    const installButton = document.createElement('button');
    installButton.textContent = 'Install';
    installButton.setAttribute('aria-label', 'Install NCE app');
    installButton.style.cssText = [
      'background: linear-gradient(135deg, #10b981, #06b6d4)',
      'color: #0a0e27',
      'border: none',
      'padding: 8px 16px',
      'border-radius: 8px',
      'font-weight: 600',
      'font-size: 13px',
      'cursor: pointer',
      'white-space: nowrap',
      'transition: opacity 0.2s, transform 0.1s'
    ].join('; ');
    installButton.addEventListener('mouseenter', () => {
      installButton.style.opacity = '0.9';
    });
    installButton.addEventListener('mouseleave', () => {
      installButton.style.opacity = '1';
    });
    installButton.addEventListener('click', async () => {
      installButton.textContent = '...';
      installButton.disabled = true;
      await requestInstallPermission();
    });

    // Dismiss button
    const dismissButton = document.createElement('button');
    dismissButton.textContent = '✕';
    dismissButton.setAttribute('aria-label', 'Dismiss install banner');
    dismissButton.style.cssText = [
      'background: transparent',
      'color: rgba(255, 255, 255, 0.4)',
      'border: 1px solid rgba(255, 255, 255, 0.1)',
      'width: 32px',
      'height: 32px',
      'border-radius: 6px',
      'font-size: 14px',
      'cursor: pointer',
      'display: ' + 'flex',
      'align-items: center',
      'justify-content: center',
      'transition: color 0.2s, border-color 0.2s'
    ].join('; ');
    dismissButton.addEventListener('mouseenter', () => {
      dismissButton.style.color = 'rgba(255, 255, 255, 0.8)';
      dismissButton.style.borderColor = 'rgba(255, 255, 255, 0.3)';
    });
    dismissButton.addEventListener('mouseleave', () => {
      dismissButton.style.color = 'rgba(255, 255, 255, 0.4)';
      dismissButton.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    });
    dismissButton.addEventListener('click', () => {
      _removeInstallBanner();
      // Store dismissal in sessionStorage so it doesn't reappear this session
      try {
        sessionStorage.setItem('nce-install-banner-dismissed', 'true');
      } catch (e) {
        // Ignore storage errors
      }
    });

    actionsContainer.appendChild(installButton);
    actionsContainer.appendChild(dismissButton);

    _bannerElement.appendChild(infoContainer);
    _bannerElement.appendChild(actionsContainer);

    // Inject the animation keyframes
    _injectBannerStyles();

    // Add to the DOM
    document.body.appendChild(_bannerElement);

    // Adjust body padding to prevent content from being hidden behind the banner
    document.body.style.paddingBottom = '72px';
  }

  /**
   * Remove the install banner from the DOM.
   */
  function _removeInstallBanner() {
    if (_bannerElement) {
      _bannerElement.style.animation = 'nceBannerSlideDown 0.2s ease-in forwards';

      setTimeout(() => {
        if (_bannerElement && _bannerElement.parentNode) {
          _bannerElement.parentNode.removeChild(_bannerElement);
        }
        _bannerElement = null;
        document.body.style.paddingBottom = '';
      }, 200);
    }
  }

  /**
   * Inject the CSS keyframes for the banner animation.
   */
  function _injectBannerStyles() {
    // Don't inject twice
    if (document.getElementById('nce-banner-styles')) return;

    const style = document.createElement('style');
    style.id = 'nce-banner-styles';
    style.textContent = [
      '@keyframes nceBannerSlideUp {',
      '  from { transform: translateY(100%); opacity: 0; }',
      '  to { transform: translateY(0); opacity: 1; }',
      '}',
      '',
      '@keyframes nceBannerSlideDown {',
      '  from { transform: translateY(0); opacity: 1; }',
      '  to { transform: translateY(100%); opacity: 0; }',
      '}',
      '',
      '@media (max-width: 480px) {',
      '  #nce-install-banner {',
      '    padding: 10px 12px;',
      '  }',
      '}',
      '',
      '@media (prefers-reduced-motion: reduce) {',
      '  #nce-install-banner {',
      '    animation: none !important;',
      '  }',
      '}'
    ].join('\n');

    document.head.appendChild(style);
  }

  // --------------------------------------------------------------------------
  // Initialization & Auto-Registration
  // --------------------------------------------------------------------------

  /**
   * Initialize the PWA module.
   * Sets up event listeners and auto-registers the service worker.
   */
  async function _init() {
    console.log('[NCE PWA] Initializing...');

    // Capture the beforeinstallprompt event early
    _captureInstallPrompt();

    // Listen for the appinstalled event
    _listenForAppInstalled();

    // Check if already installed
    if (isInstalled()) {
      _installStatus = 'installed';
      console.log('[NCE PWA] App is already installed (standalone mode)');
    }

    // Auto-register the service worker
    const registration = await registerSW();

    if (registration) {
      console.log('[NCE PWA] Service worker registered:', registration.scope);

      // Periodically check for updates (every 30 minutes)
      setInterval(() => {
        checkUpdate();
      }, 30 * 60 * 1000);
    }

    // Show install banner if appropriate
    // (deferred slightly so the page has time to load)
    if (!isInstalled()) {
      setTimeout(() => {
        // Don't show if the user dismissed it this session
        try {
          const dismissed = sessionStorage.getItem('nce-install-banner-dismissed');
          if (dismissed === 'true') return;
        } catch (e) {
          // Ignore storage errors
        }

        // Only show if the install prompt is available
        if (_deferredPrompt) {
          showInstallBanner();
        } else {
          // Set up a listener to show the banner when the prompt becomes available
          onInstall(({ status }) => {
            if (status === 'installable') {
              showInstallBanner();
            }
          });
        }
      }, 3000);
    }

    console.log('[NCE PWA] Initialization complete');
  }

  // Auto-initialize on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    // DOM already loaded (e.g., script loaded with defer or at end of body)
    _init();
  }

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------
  return {
    registerSW,
    checkUpdate,
    applyUpdate,
    requestInstallPermission,
    isInstalled,
    getInstallStatus,
    showInstallBanner,
    onInstall,
    onUpdateAvailable
  };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NCE_PWA;
}
