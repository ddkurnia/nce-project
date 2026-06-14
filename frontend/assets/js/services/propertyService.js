/**
 * NCE Property Exchange Service
 * Nusantara Commodity Exchange (NCE)
 *
 * Provides CRUD operations for property listings, including:
 *  - List / Get / Create / Update / Delete properties
 *  - Filter by type
 *  - Image upload (Cloudinary via backend)
 *
 * All API calls go through the Express backend using the httpService wrapper,
 * which automatically attaches the Authorization header with the current JWT.
 */

import { get, post, put, del, apiRequest, NCEApiError } from './httpService.js';

// ---------------------------------------------------------------------------
// PropertyService Class
// ---------------------------------------------------------------------------

class PropertyService {
  // -----------------------------------------------------------------------
  // Property Listings
  // -----------------------------------------------------------------------

  /**
   * Retrieve a paginated, filterable list of properties.
   *
   * @param {object} [params={}] Query parameters
   * @param {string} [params.type]        – Property type filter (e.g. 'warehouse', 'farmland', 'processing')
   * @param {string} [params.search]      – Full-text search term
   * @param {number} [params.page]        – Page number
   * @param {number} [params.limit]       – Items per page
   * @param {string} [params.sortBy]      – Sort field
   * @param {string} [params.sortOrder]   – 'asc' or 'desc'
   * @param {string} [params.location]    – Location filter
   * @param {number} [params.minPrice]    – Minimum price filter
   * @param {number} [params.maxPrice]    – Maximum price filter
   * @returns {Promise<object>} { data: Property[], pagination }
   * @throws {NCEApiError}
   */
  async getAll(params = {}) {
    try {
      return await get('/properties', params);
    } catch (error) {
      if (error instanceof NCEApiError) {
        throw error;
      }
      throw new NCEApiError(
        error.message || 'Failed to fetch properties',
        0,
        null,
        'PROPERTY_FETCH_ALL_FAILED'
      );
    }
  }

  /**
   * Retrieve a single property by its ID.
   *
   * @param {string} id – Property ID
   * @returns {Promise<object>} Property detail
   * @throws {NCEApiError}
   */
  async getById(id) {
    try {
      if (!id) {
        throw new NCEApiError('Property ID is required', 400, null, 'MISSING_ID');
      }
      return await get(`/properties/${encodeURIComponent(id)}`);
    } catch (error) {
      if (error instanceof NCEApiError) {
        throw error;
      }
      throw new NCEApiError(
        error.message || 'Failed to fetch property',
        0,
        null,
        'PROPERTY_FETCH_ONE_FAILED'
      );
    }
  }

  /**
   * Create a new property listing.
   * Requires authentication.
   *
   * @param {object} data – Property data
   * @param {string} data.title        – Property title
   * @param {string} data.type         – Property type
   * @param {number} data.price        – Price
   * @param {string} data.location     – Property location
   * @param {string} data.description  – Description
   * @param {number} [data.area]       – Area in square meters
   * @param {string} [data.address]    – Full address
   * @param {string[]} [data.features] – List of features
   * @returns {Promise<object>} Created property
   * @throws {NCEApiError}
   */
  async create(data) {
    try {
      if (!data || typeof data !== 'object') {
        throw new NCEApiError('Property data is required', 400, null, 'INVALID_DATA');
      }
      return await post('/properties', data);
    } catch (error) {
      if (error instanceof NCEApiError) {
        throw error;
      }
      throw new NCEApiError(
        error.message || 'Failed to create property',
        0,
        null,
        'PROPERTY_CREATE_FAILED'
      );
    }
  }

  /**
   * Update an existing property listing.
   * Requires authentication and ownership (or admin role).
   *
   * @param {string} id   – Property ID
   * @param {object} data – Fields to update
   * @returns {Promise<object>} Updated property
   * @throws {NCEApiError}
   */
  async update(id, data) {
    try {
      if (!id) {
        throw new NCEApiError('Property ID is required', 400, null, 'MISSING_ID');
      }
      if (!data || typeof data !== 'object') {
        throw new NCEApiError('Update data is required', 400, null, 'INVALID_DATA');
      }
      return await put(`/properties/${encodeURIComponent(id)}`, data);
    } catch (error) {
      if (error instanceof NCEApiError) {
        throw error;
      }
      throw new NCEApiError(
        error.message || 'Failed to update property',
        0,
        null,
        'PROPERTY_UPDATE_FAILED'
      );
    }
  }

  /**
   * Delete a property listing by ID.
   * Requires authentication and ownership (or admin role).
   *
   * @param {string} id – Property ID
   * @returns {Promise<object>} Deletion confirmation
   * @throws {NCEApiError}
   */
  async delete(id) {
    try {
      if (!id) {
        throw new NCEApiError('Property ID is required', 400, null, 'MISSING_ID');
      }
      return await del(`/properties/${encodeURIComponent(id)}`);
    } catch (error) {
      if (error instanceof NCEApiError) {
        throw error;
      }
      throw new NCEApiError(
        error.message || 'Failed to delete property',
        0,
        null,
        'PROPERTY_DELETE_FAILED'
      );
    }
  }

  /**
   * Retrieve properties filtered by type.
   *
   * @param {string} type – Property type (e.g. 'warehouse', 'farmland', 'processing')
   * @returns {Promise<object>} Filtered property list
   * @throws {NCEApiError}
   */
  async getByType(type) {
    try {
      if (!type) {
        throw new NCEApiError('Property type is required', 400, null, 'MISSING_TYPE');
      }
      return await get('/properties', { type });
    } catch (error) {
      if (error instanceof NCEApiError) {
        throw error;
      }
      throw new NCEApiError(
        error.message || 'Failed to fetch properties by type',
        0,
        null,
        'PROPERTY_FETCH_BY_TYPE_FAILED'
      );
    }
  }

  /**
   * Upload a property image via the backend (Cloudinary integration).
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

      return await apiRequest('/properties/upload', {
        method: 'POST',
        body: formData
      });
    } catch (error) {
      if (error instanceof NCEApiError) {
        throw error;
      }
      throw new NCEApiError(
        error.message || 'Failed to upload property image',
        0,
        null,
        'PROPERTY_IMAGE_UPLOAD_FAILED'
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton Export
// ---------------------------------------------------------------------------

const propertyService = new PropertyService();
export default propertyService;
