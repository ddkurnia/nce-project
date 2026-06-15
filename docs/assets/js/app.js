/* ============================================================================
 * NCE — App Initialization
 * ============================================================================ */

import Config from './config.js';
import State from './state.js';
import Auth from './auth.js';
import Router from './router.js';
import Header from './components/header.js';
import BottomNav from './components/bottomNav.js';
import MarketPulse from './components/marketPulse.js';
import Modal from './components/modal.js';
import Toast from './components/toast.js';
import HomeView from './views/homeView.js';
import MarketView from './views/marketView.js';
import RfqView from './views/rfqView.js';
import MessagesView from './views/messagesView.js';
import ProfileView from './views/profileView.js';

const App = {
  /**
   * Initialize the entire application
   */
  init() {
    console.log(`[NCE] v${Config.APP_VERSION} initializing...`);

    // 1. Initialize auth from localStorage
    Auth.init();

    // 2. Render app shell
    this._renderShell();

    // 3. Initialize components
    Header.init();
    BottomNav.init();
    MarketPulse.init();
    Toast.init();

    // 4. Register routes
    Router.register(Config.ROUTES.HOME, HomeView);
    Router.register(Config.ROUTES.MARKET, MarketView);
    Router.register(Config.ROUTES.RFQ, RfqView);
    Router.register(Config.ROUTES.MESSAGES, MessagesView);
    Router.register(Config.ROUTES.PROFILE, ProfileView);

    // 5. Start router
    Router.start();

    // 6. Global event listeners
    this._bindGlobalEvents();

    console.log('[NCE] App ready');
  },

  /**
   * Render the app shell (header, ticker, content area, bottom nav)
   */
  _renderShell() {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
      ${Header.render()}
      ${MarketPulse.render()}
      <main class="app-content" id="view-container" role="main">
        <div class="loading-container">
          <div class="spinner"></div>
        </div>
      </main>
      ${BottomNav.render(Config.DEFAULT_ROUTE)}
    `;
  },

  /**
   * Bind global event listeners
   */
  _bindGlobalEvents() {
    // Show auth modal on demand
    window.addEventListener('nce:show-auth', (e) => {
      const mode = e.detail || 'login';
      const overlay = Modal.showAuth(mode);
      this._bindAuthForms(overlay);
    });

    // Handle navigation events from views
    window.addEventListener('nce:navigate', (e) => {
      if (e.detail) {
        window.location.hash = `#/${e.detail}`;
      }
    });

    // Handle online/offline
    window.addEventListener('online', () => {
      Toast.success('Back online');
    });

    window.addEventListener('offline', () => {
      Toast.warning('You are offline');
    });
  },

  /**
   * Bind login/register form submissions
   */
  _bindAuthForms(overlay) {
    if (!overlay) return;

    const loginForm = overlay.querySelector('#login-form');
    const registerForm = overlay.querySelector('#register-form');
    const errorEl = overlay.querySelector('#auth-error');

    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(loginForm);
        const data = Object.fromEntries(fd.entries());

        try {
          loginForm.querySelector('button[type="submit"]').disabled = true;
          await Auth.login(data.email, data.password);
          Toast.success('Welcome back!');
          Modal.close();
          Router.refresh();
        } catch (err) {
          if (errorEl) {
            errorEl.textContent = err.message || 'Login failed';
            errorEl.style.display = 'block';
          }
          loginForm.querySelector('button[type="submit"]').disabled = false;
        }
      });
    }

    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(registerForm);
        const data = Object.fromEntries(fd.entries());

        try {
          registerForm.querySelector('button[type="submit"]').disabled = true;
          await Auth.register(data);
          Toast.success('Account created!');
          Modal.close();
          Router.refresh();
        } catch (err) {
          if (errorEl) {
            errorEl.textContent = err.message || 'Registration failed';
            errorEl.style.display = 'block';
          }
          registerForm.querySelector('button[type="submit"]').disabled = false;
        }
      });
    }
  }
};

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  // DOM already loaded (module scripts are deferred)
  App.init();
}

export default App;
