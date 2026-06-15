/**
 * NCE Auth Routes
 * Nusantara Commodity Exchange (NCE)
 *
 * Authentication endpoints:
 *  POST /api/auth/register - Register new user
 *  POST /api/auth/login    - Login (verify Firebase token)
 *  POST /api/auth/refresh  - Refresh token
 *  POST /api/auth/logout   - Logout
 */

import { Router } from 'express';
import { register, login, refresh, logout } from '../controllers/authController.js';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user with Firebase Auth + Firestore profile
 * @access  Public
 * @body    { email, password, uid?, idToken?, displayName?, phone?, role? }
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    Login with Firebase ID token, return user profile
 * @access  Public
 * @body    { idToken }
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh authentication token
 * @access  Requires Bearer token in Authorization header
 */
router.post('/refresh', refresh);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout and invalidate session (revoke refresh tokens)
 * @access  Requires Bearer token in Authorization header
 */
router.post('/logout', logout);

export default router;
