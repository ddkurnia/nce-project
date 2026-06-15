/* ============================================================================
 * NCE — User Service
 * ============================================================================ */

import Api from '../api.js';
import Config from '../config.js';
import State from '../state.js';

const UserService = {
  /**
   * Fetch user profile
   */
  async fetchProfile(uid) {
    try {
      const result = await Api.get(`/users/${uid}`);
      return result.data || result.user || result;
    } catch (e) {
      console.error('Failed to fetch user:', e);
      return null;
    }
  },

  /**
   * Fetch dashboard stats — requires auth
   */
  async fetchDashboardStats() {
    try {
      const result = await Api.get('/users/dashboard/stats');
      return result.data || result.stats || result;
    } catch (e) {
      console.error('Failed to fetch dashboard stats:', e);
      return null;
    }
  },

  /**
   * Update profile — requires auth
   */
  async updateProfile(data) {
    const result = await Api.patch('/users/profile', data);
    // Update stored user data
    if (result.user || result.data) {
      const updated = result.user || result.data;
      localStorage.setItem(Config.AUTH_USER_KEY, JSON.stringify(updated));
      State.set('user', updated);
    }
    return result;
  },

  /**
   * Get simulated trust score
   */
  getTrustScore(user) {
    if (user?.trustScore) return user.trustScore;
    return Math.floor(80 + Math.random() * 19);
  }
};

export default UserService;
