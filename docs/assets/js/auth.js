/* ============================================================================
 * NCE — Authentication Module
 * ============================================================================ */

import Api from './api.js';
import Config from './config.js';
import State from './state.js';

const Auth = {
  /**
   * Initialize auth state from localStorage
   */
  init() {
    try {
      const stored = localStorage.getItem(Config.AUTH_USER_KEY);
      if (stored) {
        const user = JSON.parse(stored);
        State.update({
          user,
          isAuthenticated: true
        });
      }
    } catch (e) {
      this.clear();
    }
  },

  /**
   * Get current user
   */
  getUser() {
    return State.get('user');
  },

  /**
   * Check if authenticated
   */
  isLoggedIn() {
    return State.get('isAuthenticated') === true;
  },

  /**
   * Login with email/password
   */
  async login(email, password) {
    const result = await Api.post('/auth/login', { email, password });

    if (result.user || result.data) {
      const user = result.user || result.data;
      const token = result.token || result.accessToken;

      if (token) {
        localStorage.setItem(Config.AUTH_TOKEN_KEY, token);
      }
      localStorage.setItem(Config.AUTH_USER_KEY, JSON.stringify(user));

      State.update({
        user,
        isAuthenticated: true
      });

      return user;
    }

    throw new Error('Invalid response from server');
  },

  /**
   * Register new account
   */
  async register(data) {
    const result = await Api.post('/auth/register', data);

    if (result.user || result.data) {
      const user = result.user || result.data;
      const token = result.token || result.accessToken;

      if (token) {
        localStorage.setItem(Config.AUTH_TOKEN_KEY, token);
      }
      localStorage.setItem(Config.AUTH_USER_KEY, JSON.stringify(user));

      State.update({
        user,
        isAuthenticated: true
      });

      return user;
    }

    throw new Error('Invalid response from server');
  },

  /**
   * Logout
   */
  async logout() {
    try {
      await Api.post('/auth/logout');
    } catch { /* ignore */ }

    this.clear();
  },

  /**
   * Clear auth state
   */
  clear() {
    localStorage.removeItem(Config.AUTH_USER_KEY);
    localStorage.removeItem(Config.AUTH_TOKEN_KEY);
    State.update({
      user: null,
      isAuthenticated: false
    });
  },

  /**
   * Require auth — returns true if logged in, shows login modal if not
   */
  requireAuth() {
    if (this.isLoggedIn()) return true;
    // Dispatch event for app to show login modal
    window.dispatchEvent(new CustomEvent('nce:show-auth'));
    return false;
  }
};

export default Auth;
