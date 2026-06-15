/**
 * validator.js - Form Validation Utilities
 * Nusantara Commodity Exchange (NCE)
 *
 * Provides validation functions for emails, phone numbers, NPWP,
 * form fields, and XSS prevention. Each validator returns
 * { isValid: boolean, message: string }.
 */

// ---------------------------------------------------------------------------
// Email validation
// ---------------------------------------------------------------------------

/**
 * Validate an email address using a comprehensive regex.
 *
 * @param {string} email - Email address to validate.
 * @returns {{ isValid: boolean, message: string }} Validation result.
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { isValid: false, message: 'Email wajib diisi' };
  }

  const trimmed = email.trim();

  if (trimmed.length === 0) {
    return { isValid: false, message: 'Email wajib diisi' };
  }

  // RFC 5322 compliant-ish regex, practical for most use cases
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(trimmed)) {
    return { isValid: false, message: 'Format email tidak valid' };
  }

  return { isValid: true, message: '' };
}

// ---------------------------------------------------------------------------
// Phone validation
// ---------------------------------------------------------------------------

/**
 * Validate an Indonesian phone number.
 * Accepts formats: +628xxx, 628xxx, 08xxx, 8xxx
 * Mobile numbers start with 8 after country/area prefix.
 *
 * @param {string} phone - Phone number to validate.
 * @returns {{ isValid: boolean, message: string }} Validation result.
 */
export function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, message: 'Nomor telepon wajib diisi' };
  }

  const trimmed = phone.trim();

  if (trimmed.length === 0) {
    return { isValid: false, message: 'Nomor telepon wajib diisi' };
  }

  // Remove spaces, dashes, and parentheses for validation
  const cleaned = trimmed.replace(/[\s\-()]/g, '');

  // Indonesian phone: starts with +62, 62, or 0, followed by 8-13 digits
  const phoneRegex = /^(\+62|62|0)?8[1-9][0-9]{6,11}$/;

  if (!phoneRegex.test(cleaned)) {
    return { isValid: false, message: 'Format nomor telepon Indonesia tidak valid' };
  }

  return { isValid: true, message: '' };
}

// ---------------------------------------------------------------------------
// NPWP validation
// ---------------------------------------------------------------------------

/**
 * Validate an NPWP (Nomor Pokok Wajib Pajak) number.
 * NPWP consists of 15 digits, typically formatted as XX.XXX.XXX.X-XXX.XXX
 *
 * @param {string} npwp - NPWP number to validate.
 * @returns {{ isValid: boolean, message: string }} Validation result.
 */
export function validateNPWP(npwp) {
  if (!npwp || typeof npwp !== 'string') {
    return { isValid: false, message: 'NPWP wajib diisi' };
  }

  const trimmed = npwp.trim();

  if (trimmed.length === 0) {
    return { isValid: false, message: 'NPWP wajib diisi' };
  }

  // Remove formatting dots and dashes
  const cleaned = trimmed.replace(/[.\-]/g, '');

  // NPWP must be exactly 15 digits
  const npwpRegex = /^[0-9]{15}$/;

  if (!npwpRegex.test(cleaned)) {
    return { isValid: false, message: 'NPWP harus terdiri dari 15 digit angka' };
  }

  return { isValid: true, message: '' };
}

// ---------------------------------------------------------------------------
// Generic field validators
// ---------------------------------------------------------------------------

/**
 * Validate that a value is not empty.
 *
 * @param {*} value     - Value to check.
 * @param {string} fieldName - Display name for the field.
 * @returns {{ isValid: boolean, message: string }} Validation result.
 */
export function validateRequired(value, fieldName) {
  const name = fieldName || 'Field';

  if (value === null || value === undefined) {
    return { isValid: false, message: `${name} wajib diisi` };
  }

  if (typeof value === 'string' && value.trim().length === 0) {
    return { isValid: false, message: `${name} wajib diisi` };
  }

  if (Array.isArray(value) && value.length === 0) {
    return { isValid: false, message: `${name} wajib diisi` };
  }

  return { isValid: true, message: '' };
}

/**
 * Validate that a value meets a minimum length.
 *
 * @param {string} value     - Value to check.
 * @param {number} min       - Minimum length.
 * @param {string} fieldName - Display name for the field.
 * @returns {{ isValid: boolean, message: string }} Validation result.
 */
export function validateMinLength(value, min, fieldName) {
  const name = fieldName || 'Field';
  const minLength = Number(min);

  if (value === null || value === undefined || typeof value !== 'string') {
    return { isValid: false, message: `${name} minimal ${minLength} karakter` };
  }

  if (value.trim().length < minLength) {
    return { isValid: false, message: `${name} minimal ${minLength} karakter` };
  }

  return { isValid: true, message: '' };
}

/**
 * Validate that a value does not exceed a maximum length.
 *
 * @param {string} value     - Value to check.
 * @param {number} max       - Maximum length.
 * @param {string} fieldName - Display name for the field.
 * @returns {{ isValid: boolean, message: string }} Validation result.
 */
export function validateMaxLength(value, max, fieldName) {
  const name = fieldName || 'Field';
  const maxLength = Number(max);

  if (value === null || value === undefined) {
    return { isValid: true, message: '' };
  }

  const strValue = String(value);

  if (strValue.length > maxLength) {
    return { isValid: false, message: `${name} maksimal ${maxLength} karakter` };
  }

  return { isValid: true, message: '' };
}

