import { get, post, put, del } from '../api.js';

class CommodityService {
  async getAll(params = {}) {
    return await get('/commodities', params);
  }

  async getById(id) {
    return await get(`/commodities/${id}`);
  }

  async create(data) {
    return await post('/commodities', data);
  }

  async update(id, data) {
    return await put(`/commodities/${id}`, data);
  }

  async remove(id) {
    return await del(`/commodities/${id}`);
  }

  async getByType(type) {
    return await get('/commodities', { type });
  }

  async search(query) {
    return await get('/commodities', { search: query });
  }

  async getPriceChartData(period = '1W') {
    return await get('/commodities/chart/price', { period });
  }

  async getVolumeChartData(period = '1W') {
    return await get('/commodities/chart/volume', { period });
  }
}

export const commodityService = new CommodityService();
