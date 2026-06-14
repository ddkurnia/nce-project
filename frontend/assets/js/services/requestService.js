/**
 * NCE Request (Buy Request & Offer) Service
 * Nusantara Commodity Exchange (NCE)
 *
 * Provides full CRUD for buy requests and their associated offers:
 *  - List / Get / Create / Update / Delete buy requests
 *  - Submit, list, accept, and reject offers on a request
 *
 * All API calls go through the Express backend using the httpService wrapper,
 * which automatically attaches the Authorization header with the current JWT.
 */

import { get, post, put, del, apiRequest, NCEApiError } from './httpService.js';

// ---------------------------------------------------------------------------
// RequestService Class
// ---------------------------------------------------------------------------

class RequestService {
  // -----------------------------------------------------------------------
  // Buy Requests
  // -----------------------------------------------------------------------

  /**
   * Retrieve a paginated, filterable list of buy requests.
   *
   * @param {object} [params={}] Query parameters
   * @param {string} [params.status]     – Filter by status ('open', 'closed', 'fulfilled')
   * @param {string} [params.commodity]  – Filter by commodity ID
   * @param {string} [params.search]     – Full-text search term
   * @param {number} [params.page]       – Page number
   * @param {number} [params.limit]      – Items per page
   * @param {string} [params.sortBy]     – Sort field
   * @param {string} [params.sortOrder]  – 'asc' or 'desc'
   * @returns {Promise<object>} { data: BuyRequest[], pagination }
   * @throws {NCEApiError}
   */
  async getAllRequests(params = {}) {
    try {
      return await get('/requests', params);
    } catch (error) {
      if (error instanceof NCEApiError) {
        throw error;
      }
      throw new NCEApiError(
        error.message || 'Failed to fetch buy requests',
        0,
        null,
        'REQUEST_FETCH_ALL_FAILED'
      );
    }
  }

  /**
   * Retrieve a single buy request by its ID, including its offers.
   *
   * @param {string} id – Buy request ID
   * @returns {Promise<object>} Buy request detail with offers
   * @throws {NCEApiError}
   */
  async getRequestById(id) {
    try {
      if (!id) {
        throw new NCEApiError('Request ID is required', 400, null, 'MISSING_ID');
      }
      return await get(`/requests/${encodeURIComponent(id)}`);
    } catch (error) {
      if (error instanceof NCEApiError) {
        throw error;
      }
      throw new NCEApiError(
        error.message || 'Failed to fetch buy request',
        0,
        null,
        'REQUEST_FETCH_ONE_FAILED'
      );
    }
  }

  /**
   * Create a new buy request.
   * Requires authentication.
   *
   * @param {object} data – Buy request data
   * @param {string} data.title         – Request title
   * @param {string} data.commodity     – Commodity ID
   * @param {string} data.commodityType – Type of commodity
   * @param {number} data.quantity      – Desired quantity
   * @param {string} data.unit          – Unit of measurement
   * @param {number} [data.budget]      – Budget per unit
   * @param {string} [data.description] – Additional details
   * @param {string} [data.deadline]    – Deadline ISO date
   * @param {string} [data.location]    – Delivery location
   * @returns {Promise<object>} Created buy request
   * @throws {NCEApiError}
   */
  async createRequest(data) {
    try {
      if (!data || typeof data !== 'object') {
        throw new NCEApiError('Request data is required', 400, null, 'INVALID_DATA');
      }
      return await post('/requests', data);
    } catch (error) {
      if (error instanceof NCEApiError) {
        throw error;
      }
      throw new NCEApiError(
        error.message || 'Failed to create buy request',
        0,
        null,
        'REQUEST_CREATE_FAILED'
      );
    }
  }

  /**
   * Update an existing buy request.
   * Requires authentication and ownership (or admin role).
   *
   * @param {string} id   – Buy request ID
   * @param {object} data – Fields to update
   * @returns {Promise<object>} Updated buy request
   * @throws {NCEApiError}
   */
  async updateRequest(id, data) {
    try {
      if (!id) {
        throw new NCEApiError('Request ID is required', 400, null, 'MISSING_ID');
      }
      if (!data || typeof data !== 'object') {
        throw new NCEApiError('Update data is required', 400, null, 'INVALID_DATA');
      }
      return await put(`/requests/${encodeURIComponent(id)}`, data);
    } catch (error) {
      if (error instanceof NCEApiError) {
        throw error;
      }
      throw new NCEApiError(
        error.message || 'Failed to update buy request',
        0,
        null,
        'REQUEST_UPDATE_FAILED'
      );
    }
  }

