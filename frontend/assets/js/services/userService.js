/**
 * NCE User Management Service
 * Nusantara Commodity Exchange (NCE)
 *
 * Provides user profile and admin user management operations:
 *  - Get / Update user profile
 *  - Admin: list all users, verify, update role, delete account
 *  - Dashboard statistics
 *
 * All API calls go through the Express backend using the httpService wrapper,
 * which automatically attaches the Authorization header with the current JWT.
 */

import { get, post, put, patch, del, NCEApiError } from './httpService.js';

// ---------------------------------------------------------------------------
// UserService Class
// ---------------------------------------------------------------------------

class UserService {
  // -----------------------------------------------------------------------
  // Profile
  // -----------------------------------------------------------------------

  /**
   * Retrieve a user's profile by UID.
   *
   * @param {string} uid – Firebase UID
   * @returns {Promise<object>} User profile
   * @throws {NCEApiError}
   */
  async getProfile(uid) {
    try {
      if (!uid) {
        throw new NCEApiError('User UID is required', 400, null, 'MISSING_UID');
      }
      return await get(`/users/${encodeURIComponent(uid)}`);
    } catch (error) {
      if (error instanceof NCEApiError) {
        throw error;
      }
      throw new NCEApiError(
        error.message || 'Failed to fetch user profile',
        0,
        null,
        'USER_PROFILE_FETCH_FAILED'
      );
    }
  }

  /**
   * Update the current user's profile.
   *
   * @param {object} data – Fields to update
   * @param {string} [data.displayName] – Display name
   * @param {string} [data.phone]       – Phone number
   * @param {string} [data.company]     – Company name
   * @param {string} [data.address]     – Address
   * @param {string} [data.city]        – City
   * @param {string} [data.province]    – Province
   * @param {string} [data.bio]         – Bio / description
   * @param {string} [data.photoURL]    – Profile photo URL
   * @returns {Promise<object>} Updated profile
   * @throws {NCEApiError}
   */
  async updateProfile(data) {
    try {
      if (!data || typeof data !== 'object') {
        throw new NCEApiError('Profile data is required', 400, null, 'INVALID_DATA');
      }
      return await patch('/users/profile', data);
    } catch (error) {
      if (error instanceof NCEApiError) {
        throw error;
      }
      throw new NCEApiError(
        error.message || 'Failed to update profile',
        0,
        null,
        'USER_PROFILE_UPDATE_FAILED'
      );
    }
  }

  // -----------------------------------------------------------------------
  // Admin – User Management
  // -----------------------------------------------------------------------

  /**
   * Retrieve a paginated list of all users.
   * Requires admin role.
   *
   * @param {object} [params={}] Query parameters
   * @param {string} [params.search]   – Search by name or email
   * @param {string} [params.role]     – Filter by role
   * @param {string} [params.verified] – Filter by verification status ('true'/'false')
   * @param {number} [params.page]     – Page number
   * @param {number} [params.limit]    – Items per page
   * @param {string} [params.sortBy]   – Sort field
   * @param {string} [params.sortOrder] – 'asc' or 'desc'
   * @returns {Promise<object>} { data: User[], pagination }
   * @throws {NCEApiError}
   */
  async getAllUsers(params = {}) {
    try {
      return await get('/users', params);
    } catch (error) {
      if (error instanceof NCEApiError) {
        throw error;
      }
      throw new NCEApiError(
        error.message || 'Failed to fetch users',
        0,
        null,
        'USER_FETCH_ALL_FAILED'
      );
    }
  }

  /**
   * Verify a user as a specific type (supplier, buyer, exporter).
   * Requires admin role.
   *
   * @param {string} uid  – Firebase UID of the user to verify
   * @param {string} type – Verification type: 'supplier' | 'buyer' | 'exporter'
   * @returns {Promise<object>} Verification result
   * @throws {NCEApiError}
   */
  async verifyUser(uid, type) {
    try {
      if (!uid) {
        throw new NCEApiError('User UID is required', 400, null, 'MISSING_UID');
      }
      if (!type) {
        throw new NCEApiError('Verification type is required', 400, null, 'MISSING_TYPE');
      }

      const validTypes = ['supplier', 'buyer', 'exporter'];
      if (!validTypes.includes(type)) {
        throw new NCEApiError(
          `Invalid verification type. Must be one of: ${validTypes.join(', ')}`,
          400,
          null,
          'INVALID_VERIFICATION_TYPE'
        );
      }

      return await post(`/users/${encodeURIComponent(uid)}/verify`, { type });
    } catch (error) {
      if (error instanceof NCEApiError) {
        throw error;
      }
      throw new NCEApiError(
        error.message || 'Failed to verify user',
        0,
        null,
        'USER_VERIFY_FAILED'
      );
    }
  }

  /**
   * Update a user's role.
   * Requires admin role.
   *
   * @param {string} uid  – Firebase UID of the user
   * @param {string} role – New role: 'admin' | 'supplier' | 'buyer' | 'exporter'
   * @returns {Promise<object>} Role update result
   * @throws {NCEApiError}
   */
  async updateRole(uid, role) {
    try {
      if (!uid) {
        throw new NCEApiError('User UID is required', 400, null, 'MISSING_UID');
      }
      if (!role) {
        throw new NCEApiError('Role is required', 400, null, 'MISSING_ROLE');
      }

      const validRoles = ['admin', 'supplier', 'buyer', 'exporter'];
      if (!validRoles.includes(role)) {
        throw new NCEApiError(
          `Invalid role. Must be one of: ${validRoles.join(', ')}`,
          400,
          null,
          'INVALID_ROLE'
        );
      }

      return await put(`/users/${encodeURIComponent(uid)}/role`, { role });
    } catch (error) {
      if (error instanceof NCEApiError) {
        throw error;
      }
      throw new NCEApiError(
        error.message || 'Failed to update user role',
        0,
        null,
        'USER_ROLE_UPDATE_FAILED'
      );
    }
  }

  /**
   * Delete a user account.
   * Requires admin role.
   *
   * @param {string} uid – Firebase UID of the user to delete
   * @returns {Promise<object>} Deletion confirmation
   * @throws {NCEApiError}
   */
  async deleteAccount(uid) {
    try {
      if (!uid) {
        throw new NCEApiError('User UID is required', 400, null, 'MISSING_UID');
      }
      return await del(`/users/${encodeURIComponent(uid)}`);
    } catch (error) {
      if (error instanceof NCEApiError) {
        throw error;
      }
      throw new NCEApiError(
        error.message || 'Failed to delete user account',
        0,
        null,
        'USER_DELETE_FAILED'
      );
    }
  }

  // -----------------------------------------------------------------------
  // Dashboard
  // -----------------------------------------------------------------------

  /**
   * Retrieve dashboard statistics for the current user.
   * Includes counts, summaries, and recent activity.
   *
   * @returns {Promise<object>} Dashboard stats
   * @throws {NCEApiError}
   */
  async getDashboardStats() {
    try {
      return await get('/users/dashboard/stats');
    } catch (error) {
      if (error instanceof NCEApiError) {
        throw error;
      }
      throw new NCEApiError(
        error.message || 'Failed to fetch dashboard stats',
        0,
        null,
        'DASHBOARD_STATS_FAILED'
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton Export
// ---------------------------------------------------------------------------

const userService = new UserService();
export default userService;
