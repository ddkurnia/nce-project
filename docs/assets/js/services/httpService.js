/**
 * NCE HTTP Service - Base fetch wrapper for all API calls
 * Nusantara Commodity Exchange (NCE)
 *
 * Provides:
 *  - Custom NCEApiError class for structured error handling
 *  - Centralized fetch wrapper with auth token injection
 *  - Request/response interceptors
 *  - Consistent error handling across all services
 */

// ---------------------------------------------------------------------------
// Custom Error Class
// ---------------------------------------------------------------------------

/**
 * NCEApiError – thrown for any non-2xx API response (or network failure).
 * Carries the HTTP status, a developer message, and the parsed body (if any).
 */
class NCEApiError extends Error {
  /**
   * @param {string}  message  – Human-readable error description
   * @param {number}  status   – HTTP status code (0 for network errors)
   * @param {object}  data     – Parsed response body (may be null)
   * @param {string}  code     – Optional machine-readable code from the backend
   */
  constructor(message, status = 0, data = null, code = '') {
    super(message);
    this.name = 'NCEApiError';
    this.status = status;
    this.data = data;
    this.code = code;
  }

  /**
   * Convenience check – true when the error originated from the backend
   * (i.e. we actually received an HTTP response).
   */
  get isApiError() {
    return this.status > 0;
  }

  /**
   * Convenience check for common HTTP status categories.
   */
  get isUnauthorized() {
    return this.status === 401;
  }

  get isForbidden() {
    return this.status === 403;
  }

  get isNotFound() {
    return this.status === 404;
  }

  get isValidation() {
    return this.status === 422 || this.status === 400;
  }

  get isServerError() {
    return this.status >= 500;
  }

