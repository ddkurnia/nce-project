/**
 * NCE Commodity Service
 * Nusantara Commodity Exchange (NCE)
 *
 * Provides CRUD operations for commodities, including:
 *  - Listing with filters, search, and pagination
 *  - Get by ID
 *  - Create / Update / Delete
 *  - Filter by type
 *  - Featured commodities
 *  - Image upload (Cloudinary via backend)
 *
 * All API calls go through the Express backend using the httpService wrapper,
 * which automatically attaches the Authorization header with the current JWT.
 */

import { get, post, put, del, NCEApiError } from './httpService.js';

// ---------------------------------------------------------------------------
// CommodityService Class
// ---------------------------------------------------------------------------

class CommodityService {
  /**
   * Retrieve a paginated, filterable list of commodities.
   *
   * @param {object} [params={}] Query parameters
   * @param {string} [params.type]        – Commodity type filter (e.g. 'spice', 'grain')
   * @param {string} [params.search]      – Full-text search term
   * @param {number} [params.page]        – Page number (default 1)
   * @param {number} [params.limit]       – Items per page (default 20)
   * @param {string} [params.sortBy]      – Sort field (e.g. 'price', 'createdAt')
   * @param {string} [params.sortOrder]   – 'asc' or 'desc'
   * @returns {Promise<object>} { data: Commodity[], pagination: { page, limit, total, pages } }
   * @throws {NCEApiError}
   */
  async getAll(params = {}) {
    try {
      return await get('/commodities', params);
    } catch (error) {
      if (error instanceof NCEApiError) {
        throw error;
      }
      throw new NCEApiError(
        error.message || 'Failed to fetch commodities',
        0,
        null,
        'COMMODITY_FETCH_ALL_FAILED'
      );
    }
  }

  /**
   * Retrieve a single commodity by its ID.
   *
   * @param {string} id – Commodity ID
   * @returns {Promise<object>} Commodity detail
   * @throws {NCEApiError}
   */
  async getById(id) {
    try {
      if (!id) {
        throw new NCEApiError('Commodity ID is required', 400, null, 'MISSING_ID');
      }
      return await get(`/commodities/${encodeURIComponent(id)}`);
    } catch (error) {
      if (error instanceof NCEApiError) {
        throw error;
      }
      throw new NCEApiError(
        error.message || 'Failed to fetch commodity',
        0,
        null,
        'COMMODITY_FETCH_ONE_FAILED'
      );
    }
  }

  /**
   * Create a new commodity listing.
   * Requires authentication.
   *
   * @param {object} data – Commodity data (name, type, price, stock, description, etc.)
   * @returns {Promise<object>} Created commodity
   * @throws {NCEApiError}
   */
  async create(data) {
    try {
      if (!data || typeof data !== 'object') {
        throw new NCEApiError('Commodity data is required', 400, null, 'INVALID_DATA');
      }
      return await post('/commodities', data);
    } catch (error) {
      if (error instanceof NCEApiError) {
        throw error;
      }
      throw new NCEApiError(
        error.message || 'Failed to create commodity',
        0,
        null,
        'COMMODITY_CREATE_FAILED'
      );
    }
  }

  /**
   * Update an existing commodity.
   * Requires authentication and ownership (or admin role).
   *
   * @param {string} id   – Commodity ID
   * @param {object} data – Fields to update
   * @returns {Promise<object>} Updated commodity
   * @throws {NCEApiError}
   */
  async update(id, data) {
    try {
      if (!id) {
        throw new NCEApiError('Commodity ID is required', 400, null, 'MISSING_ID');
      }
      if (!data || typeof data !== 'object') {
        throw new NCEApiError('Update data is required', 400, null, 'INVALID_DATA');
      }
      return await put(`/commodities/${encodeURIComponent(id)}`, data);
    } catch (error) {
      if (error instanceof NCEApiError) {
        throw error;
      }
      throw new NCEApiError(
        error.message || 'Failed to update commodity',
        0,
        null,
        'COMMODITY_UPDATE_FAILED'
      );
    }
  }

  /**
   * Delete a commodity by ID.
   * Requires authentication and ownership (or admin role).
   *
   * @param {string} id – Commodity ID
   * @returns {Promise<object>} Deletion confirmation
   * @throws {NCEApiError}
   */
  async delete(id) {
    try {
      if (!id) {
        throw new NCEApiError('Commodity ID is required', 400, null, 'MISSING_ID');
      }
      return await del(`/commodities/${encodeURIComponent(id)}`);
    } catch (error) {
      if (error instanceof NCEApiError) {
        throw error;
      }
      throw new NCEApiError(
        error.message || 'Failed to delete commodity',
        0,
        null,
        'COMMODITY_DELETE_FAILED'
      );
    }
  }

  /**
   * Retrieve commodities filtered by type.
   *
   * @param {string} type – Commodity type (e.g. 'spice', 'grain', 'coffee')
   * @returns {Promise<object>} Filtered commodity list
   * @throws {NCEApiError}
   */
  async getByType(type) {
    try {
      if (!type) {
        throw new NCEApiError('Commodity type is required', 400, null, 'MISSING_TYPE');
      }
      return await get('/commodities', { type });
    } catch (error) {
      if (error instanceof NCEApiError) {
        throw error;
      }
      throw new NCEApiError(
        error.message || 'Failed to fetch commodities by type',
        0,
        null,
        'COMMODITY_FETCH_BY_TYPE_FAILED'
      );
    }
  }

  /**
   * Retrieve featured commodities for the landing page.
   * Returns up to 8 featured items.
   *
   * @returns {Promise<object>} Featured commodity list
   * @throws {NCEApiError}
   */
  async getFeatured() {
    try {
      return await get('/commodities', { featured: 'true', limit: 8 });
    } catch (error) {
      if (error instanceof NCEApiError) {
        throw error;
      }
      throw new NCEApiError(
        error.message || 'Failed to fetch featured commodities',
        0,
        null,
        'COMMODITY_FETCH_FEATURED_FAILED'
      );
    }
  }

  /**
   * Upload a commodity image via the backend (Cloudinary integration).
   * The image is sent as multipart/form-data.
   *
   * @param {File|Blob} file – The image file to upload
   * @returns {Promise<object>} { url, publicId, ... } Upload result
   * @throws {NCEApiError}
   */
  async uploadImage(file) {
    try {
      if (!file) {
        throw new NCEApiError('Image file is required', 400, null, 'MISSING_FILE');
      }

      const formData = new FormData();
      formData.append('image', file);

      // Use apiRequest directly so we can pass FormData without JSON serialization
      const { apiRequest } = await import('./httpService.js');
      return await apiRequest('/commodities/upload', {
        method: 'POST',
        body: formData
      });
    } catch (error) {
      if (error instanceof NCEApiError) {
        throw error;
      }
      throw new NCEApiError(
        error.message || 'Failed to upload commodity image',
        0,
        null,
        'COMMODITY_IMAGE_UPLOAD_FAILED'
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton Export
// ---------------------------------------------------------------------------

const commodityService = new CommodityService();
export default commodityService;
