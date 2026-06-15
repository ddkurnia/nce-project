/* ============================================================================
 * NCE — SPA Router (Hash-based)
 * ============================================================================ */

import Config from './config.js';
import State from './state.js';

const Router = {
  _routes: {},
  _currentView: null,
  _currentRoute: null,

  /**
   * Register a route with its view module
   */
  register(routeId, viewModule) {
    this._routes[routeId] = viewModule;
  },

  /**
   * Start listening for hash changes
   */
  start() {
    window.addEventListener('hashchange', () => this._onRouteChange());
    window.addEventListener('nce:navigate', (e) => {
      if (e.detail) {
        window.location.hash = `#/${e.detail}`;
      }
    });

    // Initial route
    this._onRouteChange();
  },

  /**
   * Handle route change
   */
  _onRouteChange() {
    const hash = window.location.hash.replace('#/', '') || Config.DEFAULT_ROUTE;
    const route = this._normalizeRoute(hash);

    if (route === this._currentRoute) return;

    this._navigate(route);
  },

  /**
   * Navigate to a route
   */
  _navigate(route) {
    // Cleanup current view
    if (this._currentView && this._currentView.destroy) {
      this._currentView.destroy();
    }

    // Find view module
    const view = this._routes[route];
    if (!view) {
      // Default to home
      this._navigate(Config.DEFAULT_ROUTE);
      return;
    }

    this._currentView = view;
    this._currentRoute = route;

    // Update state
    State.set('currentRoute', route);

    // Render view into content area
    const container = document.getElementById('view-container');
    if (container) {
      container.innerHTML = view.render();

      // Initialize view
      if (view.init) {
        view.init();
      }
    }

    // Update bottom nav
    this._updateNav(route);

    // Scroll to top
    const content = document.querySelector('.app-content');
    if (content) content.scrollTop = 0;
  },

  /**
   * Normalize route name
   */
  _normalizeRoute(hash) {
    const route = hash.split('/')[0].split('?')[0].toLowerCase();
    const validRoutes = Object.values(Config.ROUTES);

    if (validRoutes.includes(route)) return route;

    // Map aliases
    const aliases = {
      '': Config.DEFAULT_ROUTE,
      'order': Config.ROUTES.RFQ,
      'orders': Config.ROUTES.RFQ,
      'chat': Config.ROUTES.MESSAGES,
      'account': Config.ROUTES.PROFILE,
    };

    return aliases[route] || Config.DEFAULT_ROUTE;
  },

  /**
   * Update bottom nav active state
   */
  _updateNav(route) {
    const nav = document.querySelector('.bottom-nav');
    if (!nav) return;

    nav.querySelectorAll('.nav-item').forEach(btn => {
      const isActive = btn.dataset.route === route;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
  },

  /**
   * Get current route
   */
  getCurrentRoute() {
    return this._currentRoute;
  },

  /**
   * Force re-render current view
   */
  refresh() {
    if (this._currentRoute) {
      const prevRoute = this._currentRoute;
      this._currentRoute = null; // Reset so navigate proceeds
      this._navigate(prevRoute);
    }
  }
};

export default Router;
