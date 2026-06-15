/* ============================================================================
 * NCE — HTTP API Service Wrapper
 * ============================================================================ */

import Config from './config.js';
import { escapeHtml } from './utils/helpers.js';

const Api = {
  /**
   * Get full API URL
   */
  _url(path) {
    return `${Config.API_BASE}${path}`;
  },

  /**
   * Get auth headers
   */
  _headers(extra = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...extra
    };

    const token = localStorage.getItem(Config.AUTH_TOKEN_KEY);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  },

  /**
   * Handle API response
   */
  async _handle(response) {
    const contentType = response.headers.get('content-type') || '';

    if (!response.ok) {
      let message = `Error ${response.status}`;
      try {
        if (contentType.includes('json')) {
          const err = await response.json();
          message = err.message || err.error || message;
        } else {
          message = await response.text() || message;
        }
      } catch { /* use default */ }
      throw new Error(message);
    }

    if (contentType.includes('json')) {
      return response.json();
    }
    return response.text();
  },

  /**
   * GET request
   */
  async get(path, params = {}) {
    const url = new URL(this._url(path), window.location.origin);
    for (const [k, v] of Object.entries(params)) {
      if (v != null && v !== '') url.searchParams.set(k, v);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this._headers(),
    });

    return this._handle(response);
  },

  /**
   * POST request
   */
  async post(path, data = {}) {
    const response = await fetch(this._url(path), {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify(data),
    });

    return this._handle(response);
  },

  /**
   * PUT request
   */
  async put(path, data = {}) {
    const response = await fetch(this._url(path), {
      method: 'PUT',
      headers: this._headers(),
      body: JSON.stringify(data),
    });

    return this._handle(response);
  },

  /**
   * PATCH request
   */
  async patch(path, data = {}) {
    const response = await fetch(this._url(path), {
      method: 'PATCH',
      headers: this._headers(),
      body: JSON.stringify(data),
    });

    return this._handle(response);
  },

  /**
   * DELETE request
   */
  async delete(path) {
    const response = await fetch(this._url(path), {
      method: 'DELETE',
      headers: this._headers(),
    });

    return this._handle(response);
  }
};

export default Api;