  /**
   * Serialize for logging / debugging.
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      code: this.code,
      data: this.data
    };
  }
}

// ---------------------------------------------------------------------------
// Request / Response Interceptor Registries
// ---------------------------------------------------------------------------

/** @type {Array<(url: string, options: object) => {url: string, options: object}>} */
const requestInterceptors = [];

/** @type {Array<(response: object, request: object) => object>} */
const responseInterceptors = [];

/**
 * Register a request interceptor.
 * Interceptors receive the URL and fetch options **before** the request is
 * sent and must return an object `{ url, options }`.
 *
 * @param {(url: string, options: object) => {url: string, options: object}} fn
 */
function addRequestInterceptor(fn) {
  if (typeof fn === 'function') {
    requestInterceptors.push(fn);
  }
}

/**
 * Register a response interceptor.
 * Interceptors receive the parsed response body and the original request
 * descriptor `{ url, options }` and may transform or react to the response.
 *
 * @param {(response: object, request: object) => object} fn
 */
function addResponseInterceptor(fn) {
  if (typeof fn === 'function') {
    responseInterceptors.push(fn);
  }
}

// ---------------------------------------------------------------------------
// Default (no-op) interceptors
// ---------------------------------------------------------------------------

addRequestInterceptor((url, options) => ({ url, options }));
addResponseInterceptor((response) => response);

// ---------------------------------------------------------------------------
// Core Fetch Wrapper
// ---------------------------------------------------------------------------

/**
 * Get the current Firebase JWT token from localStorage.
 * This is set by authService after a successful login.
 *
 * @returns {string|null}
 */
function _getStoredToken() {
  try {
    const userData = localStorage.getItem('nce_user');
    if (userData) {
      const parsed = JSON.parse(userData);
      return parsed?.token || null;
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

/**
 * Build a plain object of headers, merging defaults with caller-supplied ones.
 *
 * @param {object}  [customHeaders={}]
 * @param {boolean} [auth=true]
 * @returns {object}
 */
function _buildHeaders(customHeaders = {}, auth = true) {
  const headers = {
    'Accept': 'application/json',
    ...customHeaders
  };

  // Only set Content-Type to JSON when there is no FormData body.
  // FormData must NOT have an explicit Content-Type so the browser can set
  // the correct multipart boundary.
  const hasFormData = customHeaders['Content-Type'] === 'multipart/form-data'
    || customHeaders['Content-Type'] === undefined; // will be set below unless body is FormData

  if (auth) {
    const token = _getStoredToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
}

/**
 * Centralized fetch wrapper used by **all** NCE services.
 *
 * Features:
 *  - Injects the `Authorization: Bearer <token>` header automatically
 *  - Runs registered request interceptors before sending
 *  - Runs registered response interceptors after parsing
 *  - Throws NCEApiError for non-2xx responses
 *  - Handles JSON parsing and FormData bodies
 *
 * @param {string}  path          – Relative API path (e.g. '/commodities')
 * @param {object}  [options={}]  – Fetch options
 * @param {string}  [options.method='GET']
 * @param {object|FormData} [options.body]
 * @param {object}  [options.headers={}]
 * @param {boolean} [options.auth=true]   – Whether to attach the auth header
 * @param {boolean} [options.rawResponse=false] – Return raw Response instead of parsed JSON
 * @returns {Promise<object|Response>}
 * @throws {NCEApiError}
 */
async function apiRequest(path, options = {}) {
  const {
    method = 'GET',
    body = null,
    headers: customHeaders = {},
    auth = true,
    rawResponse = false
  } = options;

  // Determine API base URL – falls back to localhost for development.
  const baseUrl = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:3001/api';
  let url = `${baseUrl}${path}`;

  // Decide whether to set Content-Type: application/json.
  // If the body is FormData, omit Content-Type so the browser sets the boundary.
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  let requestHeaders = { ...customHeaders };
  if (!isFormData && body && !requestHeaders['Content-Type']) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  // Merge in auth & default headers
  requestHeaders = _buildHeaders(requestHeaders, auth);

  // Build the fetch init object
  let fetchOptions = {
    method,
    headers: requestHeaders,
    body: isFormData ? body : (body ? JSON.stringify(body) : null)
  };

  // ---- Run request interceptors ----
  for (const interceptor of requestInterceptors) {
    try {
      const result = interceptor(url, fetchOptions);
      if (result && typeof result === 'object') {
        url = result.url ?? url;
        fetchOptions = result.options ?? fetchOptions;
      }
    } catch (err) {
      console.warn('[NCE httpService] Request interceptor error:', err);
    }
  }

  // ---- Perform the fetch ----
  let response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (networkError) {
    throw new NCEApiError(
      networkError.message || 'Network error – please check your connection.',
      0,
      null,
      'NETWORK_ERROR'
    );
  }

  // ---- Handle raw response mode ----
  if (rawResponse) {
    return response;
  }

  // ---- Parse the response body ----
  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    // Non-JSON response – try to read as text
    try {
      const text = await response.text();
      data = text ? { message: text } : null;
    } catch {
      data = null;
    }
  }

  // ---- Run response interceptors ----
  const requestDescriptor = { url, options: fetchOptions };
  for (const interceptor of responseInterceptors) {
    try {
      data = interceptor(data, requestDescriptor);
    } catch (err) {
      console.warn('[NCE httpService] Response interceptor error:', err);
    }
  }

  // ---- Handle non-2xx responses ----
  if (!response.ok) {
    const message = data?.message || data?.error || `Request failed with status ${response.status}`;
    const code = data?.code || '';

    // Auto-logout on 401 (token expired / invalid)
    if (response.status === 401) {
      _handleUnauthorized();
    }

    throw new NCEApiError(message, response.status, data, code);
  }

  return data;
}

// ---------------------------------------------------------------------------
// 401 Auto-Logout Handler
// ---------------------------------------------------------------------------

/**
 * Called automatically when a 401 response is received.
 * Clears local storage and redirects to login if necessary.
 */
function _handleUnauthorized() {
  // Clear stored user data
  localStorage.removeItem('nce_user');

  // Dispatch a custom event so the UI can react (show login modal, redirect, etc.)
  try {
    window.dispatchEvent(new CustomEvent('nce:unauthorized', {
      detail: { message: 'Session expired. Please sign in again.' }
    }));
  } catch {
    // Ignore in non-browser environments
  }
}

// ---------------------------------------------------------------------------
// Convenience HTTP method helpers
// ---------------------------------------------------------------------------

/**
 * Perform a GET request.
 *
 * @param {string} path      – Relative API path
 * @param {object} [params={}] – Query string parameters
 * @param {object} [options={}] – Additional apiRequest options
 * @returns {Promise<object>}
 */
async function get(path, params = {}, options = {}) {
  // Build query string
  const queryString = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

  const fullPath = queryString ? `${path}?${queryString}` : path;

  return apiRequest(fullPath, { method: 'GET', ...options });
}

/**
 * Perform a POST request.
 *
 * @param {string} path
 * @param {object|FormData} body
 * @param {object} [options={}]
 * @returns {Promise<object>}
 */
async function post(path, body, options = {}) {
  return apiRequest(path, { method: 'POST', body, ...options });
}

/**
 * Perform a PUT request.
 *
 * @param {string} path
 * @param {object|FormData} body
 * @param {object} [options={}]
 * @returns {Promise<object>}
 */
async function put(path, body, options = {}) {
  return apiRequest(path, { method: 'PUT', body, ...options });
}

/**
 * Perform a PATCH request.
 *
 * @param {string} path
 * @param {object} body
 * @param {object} [options={}]
 * @returns {Promise<object>}
 */
async function patch(path, body, options = {}) {
  return apiRequest(path, { method: 'PATCH', body, ...options });
}

/**
 * Perform a DELETE request.
 *
 * @param {string} path
 * @param {object} [options={}]
 * @returns {Promise<object>}
 */
async function del(path, options = {}) {
  return apiRequest(path, { method: 'DELETE', ...options });
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export {
  NCEApiError,
  apiRequest,
  addRequestInterceptor,
  addResponseInterceptor,
  get,
  post,
  put,
  patch,
  del
};

export default {
  NCEApiError,
  apiRequest,
  addRequestInterceptor,
  addResponseInterceptor,
  get,
  post,
  put,
  patch,
  del
};
