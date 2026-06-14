/**
 * Mobile App Initializer
 * Nusantara Commodity Exchange (NCE)
 *
 * Initializes Capacitor native features, bottom navigation,
 * mobile drawer, splash screen, and safe area support.
 *
 * @module modules/mobile/index
 */

import { MOBILE_CONFIG } from '../../config/mobile-config.js';
import { renderBottomNav, setActiveNavItem } from '../../components/bottomNav.js';
import { renderMobileDrawer } from '../../components/mobileDrawer.js';
import { hideSplashScreen, getSafeAreaInsets } from '../../services/deviceService.js';
import { registerPushNotifications, requestPermission } from '../../services/notificationService.js';

const PAGE_NAV_MAP = {
  'index.html': 'home',
  'commodities.html': 'commodities',
  'buy-requests.html': 'requests',
  'property.html': 'property',
  'profile.html': 'profile',
  'dashboard.html': 'home'
};

function getCurrentPageId() {
  const path = window.location.pathname;
  const filename = path.split('/').pop() || 'index.html';
  return PAGE_NAV_MAP[filename] || 'home';
}

async function setupSafeArea() {
  try {
    const insets = await getSafeAreaInsets();
    if (insets) {
      MOBILE_CONFIG.updateSafeArea(insets);
    }
  } catch (err) {
    console.debug('[NCE Mobile] Safe area not available:', err.message);
  }
}

function addNativeBodyClass() {
  if (MOBILE_CONFIG.isNative()) {
    document.body.classList.add('nce-native');
  }
}

function addBottomNavPadding() {
  if (!MOBILE_CONFIG.isNative()) return;
  const mainContent = document.querySelector('main') ||
    document.querySelector('.main-content') ||
    document.querySelector('body');
  if (mainContent) {
    mainContent.style.paddingBottom = 'calc(64px + var(--safe-area-bottom, 0px))';
  }
}

function setupPageTransition() {
  document.body.classList.add('nce-page-enter');
  setTimeout(() => {
    document.body.classList.remove('nce-page-enter');
  }, 300);
}

async function initMobile() {
  console.log('[NCE Mobile] Initializing...');

  addNativeBodyClass();
  setupSafeArea();
  setupPageTransition();

  if (MOBILE_CONFIG.isNative()) {
    console.log('[NCE Mobile] Running on', MOBILE_CONFIG.platform());

    const pageId = getCurrentPageId();
    renderBottomNav(pageId);
    addBottomNavPadding();
    renderMobileDrawer('#mobile-drawer-container');

    setTimeout(() => {
      hideSplashScreen();
    }, 1500);

    try {
      const permission = await requestPermission();
      if (permission === 'granted') {
        await registerPushNotifications();
        console.log('[NCE Mobile] Push notifications registered');
      }
    } catch (err) {
      console.warn('[NCE Mobile] Push notification setup skipped:', err.message);
    }

    try {
      const { App } = await import('@capacitor/app');
      App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back();
        } else {
          App.exitApp();
        }
      });
    } catch (err) {
      console.debug('[NCE Mobile] Back button listener skipped');
    }

  } else {
    console.log('[NCE Mobile] Running on web browser');
  }

  console.log('[NCE Mobile] Initialization complete');
}

document.addEventListener('DOMContentLoaded', initMobile);

export { initMobile, getCurrentPageId };
