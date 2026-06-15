import { setState, getState } from './state.js';
import { updateActiveNav } from './components/bottomNav.js';

const routes = {};
let currentView = null;
let currentCleanup = null;

export function registerRoute(path, viewModule) {
  routes[path] = viewModule;
}

export function navigate(hash) {
  const fullPath = hash.replace('#', '') || '/';

  // Find matching route
  const match = matchRoute(fullPath);
  if (!match) {
    console.warn('Route not found:', fullPath);
    return;
  }

  const { route, params } = match;
  const viewModule = routes[route];

  if (!viewModule) {
    console.warn('View module not found for route:', route);
    return;
  }

  // Unmount current view
  if (currentView && currentView.unmount) {
    currentView.unmount();
  }

  // Update state
  setState('currentRoute', fullPath);
  updateActiveNav(route);

  // Mount new view
  const appContainer = document.getElementById('app');
  if (appContainer) {
    // Store params for view access
    window.__routeParams = params;

    currentView = viewModule;
    viewModule.mount(appContainer);
  }
}

function matchRoute(fullPath) {
  const parts = fullPath.split('/').filter(Boolean);

  // Try exact match first
  const exactPath = '/' + parts.join('/');
  if (routes[exactPath]) {
    return { route: exactPath, params: {} };
  }

  // Try root
  if (parts.length === 0 && routes['/']) {
    return { route: '/', params: {} };
  }

  // Try param routes (e.g., /market/:id)
  for (const routePath of Object.keys(routes)) {
    const routeParts = routePath.split('/').filter(Boolean);
    if (routeParts.length !== parts.length) continue;

    let match = true;
    const params = {};

    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(':')) {
        params[routeParts[i].slice(1)] = parts[i];
      } else if (routeParts[i] !== parts[i]) {
        match = false;
        break;
      }
    }

    if (match) {
      return { route: routePath, params };
    }
  }

  // Fallback to home
  if (routes['/']) {
    return { route: '/', params: {} };
  }

  return null;
}

export function getRouteParams() {
  return window.__routeParams || {};
}

export function initRouter() {
  // Listen to hash changes
  window.addEventListener('hashchange', () => {
    navigate(window.location.hash);
  });

  // Initial navigation
  navigate(window.location.hash || '#/');
}
