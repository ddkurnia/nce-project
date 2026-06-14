/**
 * helpers.js - General Helper Utilities
 * Nusantara Commodity Exchange (NCE)
 *
 * Provides debounce, throttle, storage helpers, DOM utilities,
 * color helpers, data manipulation, and pagination.
 */

// ---------------------------------------------------------------------------
// Function utilities
// ---------------------------------------------------------------------------

/**
 * Create a debounced version of a function that delays invocation
 * until after `delay` milliseconds have elapsed since the last call.
 *
 * @param {Function} fn    - Function to debounce.
 * @param {number}   delay - Delay in milliseconds (default 300).
 * @returns {Function} Debounced function with a .cancel() method.
 */
export function debounce(fn, delay = 300) {
  let timeoutId = null;

  const debounced = function (...args) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, delay);
  };

  debounced.cancel = function () {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

/**
 * Create a throttled version of a function that invokes at most once
 * every `limit` milliseconds.
 *
 * @param {Function} fn    - Function to throttle.
 * @param {number}   limit - Minimum interval in milliseconds (default 300).
 * @returns {Function} Throttled function.
 */
export function throttle(fn, limit = 300) {
  let lastCall = 0;
  let timeoutId = null;

  return function (...args) {
    const now = Date.now();
    const remaining = limit - (now - lastCall);

    if (remaining <= 0) {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCall = now;
      fn.apply(this, args);
    } else if (timeoutId === null) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        fn.apply(this, args);
      }, remaining);
    }
  };
}

/**
 * Deep clone an object using structured clone algorithm with
 * fallback to JSON serialization.
 *
 * @param {*} obj - Object to clone.
 * @returns {*} Deep-cloned copy.
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Use structuredClone if available (modern browsers)
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(obj);
    } catch (e) {
      // Fall through to JSON method for non-cloneable values
    }
  }

  // Fallback: JSON-based clone (does not handle functions, Dates become strings, etc.)
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (e) {
    // If JSON serialization fails, return a shallow copy
    if (Array.isArray(obj)) {
      return obj.map((item) => deepClone(item));
    }

    const cloned = {};
    for (const key of Object.keys(obj)) {
      cloned[key] = deepClone(obj[key]);
    }
    return cloned;
  }
}

/**
 * Generate a unique ID using timestamp and random characters.
 *
 * @returns {string} Unique ID string.
 */
export function generateId() {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  const extraRandom = Math.random().toString(36).substring(2, 6);

  return `${timestamp}-${randomPart}${extraRandom}`;
}

// ---------------------------------------------------------------------------
// URL / Query string utilities
// ---------------------------------------------------------------------------

/**
 * Build a query string from an object of parameters.
 * Skips null and undefined values.
 * Example: getQueryString({ page: 1, search: 'kopi' }) → "?page=1&search=kopi"
 *
 * @param {Object} params - Key-value pairs for query parameters.
 * @returns {string} Query string with leading '?' or empty string.
 */
export function getQueryString(params) {
  if (!params || typeof params !== 'object' || Array.isArray(params)) {
    return '';
  }

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, value);
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Parse query parameters from a URL string.
 * Example: parseQueryString('https://example.com?page=1&search=kopi')
 *          → { page: '1', search: 'kopi' }
 *
 * @param {string} url - Full URL or query string.
 * @returns {Object} Parsed key-value pairs (all values are strings).
 */
export function parseQueryString(url) {
  if (!url || typeof url !== 'string') {
    return {};
  }

  try {
    const queryString = url.includes('?') ? url.split('?')[1] : url;
    const searchParams = new URLSearchParams(queryString);
    const params = {};

    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }

    return params;
  } catch (e) {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Local Storage utilities
// ---------------------------------------------------------------------------

/**
 * Set a value in localStorage with JSON serialization.
 *
 * @param {string} key   - Storage key.
 * @param {*}      value - Value to store (will be JSON-stringified).
 */
export function setLocalStorage(key, value) {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
  } catch (e) {
    console.error(`Failed to set localStorage key "${key}":`, e);
  }
}

/**
 * Get a value from localStorage with JSON deserialization.
 *
 * @param {string} key          - Storage key.
 * @param {*}      defaultValue - Default value if key not found or parse fails.
 * @returns {*} Parsed value or defaultValue.
 */
