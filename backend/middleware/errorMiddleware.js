/**
 * Global Error Handler Middleware
 * Nusantara Commodity Exchange (NCE)
 *
 * Centralized error handler that catches all errors thrown in route handlers
 * and middleware. Provides consistent error responses and proper logging.
 *
 * - Handles Firestore errors
 * - Handles validation errors
 * - Handles authentication errors
 * - Handles Cloudinary errors
 * - Handles Multer errors (file too large)
 * - Logs errors in development
 * - Does not leak error details in production
 *
 * @module middleware/errorMiddleware
 */

import logger from '../utils/logger.js';

const isDevelopment = process.env.NODE_ENV !== 'production';

// ---------------------------------------------------------------------------
// Error Classification Helpers
// ---------------------------------------------------------------------------

/**
 * Classify a Firestore error code into a human-readable message and HTTP status.
 *
 * @param {string} code - Firestore error code
 * @returns {{ message: string, statusCode: number }}
 */
function classifyFirestoreError(code) {
  const map = {
    'NOT_FOUND': { message: 'The requested resource was not found', statusCode: 404 },
    'PERMISSION_DENIED': { message: 'You do not have permission to access this resource', statusCode: 403 },
    'ALREADY_EXISTS': { message: 'The resource already exists', statusCode: 409 },
    'RESOURCE_EXHAUSTED': { message: 'Resource quota exceeded. Please try again later', statusCode: 429 },
    'INVALID_ARGUMENT': { message: 'Invalid data provided', statusCode: 400 },
    'UNAUTHENTICATED': { message: 'Authentication required', statusCode: 401 },
    'UNAVAILABLE': { message: 'Service temporarily unavailable. Please try again later', statusCode: 503 },
    'ABORTED': { message: 'Operation was aborted due to a conflict', statusCode: 409 },
    'INTERNAL': { message: 'An internal error occurred', statusCode: 500 },
    'DEADLINE_EXCEEDED': { message: 'Request timed out', statusCode: 504 },
    'UNIMPLEMENTED': { message: 'This operation is not supported', statusCode: 501 },
    'DATA_LOSS': { message: 'Unrecoverable data loss or corruption', statusCode: 500 },
  };

  return map[code] || { message: 'A database error occurred', statusCode: 500 };
}

/**
 * Classify a Cloudinary error.
 *
 * @param {object} error - Cloudinary error object
 * @returns {{ message: string, statusCode: number }}
 */
function classifyCloudinaryError(error) {
  const message = error.message || '';
  const httpCode = error.http_code || 500;

  if (message.includes('Invalid') || message.includes('invalid')) {
    return { message: 'Invalid image upload parameters', statusCode: 400 };
  }

  if (message.includes('File size') || message.includes('too large')) {
    return { message: 'Uploaded file is too large', statusCode: 413 };
  }

  if (httpCode >= 400 && httpCode < 500) {
    return { message: 'Image upload failed', statusCode: httpCode };
  }

  return { message: 'Image upload service error', statusCode: 502 };
}

/**
 * Classify a Multer error.
 *
 * @param {string} code - Multer error code
 * @returns {{ message: string, statusCode: number }}
 */
function classifyMulterError(code) {
  const map = {
    'LIMIT_FILE_SIZE': { message: 'File size exceeds the maximum allowed limit', statusCode: 413 },
    'LIMIT_FILE_COUNT': { message: 'Too many files uploaded', statusCode: 400 },
    'LIMIT_FIELD_KEY': { message: 'Field name too long', statusCode: 400 },
    'LIMIT_FIELD_VALUE': { message: 'Field value too long', statusCode: 400 },
    'LIMIT_FIELD_COUNT': { message: 'Too many form fields', statusCode: 400 },
    'LIMIT_PART_COUNT': { message: 'Too many parts in the form', statusCode: 400 },
    'LIMIT_UNEXPECTED_FILE': { message: 'Unexpected file field', statusCode: 400 },
  };

  return map[code] || { message: 'File upload error', statusCode: 400 };
}

