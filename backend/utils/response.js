/**
 * Response Utility
 * Nusantara Commodity Exchange (NCE)
 *
 * Provides consistent response helpers for Express route handlers.
 * Every outgoing response follows a predictable structure so that
 * the frontend can reliably parse success, error, and paginated data.
 *
 * @module utils/response
 */

/**
 * Send a success response.
 *
 * @param {import('express').Response} res        - Express response object
 * @param {*}                          data       - Payload to return
 * @param {string}                     [message]  - Human-readable message
 * @param {number}                     [statusCode=200] - HTTP status code
 */
export function success(res, data, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

/**
 * Send an error response.
 *
 * @param {import('express').Response} res        - Express response object
 * @param {string}                     message    - Error description
 * @param {number}                     [statusCode=500] - HTTP status code
 * @param {*}                          [details]  - Optional extra error info (stack, metadata)
 */
export function error(res, message = 'Internal Server Error', statusCode = 500, details = undefined) {
  const payload = {
    success: false,
    message,
    code: statusCode,
  };

  if (details !== undefined) {
    payload.details = details;
  }

  return res.status(statusCode).json(payload);
}

/**
 * Send a paginated response.
 *
 * @param {import('express').Response} res       - Express response object
 * @param {Array}                      data      - Page of items
 * @param {object}                     pagination - Pagination metadata
 * @param {number}                     pagination.page      - Current page (1-based)
 * @param {number}                     pagination.limit     - Items per page
 * @param {number}                     pagination.total     - Total item count
 * @param {number}                     pagination.pages     - Total page count
 * @param {string}                     [message]  - Human-readable message
 */
export function paginated(res, data, pagination, message = 'Success') {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      pages: pagination.pages,
    },
  });
}

/**
 * Send a 201 Created response.
 *
 * @param {import('express').Response} res        - Express response object
 * @param {*}                          data       - Created resource
 * @param {string}                     [message]  - Human-readable message
 */
export function created(res, data, message = 'Resource created successfully') {
  return res.status(201).json({
    success: true,
    message,
    data,
  });
}

/**
 * Send a 204 No Content response (no body).
 *
 * @param {import('express').Response} res - Express response object
 */
export function noContent(res) {
  return res.status(204).send();
}