export function getLocalStorage(key, defaultValue = null) {
  try {
    const serialized = localStorage.getItem(key);

    if (serialized === null) {
      return defaultValue;
    }

    return JSON.parse(serialized);
  } catch (e) {
    console.error(`Failed to get localStorage key "${key}":`, e);
    return defaultValue;
  }
}

/**
 * Remove an item from localStorage.
 *
 * @param {string} key - Storage key to remove.
 */
export function removeLocalStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.error(`Failed to remove localStorage key "${key}":`, e);
  }
}

// ---------------------------------------------------------------------------
// Clipboard & Download
// ---------------------------------------------------------------------------

/**
 * Copy text to the system clipboard.
 *
 * @param {string} text - Text to copy.
 * @returns {Promise<boolean>} Resolves to true if successful.
 */
export async function copyToClipboard(text) {
  if (!text || typeof text !== 'string') {
    return false;
  }

  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback for older browsers or non-HTTPS contexts
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const success = document.execCommand('copy');
    document.body.removeChild(textarea);

    return success;
  } catch (e) {
    console.error('Failed to copy to clipboard:', e);
    return false;
  }
}

/**
 * Trigger a file download in the browser.
 *
 * @param {string} data     - File content (string or data URL).
 * @param {string} filename - Name for the downloaded file.
 * @param {string} type     - MIME type (default 'text/csv').
 */
export function downloadFile(data, filename, type = 'text/csv') {
  try {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';

    document.body.appendChild(anchor);
    anchor.click();

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (e) {
    console.error('Failed to download file:', e);
  }
}

// ---------------------------------------------------------------------------
// DOM utilities
// ---------------------------------------------------------------------------

/**
 * Set up lazy loading for images using IntersectionObserver.
 * Images should have `data-src` attribute with the real URL and
 * optionally `data-srcset` for responsive images.
 *
 * @param {string} selector - CSS selector for images to lazy-load.
 * @returns {IntersectionObserver|null} The observer instance or null if unsupported.
 */
export function lazyLoadImage(selector = 'img[data-src]') {
  if (typeof IntersectionObserver === 'undefined') {
    // Fallback: load all images immediately
    const images = document.querySelectorAll(selector);
    images.forEach((img) => applyImageSource(img));
    return null;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          applyImageSource(img);
          observer.unobserve(img);
        }
      });
    },
    {
      rootMargin: '50px 0px',
      threshold: 0.01,
    }
  );

  const images = document.querySelectorAll(selector);
  images.forEach((img) => observer.observe(img));

  return observer;
}

/**
 * Smooth scroll to an element on the page.
 *
 * @param {string} selector - CSS selector of the target element.
 */
export function scrollToElement(selector) {
  if (!selector || typeof selector !== 'string') return;

  const element = document.querySelector(selector);
  if (!element) return;

  try {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest',
    });
  } catch (e) {
    // Fallback for browsers without smooth scroll support
    element.scrollIntoView(true);
  }
}

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

/**
 * Return a color class or hex based on price/value change direction.
 *
 * @param {number} change - Numeric change value.
 * @returns {string} Color value: emerald for positive, red for negative, gray for zero.
 */
export function getColorByChange(change) {
  const numericChange = Number(change);

  if (Number.isNaN(numericChange) || numericChange === 0) {
    return '#6b7280'; // gray-500
  }

  return numericChange > 0 ? '#10b981' : '#ef4444'; // emerald-500 / red-500
}

/**
 * Return a color based on a status string.
 *
 * @param {string} status - Status key.
 * @returns {string} Hex color code.
 */
export function getStatusColor(status) {
  const statusColorMap = {
    active: '#10b981',       // emerald-500
    verified: '#10b981',     // emerald-500
    completed: '#10b981',    // emerald-500
    pending: '#f59e0b',      // amber-500
    rejected: '#ef4444',     // red-500
    cancelled: '#ef4444',    // red-500
    inactive: '#6b7280',     // gray-500
    draft: '#8b5cf6',        // violet-500
    expired: '#6b7280',      // gray-500
  };

  if (!status || typeof status !== 'string') {
    return '#6b7280';
  }

  return statusColorMap[status.toLowerCase()] || '#6b7280';
}

// ---------------------------------------------------------------------------
// HTML generation helpers
// ---------------------------------------------------------------------------

/**
 * Create a breadcrumb HTML string from an array of items.
 *
 * @param {Array<{label: string, href?: string}>} items - Breadcrumb items.
 * @returns {string} HTML string for the breadcrumb.
 */
