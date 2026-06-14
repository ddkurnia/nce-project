/**
 * Role Authorization Middleware
 * Nusantara Commodity Exchange (NCE)
 *
 * Checks req.user.role against an allowed list of roles.
 * Must be used AFTER the authenticate middleware so that req.user exists.
 *
 * Usage:
 *   router.post('/', authenticate, authorize('seller', 'admin'), handler)
 *
 * @module middleware/roleMiddleware
 */

import logger from '../utils/logger.js';

/**
 * Returns an Express middleware that checks the authenticated user's role
 * against the list of allowed roles.
 *
 * @param {...string} roles - Roles that are permitted to access the route
 * @returns {Function} Express middleware
 */
export function authorize(...roles) {
  if (roles.length === 0) {
    throw new Error('[RoleMiddleware] At least one role must be specified for authorize()');
  }

  // Normalize all roles to lowercase for comparison
  const allowedRoles = roles.map((r) => r.toLowerCase());

  return (req, res, next) => {
    // Ensure the user has been authenticated first
    if (!req.user) {
      logger.warn('[RoleMiddleware] authorize called before authenticate – req.user is missing');
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 401,
      });
    }

    const userRole = (req.user.role || 'buyer').toLowerCase();

    if (!allowedRoles.includes(userRole)) {
      logger.warn(
        `[RoleMiddleware] Access denied for UID: ${req.user.uid} – role '${userRole}' not in [${allowedRoles.join(', ')}]`
      );

      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action',
        code: 403,
      });
    }

    logger.debug(`[RoleMiddleware] Access granted for UID: ${req.user.uid} – role '${userRole}'`);

    next();
  };
}
