/* ============================================================================
 * NCE — Property Service
 * ============================================================================ */

import Api from '../api.js';
import Config from '../config.js';
import State from '../state.js';

const PropertyService = {
  /**
   * Fetch properties from API
   */
  async fetchAll(params = {}) {
    try {
      const result = await Api.get('/properties', {
        page: params.page || 1,
        limit: params.limit || Config.DEFAULT_PAGE_SIZE,
        ...params
      });

      const properties = result.data || result.properties || result || [];
      State.set('properties', properties);
      return properties;
    } catch (e) {
      console.error('Failed to fetch properties:', e);
      return [];
    }
  },

  /**
   * Get single property
   */
  async fetchOne(id) {
    try {
      return await Api.get(`/properties/${id}`);
    } catch (e) {
      console.error('Failed to fetch property:', e);
      return null;
    }
  },

  /**
   * Create property — requires auth
   */
  async create(data) {
    return await Api.post('/properties', data);
  }
};

export default PropertyService;