  /**
   * Delete a buy request by ID.
   * Requires authentication and ownership (or admin role).
   *
   * @param {string} id – Buy request ID
   * @returns {Promise<object>} Deletion confirmation
   * @throws {NCEApiError}
   */
  async deleteRequest(id) {
    try {
      if (!id) {
        throw new NCEApiError('Request ID is required', 400, null, 'MISSING_ID');
      }
      return await del(`/requests/${encodeURIComponent(id)}`);
    } catch (error) {
      if (error instanceof NCEApiError) {
        throw error;
      }
      throw new NCEApiError(
        error.message || 'Failed to delete buy request',
        0,
        null,
        'REQUEST_DELETE_FAILED'
      );
    }
  }

  // -----------------------------------------------------------------------
  // Offers
  // -----------------------------------------------------------------------

  /**
   * Submit an offer on a buy request.
   * Requires authentication (supplier role).
   *
   * @param {string} requestId – Buy request ID
   * @param {object} data      – Offer data
   * @param {number} data.price       – Offered price per unit
   * @param {number} data.quantity     – Available quantity
   * @param {string} [data.message]   – Offer message / description
   * @param {string} [data.deliveryDate] – Estimated delivery date
   * @returns {Promise<object>} Created offer
   * @throws {NCEApiError}
   */
  async submitOffer(requestId, data) {
    try {
      if (!requestId) {
        throw new NCEApiError('Request ID is required', 400, null, 'MISSING_REQUEST_ID');
      }
      if (!data || typeof data !== 'object') {
        throw new NCEApiError('Offer data is required', 400, null, 'INVALID_DATA');
      }
      return await post(`/requests/${encodeURIComponent(requestId)}/offers`, data);
    } catch (error) {
      if (error instanceof NCEApiError) {
        throw error;
      }
      throw new NCEApiError(
        error.message || 'Failed to submit offer',
        0,
        null,
        'OFFER_SUBMIT_FAILED'
      );
    }
  }

  /**
   * Retrieve all offers for a specific buy request.
   * Requires authentication (request owner or admin).
   *
   * @param {string} requestId – Buy request ID
   * @returns {Promise<object>} List of offers
   * @throws {NCEApiError}
   */
  async getOffers(requestId) {
    try {
      if (!requestId) {
        throw new NCEApiError('Request ID is required', 400, null, 'MISSING_REQUEST_ID');
      }
      return await get(`/requests/${encodeURIComponent(requestId)}/offers`);
    } catch (error) {
      if (error instanceof NCEApiError) {
        throw error;
      }
      throw new NCEApiError(
        error.message || 'Failed to fetch offers',
        0,
        null,
        'OFFER_FETCH_FAILED'
      );
    }
  }

  /**
   * Accept an offer on a buy request.
   * Only the request owner can accept.
   *
   * @param {string} requestId – Buy request ID
   * @param {string} offerId   – Offer ID to accept
   * @returns {Promise<object>} Updated request with accepted offer
   * @throws {NCEApiError}
   */
  async acceptOffer(requestId, offerId) {
    try {
      if (!requestId) {
        throw new NCEApiError('Request ID is required', 400, null, 'MISSING_REQUEST_ID');
      }
      if (!offerId) {
        throw new NCEApiError('Offer ID is required', 400, null, 'MISSING_OFFER_ID');
      }
      return await put(
        `/requests/${encodeURIComponent(requestId)}/offers/${encodeURIComponent(offerId)}/accept`,
        {}
      );
    } catch (error) {
      if (error instanceof NCEApiError) {
        throw error;
      }
      throw new NCEApiError(
        error.message || 'Failed to accept offer',
        0,
        null,
        'OFFER_ACCEPT_FAILED'
      );
    }
  }

  /**
   * Reject an offer on a buy request.
   * Only the request owner can reject.
   *
   * @param {string} requestId – Buy request ID
   * @param {string} offerId   – Offer ID to reject
   * @returns {Promise<object>} Updated request with rejected offer
   * @throws {NCEApiError}
   */
  async rejectOffer(requestId, offerId) {
    try {
      if (!requestId) {
        throw new NCEApiError('Request ID is required', 400, null, 'MISSING_REQUEST_ID');
      }
      if (!offerId) {
        throw new NCEApiError('Offer ID is required', 400, null, 'MISSING_OFFER_ID');
      }
      return await put(
        `/requests/${encodeURIComponent(requestId)}/offers/${encodeURIComponent(offerId)}/reject`,
        {}
      );
    } catch (error) {
      if (error instanceof NCEApiError) {
        throw error;
      }
      throw new NCEApiError(
        error.message || 'Failed to reject offer',
        0,
        null,
        'OFFER_REJECT_FAILED'
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton Export
// ---------------------------------------------------------------------------

const requestService = new RequestService();
export default requestService;