export function createBreadcrumb(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return '';
  }

  const listItems = items.map((item, index) => {
    const isLast = index === items.length - 1;

    if (isLast) {
      return `<li class="breadcrumb-item active" aria-current="page"><span>${escapeHtml(item.label)}</span></li>`;
    }

    const href = item.href || '#';
    return `<li class="breadcrumb-item"><a href="${escapeHtml(href)}">${escapeHtml(item.label)}</a></li>`;
  });

  return `<nav aria-label="Breadcrumb"><ol class="breadcrumb">${listItems.join('')}</ol></nav>`;
}

/**
 * Escape HTML special characters to prevent XSS.
 *
 * @param {string} str - Raw string to escape.
 * @returns {string} Escaped string safe for HTML insertion.
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';

  const string = String(str);

  const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  const regex = /[&<>"'/]/g;

  return string.replace(regex, (char) => escapeMap[char]);
}

// ---------------------------------------------------------------------------
// Data manipulation
// ---------------------------------------------------------------------------

/**
 * Group an array of objects by a given key.
 *
 * @param {Array<Object>} array - Array of objects to group.
 * @param {string}        key   - Property name to group by.
 * @returns {Object} Object with group values as keys and arrays as values.
 */
export function groupBy(array, key) {
  if (!Array.isArray(array)) {
    return {};
  }

  return array.reduce((groups, item) => {
    const groupValue = item && typeof item === 'object' ? item[key] : undefined;
    const groupKey = groupValue !== null && groupValue !== undefined ? String(groupValue) : 'undefined';

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }

    groups[groupKey].push(item);
    return groups;
  }, {});
}

/**
 * Sort an array of objects by a given key and order.
 *
 * @param {Array<Object>} array - Array of objects to sort.
 * @param {string}        key   - Property name to sort by.
 * @param {string}        order - Sort order: 'asc' or 'desc' (default 'asc').
 * @returns {Array<Object>} New sorted array (does not mutate original).
 */
export function sortBy(array, key, order = 'asc') {
  if (!Array.isArray(array)) {
    return [];
  }

  const sortOrder = order === 'desc' ? -1 : 1;

  return [...array].sort((a, b) => {
    const valueA = a && typeof a === 'object' ? a[key] : undefined;
    const valueB = b && typeof b === 'object' ? b[key] : undefined;

    // Handle null / undefined — push to the end
    if (valueA === null || valueA === undefined) return 1;
    if (valueB === null || valueB === undefined) return -1;

    // String comparison
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      const comparison = valueA.localeCompare(valueB, 'id-ID', { sensitivity: 'base' });
      return comparison * sortOrder;
    }

    // Numeric comparison
    const numA = Number(valueA);
    const numB = Number(valueB);

    if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
      if (numA < numB) return -1 * sortOrder;
      if (numA > numB) return 1 * sortOrder;
      return 0;
    }

    // Mixed types — fall back to string compare
    const strA = String(valueA);
    const strB = String(valueB);
    const comparison = strA.localeCompare(strB, 'id-ID', { sensitivity: 'base' });
    return comparison * sortOrder;
  });
}

/**
 * Paginate an array of items.
 *
 * @param {Array} array   - Array to paginate.
 * @param {number} page   - Current page number (1-based, default 1).
 * @param {number} perPage - Items per page (default 10).
 * @returns {{ data: Array, total: number, pages: number, currentPage: number }}
 */
export function paginate(array, page = 1, perPage = 10) {
  if (!Array.isArray(array)) {
    return { data: [], total: 0, pages: 0, currentPage: 1 };
  }

  const total = array.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const currentPage = Math.min(Math.max(1, Number(page) || 1), pages);
  const startIndex = (currentPage - 1) * perPage;
  const data = array.slice(startIndex, startIndex + perPage);

  return {
    data,
    total,
    pages,
    currentPage,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Apply the data-src to an image element and remove lazy-load attributes.
 *
 * @param {HTMLImageElement} img - Image element with data-src.
 */
function applyImageSource(img) {
  if (!img || !img.dataset) return;

  if (img.dataset.src) {
    img.src = img.dataset.src;
    delete img.dataset.src;
  }

  if (img.dataset.srcset) {
    img.srcset = img.dataset.srcset;
    delete img.dataset.srcset;
  }

  if (img.classList) {
    img.classList.add('lazy-loaded');
  }
}