/**
 * Validate that a value is a valid number.
 *
 * @param {*} value     - Value to check.
 * @param {string} fieldName - Display name for the field.
 * @returns {{ isValid: boolean, message: string }} Validation result.
 */
export function validateNumber(value, fieldName) {
  const name = fieldName || 'Field';

  if (value === null || value === undefined || value === '') {
    return { isValid: false, message: `${name} wajib diisi` };
  }

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return { isValid: false, message: `${name} harus berupa angka` };
  }

  return { isValid: true, message: '' };
}

/**
 * Validate that a number meets a minimum value.
 *
 * @param {*} value     - Value to check.
 * @param {number} min       - Minimum value.
 * @param {string} fieldName - Display name for the field.
 * @returns {{ isValid: boolean, message: string }} Validation result.
 */
export function validateMinValue(value, min, fieldName) {
  const name = fieldName || 'Field';

  const numberCheck = validateNumber(value, name);
  if (!numberCheck.isValid) return numberCheck;

  const numericValue = Number(value);
  const minValue = Number(min);

  if (numericValue < minValue) {
    return { isValid: false, message: `${name} minimal ${minValue}` };
  }

  return { isValid: true, message: '' };
}

/**
 * Validate that a number does not exceed a maximum value.
 *
 * @param {*} value     - Value to check.
 * @param {number} max       - Maximum value.
 * @param {string} fieldName - Display name for the field.
 * @returns {{ isValid: boolean, message: string }} Validation result.
 */
export function validateMaxValue(value, max, fieldName) {
  const name = fieldName || 'Field';

  const numberCheck = validateNumber(value, name);
  if (!numberCheck.isValid) return numberCheck;

  const numericValue = Number(value);
  const maxValue = Number(max);

  if (numericValue > maxValue) {
    return { isValid: false, message: `${name} maksimal ${maxValue}` };
  }

  return { isValid: true, message: '' };
}

// ---------------------------------------------------------------------------
// Domain-specific validators
// ---------------------------------------------------------------------------

/**
 * Validate that a price is a positive number.
 *
 * @param {*} price - Price value to validate.
 * @returns {{ isValid: boolean, message: string }} Validation result.
 */
export function validatePrice(price) {
  if (price === null || price === undefined || price === '') {
    return { isValid: false, message: 'Harga wajib diisi' };
  }

  const numericPrice = Number(price);

  if (Number.isNaN(numericPrice)) {
    return { isValid: false, message: 'Harga harus berupa angka' };
  }

  if (numericPrice <= 0) {
    return { isValid: false, message: 'Harga harus lebih dari 0' };
  }

  return { isValid: true, message: '' };
}

/**
 * Validate that a volume is a positive number.
 *
 * @param {*} volume - Volume/weight value to validate.
 * @returns {{ isValid: boolean, message: string }} Validation result.
 */
export function validateVolume(volume) {
  if (volume === null || volume === undefined || volume === '') {
    return { isValid: false, message: 'Volume wajib diisi' };
  }

  const numericVolume = Number(volume);

  if (Number.isNaN(numericVolume)) {
    return { isValid: false, message: 'Volume harus berupa angka' };
  }

  if (numericVolume <= 0) {
    return { isValid: false, message: 'Volume harus lebih dari 0' };
  }

  return { isValid: true, message: '' };
}

/**
 * Validate an uploaded image file.
 * Checks that the file type is an image and size does not exceed 5MB.
 *
 * @param {File} file - File object to validate.
 * @returns {{ isValid: boolean, message: string }} Validation result.
 */
export function validateImageFile(file) {
  if (!file) {
    return { isValid: false, message: 'File gambar wajib dipilih' };
  }

  const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
  const ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
  ];

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { isValid: false, message: 'Format file harus berupa gambar (JPG, PNG, GIF, WebP, BMP)' };
  }

  if (file.size > MAX_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return { isValid: false, message: `Ukuran file maksimal 5MB (file saat ini ${sizeMB}MB)` };
  }

  return { isValid: true, message: '' };
}

// ---------------------------------------------------------------------------
// Composite form validation
// ---------------------------------------------------------------------------

/**
 * Validate an entire form based on a rules definition.
 *
 * Rules format:
 * {
 *   email:    [validateEmail],
 *   password: [(v) => validateRequired(v, 'Password'), (v) => validateMinLength(v, 8, 'Password')],
 * }
 *
 * Returns:
 * { isValid: boolean, errors: { fieldName: errorMessage } }
 *
 * @param {Object} rules - Object mapping field names to arrays of validator functions.
 * @param {Object} data  - Object mapping field names to their values.
 * @returns {{ isValid: boolean, errors: Object<string, string> }} Form validation result.
 */
export function validateForm(rules, data = {}) {
  const errors = {};
  let isValid = true;

  for (const fieldName of Object.keys(rules)) {
    const fieldRules = rules[fieldName];
    const value = data[fieldName];

    for (const rule of fieldRules) {
      const result = rule(value);

      if (!result.isValid) {
        errors[fieldName] = result.message;
        isValid = false;
        break; // Stop at first error per field
      }
    }
  }

  return { isValid, errors };
}

// ---------------------------------------------------------------------------
// XSS Sanitization
// ---------------------------------------------------------------------------

/**
 * Sanitize user input to prevent XSS attacks.
 * Escapes HTML special characters and strips script tags.
 *
 * @param {string} input - Raw user input string.
 * @returns {string} Sanitized string.
 */
export function sanitizeInput(input) {
  if (input === null || input === undefined) return '';

  const str = String(input);

  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}
