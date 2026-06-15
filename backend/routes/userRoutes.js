/**
 * NCE User Routes
 * Nusantara Commodity Exchange (NCE)
 *
 * User management endpoints:
 *  GET    /api/users/dashboard/stats - Dashboard statistics (auth required)
 *  GET    /api/users                 - List users (admin only)
 *  GET    /api/users/:uid            - Get user profile
 *  PATCH  /api/users/profile         - Update own profile (auth required)
 *  POST   /api/users/:uid/verify     - Verify user (admin only)
 *  PUT    /api/users/:uid/role       - Update role (admin only)
 *  DELETE /api/users/:uid            - Delete user (admin only)
 */

import { Router } from 'express';
import {
  getDashboardStats,
  getAllUsers,
  getUserProfile,
  updateProfile,
  verifyUser,
  updateRole,
  deleteUser
} from '../controllers/userController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { validatePagination } from '../middleware/validate.js';

const router = Router();

/**
 * @route   GET /api/users/dashboard/stats
 * @desc    Get dashboard statistics for the current user
 * @access  Authenticated
 *
 * NOTE: This route must be defined BEFORE /:uid to avoid
 *       "dashboard" being matched as a UID parameter.
 */
router.get(
  '/dashboard/stats',
  authenticate,
  getDashboardStats
);

/**
 * @route   GET /api/users
 * @desc    List all users with filtering and pagination
 * @access  Admin only
 * @query   search, role, verified, page, limit, sortBy, sortOrder
 */
router.get(
  '/',
  authenticate,
  authorize('admin'),
  validatePagination(),
  getAllUsers
);

/**
 * @route   GET /api/users/:uid
 * @desc    Get a user's public profile by UID
 * @access  Public
 */
router.get(
  '/:uid',
  getUserProfile
);

/**
 * @route   PATCH /api/users/profile
 * @desc    Update the current user's own profile
 * @access  Authenticated
 * @body    { displayName?, phone?, company?, address?, city?, province?, bio?, photoURL? }
 */
router.patch(
  '/profile',
  authenticate,
  updateProfile
);

/**
 * @route   POST /api/users/:uid/verify
 * @desc    Verify a user as a specific type
 * @access  Admin only
 * @body    { type: 'supplier' | 'buyer' | 'exporter' }
 */
router.post(
  '/:uid/verify',
  authenticate,
  authorize('admin'),
  verifyUser
);

/**
 * @route   PUT /api/users/:uid/role
 * @desc    Update a user's role
 * @access  Admin only
 * @body    { role: 'admin' | 'supplier' | 'buyer' | 'exporter' }
 */
router.put(
  '/:uid/role',
  authenticate,
  authorize('admin'),
  updateRole
);

/**
 * @route   DELETE /api/users/:uid
 * @desc    Delete a user account
 * @access  Admin only
 */
router.delete(
  '/:uid',
  authenticate,
  authorize('admin'),
  deleteUser
);

export default router;
