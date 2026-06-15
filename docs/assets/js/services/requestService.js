/* ============================================================================
 * NCE — Request (RFQ) Service
 * ============================================================================ */

import Api from '../api.js';
import Config from '../config.js';
import State from '../state.js';

const RequestService = {
  /**
   * Fetch buy requests from API
   */
  async fetchAll(params = {}) {
    try {
      const result = await Api.get('/requests', {
        page: params.page || 1,
        limit: params.limit || Config.DEFAULT_PAGE_SIZE,
        ...params
      });

      const requests = result.data || result.requests || result || [];
      State.set('requests', requests);
      return requests;
    } catch (e) {
      console.error('Failed to fetch requests:', e);
      return [];
    }
  },

  /**
   * Get single request with offers
   */
  async fetchOne(id) {
    try {
      return await Api.get(`/requests/${id}`);
    } catch (e) {
      console.error('Failed to fetch request:', e);
      return null;
    }
  },

  /**
   * Create a buy request (RFQ) — requires auth
   */
  async create(data) {
    return await Api.post('/requests', data);
  },

  /**
   * Submit an offer for a request — requires auth (seller)
   */
  async submitOffer(requestId, offerData) {
    return await Api.post(`/requests/${requestId}/offers`, offerData);
  },

  /**
   * Accept an offer — requires auth (buyer)
   */
  async acceptOffer(requestId, offerId) {
    return await Api.put(`/requests/${requestId}/offers/${offerId}/accept`);
  },

  /**
   * Reject an offer — requires auth (buyer)
   */
  async rejectOffer(requestId, offerId) {
    return await Api.put(`/requests/${requestId}/offers/${offerId}/reject`);
  },

  /**
   * Map request status to badge class
   */
  getStatusBadge(status) {
    const map = {
      open: 'badge--open',
      in_progress: 'badge--in_progress',
      inProgress: 'badge--in_progress',
      completed: 'badge--completed',
      cancelled: 'badge--completed',
      closed: 'badge--completed'
    };
    return map[status] || 'badge--open';
  },

  /**
   * Format status display text
   */
  formatStatus(status) {
    const map = {
      open: 'Open',
      in_progress: 'In Progress',
      inProgress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
      closed: 'Closed'
    };
    return map[status] || status || 'Open';
  }
};

export default RequestService;
