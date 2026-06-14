/**
 * NCE Auth Controller
 * Nusantara Commodity Exchange (NCE)
 *
 * Handles authentication flows:
 *  - Register: Create Firebase user + Firestore document
 *  - Login: Verify Firebase ID token, return user profile
 *  - Refresh: Generate new token
 *  - Logout: Invalidate session
 */

import * as authService from '../services/authService.js';
import { auth } from '../config/firebase.js';

/**
 * Register a new user.
 * Creates a Firebase Auth user and a corresponding Firestore user document.
 *
 * @route POST /api/auth/register
 * @body {string} email
 * @body {string} password
 * @body {string} [uid] - Firebase UID if user was created client-side
 * @body {string} [idToken] - Firebase ID token from client-side signup
 * @body {string} [displayName]
 * @body {string} [phone]
 * @body {string} [role] - 'buyer' | 'seller' | 'exporter'
 */
export const register = async (req, res, next) => {
  try {
    const { email, password, uid, idToken, displayName, phone, role } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
        code: 'VALIDATION_MISSING_EMAIL'
      });
    }

    if (!password && !idToken) {
      return res.status(400).json({
        success: false,
        message: 'Password or ID token is required.',
        code: 'VALIDATION_MISSING_CREDENTIALS'
      });
    }

    // Validate role if provided
    const validRoles = ['buyer', 'seller', 'supplier', 'exporter'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
        code: 'VALIDATION_INVALID_ROLE'
      });
    }

    const result = await authService.registerUser({
      email,
      password,
      uid,
      displayName: displayName || '',
      phone: phone || '',
      role: role || 'buyer',
      idToken
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: result.user,
      token: result.token
    });
  } catch (error) {
    // Handle Firebase-specific errors
    const errorCode = error.errorInfo?.code || error.code || '';

    if (errorCode === 'auth/email-already-exists') {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered.',
        code: 'AUTH_EMAIL_EXISTS'
      });
    }

    if (errorCode === 'auth/invalid-email') {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address.',
        code: 'AUTH_INVALID_EMAIL'
      });
    }

    if (errorCode === 'auth/weak-password') {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
        code: 'AUTH_WEAK_PASSWORD'
      });
    }

    next(error);
  }
};

/**
 * Login with Firebase ID token.
 * Verifies the token and returns the user profile.
 *
 * @route POST /api/auth/login
 * @body {string} idToken - Firebase ID token from client
 */
export const login = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'ID token is required.',
        code: 'VALIDATION_MISSING_TOKEN'
      });
    }

    const result = await authService.loginUser(idToken);

    res.json({
      success: true,
      message: 'Login successful.',
      data: result.user,
      token: result.token
    });
  } catch (error) {
    const errorCode = error.errorInfo?.code || error.code || '';

    if (errorCode === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please sign in again.',
        code: 'AUTH_TOKEN_EXPIRED'
      });
    }

    if (errorCode === 'auth/invalid-id-token') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
        code: 'AUTH_INVALID_TOKEN'
      });
    }

    next(error);
  }
};

/**
 * Refresh authentication token.
 * Verifies the current token and issues a new one.
 *
 * @route POST /api/auth/refresh
 * @headers Authorization: Bearer <current-token>
 */
export const refresh = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const currentToken = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null;

    if (!currentToken) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is required.',
        code: 'AUTH_MISSING_TOKEN'
      });
    }

    const result = await authService.refreshToken(currentToken);

    res.json({
      success: true,
      message: 'Token refreshed successfully.',
      token: result.token,
      data: result.user
    });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
        code: 'USER_NOT_FOUND'
      });
    }

    next(error);
  }
};

/**
 * Logout and invalidate the user session.
 * Revokes all refresh tokens for the user in Firebase Auth.
 *
 * @route POST /api/auth/logout
 * @headers Authorization: Bearer <token>
 */
export const logout = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null;

    if (!token) {
      // Even without a token, return success for logout
      return res.json({
        success: true,
        message: 'Logged out successfully.'
      });
    }

    try {
      const decoded = await auth.verifyIdToken(token);
      await authService.logoutUser(decoded.uid);
    } catch {
      // If token verification fails, still return success
    }

    res.json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (error) {
    // Always return success for logout to prevent client-side issues
    res.json({
      success: true,
      message: 'Logged out successfully.'
    });
  }
};
