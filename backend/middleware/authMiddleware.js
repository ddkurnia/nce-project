/**
 * Authentication Middleware
 * Nusantara Commodity Exchange (NCE)
 *
 * Extracts the Bearer token from the Authorization header, verifies it
 * with Firebase Admin Auth, and attaches the decoded user to req.user.
 *
 * @module middleware/authMiddleware
 */

import { auth } from '../config/firebase.js';
import logger from '../utils/logger.js';

/**
 * Express middleware that authenticates requests using Firebase ID tokens.
 *
 * Expected header format: Authorization: Bearer <Firebase ID Token>
 *
 * On success:
 *   - req.user is set to the decoded token (contains uid, email, etc.)
 *   - req.user.role is set from the custom claims if available
 *
 * On failure:
 *   - Returns 401 with an error response
 *
 * @param {import('express').Request}  req  - Express request
 * @param {import('express').Response} res  - Express response
 * @param {Function}                   next - Express next middleware
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header is missing',
        code: 401,
      });
    }

    // Expect format: "Bearer <token>"
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization header format. Expected: Bearer <token>',
        code: 401,
      });
    }

    const idToken = parts[1];

    if (!idToken || idToken.trim().length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Token is missing or empty',
        code: 401,
      });
    }

    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(idToken);

    // Attach the decoded user to the request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      role: decodedToken.role || 'buyer',
      verified: decodedToken.verified || false,
      ...decodedToken,
    };

    logger.debug(`[AuthMiddleware] User authenticated: ${decodedToken.uid} (role: ${req.user.role})`);

    next();
  } catch (error) {
    // Map common Firebase Auth errors to appropriate responses
    const errorCode = error.errorInfo?.code || error.code || '';

    if (
      errorCode === 'auth/id-token-expired' ||
      errorCode === 'auth/argument-error'
    ) {
      logger.warn(`[AuthMiddleware] Token expired or invalid: ${errorCode}`);
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please sign in again.',
        code: 401,
      });
    }

    if (errorCode === 'auth/id-token-revoked') {
      logger.warn(`[AuthMiddleware] Token revoked: ${errorCode}`);
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked. Please sign in again.',
        code: 401,
      });
    }

    if (
      errorCode === 'auth/invalid-id-token' ||
      errorCode === 'auth/project-not-found'
    ) {
      logger.warn(`[AuthMiddleware] Invalid token: ${errorCode}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
        code: 401,
      });
    }

    logger.error('[AuthMiddleware] Authentication error:', error);

    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Please sign in again.',
      code: 401,
    });
  }
}
