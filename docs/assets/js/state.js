/* ============================================================================
 * NCE — Simple State Management
 * ============================================================================ */

class StateManager {
  constructor() {
    this._state = {};
    this._listeners = {};
  }

  /**
   * Get a state value
   */
  get(key) {
    return key ? this._state[key] : { ...this._state };
  }

  /**
   * Set a state value and notify listeners
   */
  set(key, value) {
    const old = this._state[key];
    this._state[key] = value;
    if (old !== value) {
      this._notify(key, value, old);
    }
  }

  /**
   * Update multiple state keys
   */
  update(obj) {
    for (const [key, value] of Object.entries(obj)) {
      this.set(key, value);
    }
  }

  /**
   * Subscribe to state changes
   */
  on(key, callback) {
    if (!this._listeners[key]) this._listeners[key] = [];
    this._listeners[key].push(callback);
    return () => this.off(key, callback);
  }

  /**
   * Unsubscribe from state changes
   */
  off(key, callback) {
    if (!this._listeners[key]) return;
    this._listeners[key] = this._listeners[key].filter(cb => cb !== callback);
  }

  /**
   * Notify listeners
   */
  _notify(key, value, old) {
    if (!this._listeners[key]) return;
    for (const cb of this._listeners[key]) {
      try { cb(value, old); } catch (e) { console.error(`State listener error [${key}]:`, e); }
    }
  }
}

// Global singleton
const State = new StateManager();

// Initialize defaults
State.update({
  currentRoute: 'home',
  user: null,
  isAuthenticated: false,
  commodities: [],
  requests: [],
  properties: [],
  loading: {},
  marketData: [],
  toasts: []
});

export default State;
