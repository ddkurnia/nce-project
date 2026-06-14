/**
 * NCE User Controller
 * Nusantara Commodity Exchange (NCE)
 *
 * Handles user management:
 *  - Dashboard statistics (auth required)
 *  - List users (admin only)
 *  - Get user profile
 *  - Update own profile (auth required)
 *  - Verify user (admin only)
 *  - Update role (admin only)
 *  - Delete user (admin only)
 */

import * as userService from '../services/userService.js';

/**
 * Get dashboard statistics for the current user.
 * Aggregates counts from commodities, requests, offers, and properties.
 *
 * @route GET /api/users/dashboard/stats
 * @auth Required
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const uid = req.user.uid;

    const stats = await userService.getDashboardStats(uid);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all users with filtering and pagination.
 * Admin only.
 *
 * @route GET /api/users
 * @auth Required, admin only
 * @query {string} [search]      - Search by name or email
 * @query {string} [role]        - Filter by role
 * @query {string} [verified]    - 'true' / 'false'
 * @query {number} [page=1]
 * @query {number} [limit=20]
 * @query {string} [sortBy=createdAt]
 * @query {string} [sortOrder=desc]
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const { search, role, verified, page, limit, sortBy, sortOrder } = req.query;

    // Validate role filter if provided
    if (role && !['admin', 'supplier', 'buyer', 'exporter'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role filter. Allowed: admin, supplier, buyer, exporter.',
        code: 'VALIDATION_INVALID_ROLE'
      });
    }

    const result = await userService.getAllUsers({
      search,
      role,
      verified,
      page: page || 1,
      limit: limit || 20,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc'
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a user's public profile by UID.
 *
 * @route GET /api/users/:uid
 * @param {string} uid - Firebase UID
 */
export const getUserProfile = async (req, res, next) => {
  try {
    const { uid } = req.params;

    if (!uid) {
      return res.status(400).json({
        success: false,
        message: 'User UID is required.',
        code: 'VALIDATION_MISSING_UID'
      });
    }

    const profile = await userService.getUserProfile(uid);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update the current user's own profile.
 * Only allows updating safe fields (no role or verification changes).
 *
 * @route PATCH /api/users/profile
 * @auth Required
 * @body {string} [displayName]
 * @body {string} [phone]
 * @body {string} [company]
 * @body {string} [address]
 * @body {string} [city]
 * @body {string} [province]
 * @body {string} [bio]
 * @body {string} [photoURL]
 */
export const updateProfile = async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const allowedFields = ['displayName', 'phone', 'company', 'address', 'city', 'province', 'bio', 'photoURL'];

    // Filter to only allowed fields
    const updateData = {};
    let hasUpdate = false;

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
        hasUpdate = true;
      }
    }

    if (!hasUpdate) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update.',
        code: 'VALIDATION_NO_FIELDS'
      });
    }

    // Sanitize string fields
    for (const field of allowedFields) {
      if (updateData[field] !== undefined && typeof updateData[field] === 'string') {
        updateData[field] = updateData[field].trim();
      }
    }

    const updated = await userService.updateProfile(uid, updateData);

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify a user as a specific type (admin only).
 *
 * @route POST /api/users/:uid/verify
 * @auth Required, admin only
 * @param {string} uid - Firebase UID of the user to verify
 * @body {string} type - Verification type: 'supplier' | 'buyer' | 'exporter'
 */
export const verifyUser = async (req, res, next) => {
  try {
    const { uid } = req.params;
    const { type } = req.body;

    if (!uid) {
      return res.status(400).json({
        success: false,
        message: 'User UID is required.',
        code: 'VALIDATION_MISSING_UID'
      });
    }

    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Verification type is required.',
        code: 'VALIDATION_MISSING_TYPE'
      });
    }

    const validTypes = ['supplier', 'buyer', 'exporter'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid verification type. Must be one of: ${validTypes.join(', ')}`,
        code: 'VALIDATION_INVALID_TYPE'
      });
    }

    // Check if user exists
    const existing = await userService.getUserProfile(uid);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
        code: 'USER_NOT_FOUND'
      });
    }

    // Prevent self-verification (admins shouldn't need verification)
    if (uid === req.user.uid) {
      return res.status(400).json({
        success: false,
        message: 'You cannot verify yourself.',
        code: 'CANNOT_VERIFY_SELF'
      });
    }

    const verified = await userService.verifyUser(uid, type);

    res.json({
      success: true,
      message: `User verified as ${type} successfully.`,
      data: verified
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a user's role (admin only).
 *
 * @route PUT /api/users/:uid/role
 * @auth Required, admin only
 * @param {string} uid - Firebase UID of the user
 * @body {string} role - New role: 'admin' | 'supplier' | 'buyer' | 'exporter'
 */
export const updateRole = async (req, res, next) => {
  try {
    const { uid } = req.params;
    const { role } = req.body;

    if (!uid) {
      return res.status(400).json({
        success: false,
        message: 'User UID is required.',
        code: 'VALIDATION_MISSING_UID'
      });
    }

    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Role is required.',
        code: 'VALIDATION_MISSING_ROLE'
      });
    }

    const validRoles = ['admin', 'supplier', 'buyer', 'exporter'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
        code: 'VALIDATION_INVALID_ROLE'
      });
    }

    // Check if user exists
    const existing = await userService.getUserProfile(uid);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
        code: 'USER_NOT_FOUND'
      });
    }

    // Prevent self-role-change (admin demoting themselves)
    if (uid === req.user.uid && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own role.',
        code: 'CANNOT_CHANGE_OWN_ROLE'
      });
    }

    const updated = await userService.updateUserRole(uid, role);

    res.json({
      success: true,
      message: `User role updated to ${role} successfully.`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a user account (admin only).
 * Removes the Firestore document and Firebase Auth user.
 *
 * @route DELETE /api/users/:uid
 * @auth Required, admin only
 * @param {string} uid - Firebase UID of the user to delete
 */
export const deleteUser = async (req, res, next) => {
  try {
    const { uid } = req.params;

    if (!uid) {
      return res.status(400).json({
        success: false,
        message: 'User UID is required.',
        code: 'VALIDATION_MISSING_UID'
      });
    }

    // Prevent self-deletion
    if (uid === req.user.uid) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account.',
        code: 'CANNOT_DELETE_SELF'
      });
    }

    // Check if user exists
    const existing = await userService.getUserProfile(uid);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
        code: 'USER_NOT_FOUND'
      });
    }

    await userService.deleteUser(uid);

    res.json({
      success: true,
      message: 'User deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
