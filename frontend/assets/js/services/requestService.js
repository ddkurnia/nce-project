import { get, post, put, del } from '../api.js';

class RequestService {
  async getAll(params = {}) {
    return await get('/requests', params);
  }

  async getById(id) {
    return await get(`/requests/${id}`);
  }

  async create(data) {
    return await post('/requests', data);
  }

  async update(id, data) {
    return await put(`/requests/${id}`, data);
  }

  async remove(id) {
    return await del(`/requests/${id}`);
  }

  async getMyRequests(params = {}) {
    return await get('/requests/mine', params);
  }

  async addOffer(requestId, data) {
    return await post(`/requests/${requestId}/offers`, data);
  }

  async getOffers(requestId) {
    return await get(`/requests/${requestId}/offers`);
  }

  async getByStatus(status) {
    return await get('/requests', { status });
  }
}

export const requestService = new RequestService();
