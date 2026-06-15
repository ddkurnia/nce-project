import { get, put } from '../api.js';

class UserService {
  async getProfile() {
    return await get('/users/profile');
  }

  async updateProfile(data) {
    return await put('/users/profile', data);
  }

  async getDashboard() {
    return await get('/users/dashboard');
  }

  async getRecentActivity(limit = 10) {
    return await get('/users/dashboard/activity', { limit });
  }

  getStoredUser() {
    try {
      const raw = localStorage.getItem('nce_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  isAuthenticated() {
    try {
      const raw = localStorage.getItem('nce_user');
      if (!raw) return false;
      const user = JSON.parse(raw);
      return !!(user && user.token);
    } catch {
      return false;
    }
  }
}

export const userService = new UserService();
