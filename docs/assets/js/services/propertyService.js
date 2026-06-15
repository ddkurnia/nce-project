import { get, post, put, del } from '../api.js';

class PropertyService {
  async getAll(params = {}) {
    return await get('/properties', params);
  }

  async getById(id) {
    return await get(`/properties/${id}`);
  }

  async create(data) {
    return await post('/properties', data);
  }

  async update(id, data) {
    return await put(`/properties/${id}`, data);
  }

  async remove(id) {
    return await del(`/properties/${id}`);
  }

  async getByType(type) {
    return await get('/properties', { type });
  }

  async search(query) {
    return await get('/properties', { search: query });
  }
}

export const propertyService = new PropertyService();
