/**
 * NCE Mobile App Configuration
 * Handles platform detection, API routing, theming, safe areas, and push notification config
 */

export const MOBILE_CONFIG = {
  isNative: () => {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  },

  platform: () => {
    if (window.Capacitor && window.Capacitor.getPlatform) {
      return window.Capacitor.getPlatform();
    }
    if (/android/i.test(navigator.userAgent)) return 'android';
    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) return 'ios';
    return 'web';
  },

  apiBaseUrl: 'http://10.0.2.2:3001/api',
  webApiBaseUrl: 'http://localhost:3001/api',

  getApiUrl: () => {
    if (MOBILE_CONFIG.isNative()) {
      const platform = MOBILE_CONFIG.platform();
      if (platform === 'android') return MOBILE_CONFIG.apiBaseUrl;
      if (platform === 'ios') return MOBILE_CONFIG.apiBaseUrl;
    }
    return MOBILE_CONFIG.webApiBaseUrl;
  },

  whatsappNumber: '6281234567890',
  appVersion: '1.0.0',
  splashDuration: 3000,

  theme: {
    primary: '#10b981',
    accent: '#06b6d4',
    background: '#0a0e27',
    surface: '#111827',
    text: '#e2e8f0',
    textMuted: '#94a3b8'
  },

  safeArea: {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  },

  updateSafeArea: (insets) => {
    if (!insets) return;
    MOBILE_CONFIG.safeArea.top = insets.top || 0;
    MOBILE_CONFIG.safeArea.bottom = insets.bottom || 0;
    MOBILE_CONFIG.safeArea.left = insets.left || 0;
    MOBILE_CONFIG.safeArea.right = insets.right || 0;

    const root = document.documentElement;
    root.style.setProperty('--safe-area-top', `${MOBILE_CONFIG.safeArea.top}px`);
    root.style.setProperty('--safe-area-bottom', `${MOBILE_CONFIG.safeArea.bottom}px`);
    root.style.setProperty('--safe-area-left', `${MOBILE_CONFIG.safeArea.left}px`);
    root.style.setProperty('--safe-area-right', `${MOBILE_CONFIG.safeArea.right}px`);
  },

  pushNotification: {
    fcmToken: null,
    vapidKey: '',
    topics: ['commodities', 'buy-requests', 'price-alerts']
  },

  bottomNav: {
    items: [
      { id: 'home', label: 'Beranda', icon: 'home', href: 'index.html' },
      { id: 'commodities', label: 'Komoditas', icon: 'package', href: 'commodities.html' },
      { id: 'requests', label: 'Permintaan', icon: 'file-text', href: 'buy-requests.html' },
      { id: 'property', label: 'Properti', icon: 'building', href: 'property.html' },
      { id: 'profile', label: 'Profil', icon: 'user', href: 'profile.html' }
    ]
  }
};

export default MOBILE_CONFIG;
