/* ============================================================================
 * NCE — Commodity Service
 * ============================================================================ */

import Api from '../api.js';
import Config from '../config.js';
import State from '../state.js';

const CommodityService = {
  /**
   * Fetch commodities from API
   */
  async fetchAll(params = {}) {
    try {
      const result = await Api.get('/commodities', {
        page: params.page || 1,
        limit: params.limit || Config.DEFAULT_PAGE_SIZE,
        sortBy: params.sortBy || 'createdAt',
        sortOrder: params.sortOrder || 'desc',
        ...params
      });

      const commodities = result.data || result.commodities || result || [];
      State.set('commodities', commodities);
      return commodities;
    } catch (e) {
      console.error('Failed to fetch commodities:', e);
      return [];
    }
  },

  /**
   * Get single commodity
   */
  async fetchOne(id) {
    try {
      return await Api.get(`/commodities/${id}`);
    } catch (e) {
      console.error('Failed to fetch commodity:', e);
      return null;
    }
  },

  /**
   * Create commodity (auth required)
   */
  async create(data) {
    return await Api.post('/commodities', data);
  },

  /**
   * Get simulated market data with random fluctuations
   */
  getSimulatedMarket() {
    return Config.COMMODITIES.map(c => {
      const fluctuation = (Math.random() - 0.5) * 2;
      const currentPrice = Math.round(c.price * (1 + fluctuation / 100));
      const supply = Math.round(500 + Math.random() * 4500);
      const demand = Math.round(500 + Math.random() * 4500);
      const buyOrders = Math.round(10 + Math.random() * 90);
      const sellOrders = Math.round(10 + Math.random() * 90);

      return {
        ...c,
        currentPrice,
        supply,
        demand,
        buyOrders,
        sellOrders,
        change: +(c.change + fluctuation * 0.5).toFixed(2)
      };
    });
  },

  /**
   * Get market movers (biggest changes)
   */
  getMarketMovers(limit = 5) {
    const market = this.getSimulatedMarket();
    return market
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
      .slice(0, limit);
  }
};

export default CommodityService;
