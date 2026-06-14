/**
 * NCE Validation Middleware
 * Nusantara Commodity Exchange (NCE)
 *
 * Provides request body validation helpers for all route handlers.
 */

/**
 * Validate that required fields are present in the request body.
 *
 * @param  {...string} fields - Required field names
 * @returns {import('express').RequestHandler}
 */
export const validateRequired = (...fields) => {
  return (req, res, next) => {
    const missing = fields.filter(field => {
      const value = req.body[field];
      return value === undefined || value === null || value === '';
    });

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(', ')}`,
        code: 'VALIDATION_MISSING_FIELDS',
        missing
      });
    }

    next();
  };
};

/**
 * Validate that specific fields are valid enum values.
 *
 * @param {object} fieldEnums - { fieldName: ['allowed', 'values'] }
 * @returns {import('express').RequestHandler}
 */
export const validateEnum = (fieldEnums) => {
  return (req, res, next) => {
    const errors = [];

    for (const [field, allowed] of Object.entries(fieldEnums)) {
      const value = req.body[field];
      if (value !== undefined && !allowed.includes(value)) {
        errors.push({
          field,
          message: `Invalid value for "${field}". Allowed: ${allowed.join(', ')}`
        });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        code: 'VALIDATION_INVALID_ENUM',
        errors
      });
    }

    next();
  };
};

/**
 * Validate that numeric fields are positive numbers.
 *
 * @param  {...string} fields - Numeric field names
 * @returns {import('express').RequestHandler}
 */
export const validateNumeric = (...fields) => {
  return (req, res, next) => {
    const errors = [];

    for (const field of fields) {
      const value = req.body[field];
      if (value !== undefined && value !== null) {
        const num = Number(value);
        if (isNaN(num) || num < 0) {
          errors.push({
            field,
            message: `"${field}" must be a positive number.`
          });
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        code: 'VALIDATION_INVALID_NUMBER',
        errors
      });
    }

    next();
  };
};

/**
 * Validate pagination query parameters and set defaults.
 *
 * @param {object} [defaults={}]
 * @param {number} [defaults.defaultPage=1]
 * @param {number} [defaults.defaultLimit=20]
 * @param {number} [defaults.maxLimit=100]
 * @returns {import('express').RequestHandler}
 */
export const validatePagination = (defaults = {}) => {
  const defaultPage = defaults.defaultPage || 1;
  const defaultLimit = defaults.defaultLimit || 20;
  const maxLimit = defaults.maxLimit || 100;

  return (req, res, next) => {
    req.query.page = Math.max(1, parseInt(req.query.page, 10) || defaultPage);
    req.query.limit = Math.min(maxLimit, Math.max(1, parseInt(req.query.limit, 10) || defaultLimit));

    if (req.query.sortOrder && !['asc', 'desc'].includes(req.query.sortOrder)) {
      req.query.sortOrder = 'desc';
    }

    next();
  };
};