// ---------------------------------------------------------------------------
// Main Error Handler
// ---------------------------------------------------------------------------

/**
 * Global Express error handling middleware.
 * Must be registered as the last middleware in the stack.
 *
 * @param {Error}                      err  - The error object
 * @param {import('express').Request}  req  - Express request
 * @param {import('express').Response} res  - Express response
 * @param {Function}                   next - Express next middleware
 */
export function errorHandler(err, req, res, next) {
  // If headers have already been sent, delegate to the default Express handler
  if (res.headersSent) {
    return next(err);
  }

  let message = 'Internal Server Error';
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let details = undefined;

  // ----- Firestore Errors -----
  if (err.code && typeof err.code === 'string' && err.code.length > 3) {
    // Firestore error codes look like 'NOT_FOUND', 'PERMISSION_DENIED', etc.
    const classified = classifyFirestoreError(err.code);
    message = classified.message;
    statusCode = classified.statusCode;
    code = err.code;
  }

  // ----- Validation Errors (custom) -----
  else if (err.name === 'ValidationError' || err.message?.includes('validation')) {
    message = err.message || 'Validation failed';
    statusCode = 400;
    code = 'VALIDATION_ERROR';

    if (err.errors && typeof err.errors === 'object') {
      details = err.errors;
    }
  }

  // ----- Authentication Errors -----
  else if (err.name === 'UnauthorizedError' || err.code === 'UNAUTHENTICATED') {
    message = err.message || 'Authentication required';
    statusCode = 401;
    code = 'UNAUTHORIZED';
  }

  // ----- Multer Errors -----
  else if (err.name === 'MulterError') {
    const classified = classifyMulterError(err.code);
    message = classified.message;
    statusCode = classified.statusCode;
    code = err.code || 'MULTER_ERROR';
  }

  // ----- Cloudinary Errors -----
  else if (
    err.message?.includes('Cloudinary') ||
    err.http_code !== undefined ||
    err.name === 'CloudinaryError'
  ) {
    const classified = classifyCloudinaryError(err);
    message = classified.message;
    statusCode = classified.statusCode;
    code = 'CLOUDINARY_ERROR';
  }

  // ----- JSON Parse Errors -----
  else if (err.type === 'entity.parse.failed') {
    message = 'Invalid JSON in request body';
    statusCode = 400;
    code = 'INVALID_JSON';
  }

  // ----- Generic Error Fallback -----
  else {
    // Use the error's own message if it's a 4xx-class error we threw ourselves
    if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
      statusCode = err.statusCode;
      message = err.message || 'Bad Request';
    } else if (err.status && err.status >= 400 && err.status < 500) {
      statusCode = err.status;
      message = err.message || 'Bad Request';
    } else {
      message = err.message || 'Internal Server Error';
      statusCode = err.statusCode || err.status || 500;
    }

    code = err.code || 'INTERNAL_ERROR';
  }

  // ----- Logging -----
  if (statusCode >= 500) {
    logger.error(
      `[ErrorMiddleware] ${statusCode} ${code}: ${message}`,
      isDevelopment ? err.stack : ''
    );
  } else if (statusCode >= 400) {
    logger.warn(`[ErrorMiddleware] ${statusCode} ${code}: ${message}`);
  }

  // ----- Response -----
  const responsePayload = {
    success: false,
    message,
    code: statusCode,
  };

  // Include error code string for frontend handling
  if (code && code !== 'INTERNAL_ERROR') {
    responsePayload.errorCode = code;
  }

  // Include validation details if present
  if (details) {
    responsePayload.details = details;
  }

  // In development mode, include the stack trace for debugging
  if (isDevelopment && statusCode >= 500 && err.stack) {
    responsePayload.stack = err.stack;
  }

  return res.status(statusCode).json(responsePayload);
}
