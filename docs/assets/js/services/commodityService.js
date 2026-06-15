/* ============================================================================
 * NCE — Commodity Service
 * Enhanced with data caching and sparkline generation
 * ============================================================================ */

import Api from '../api.js';
import Config from '../config.js';
import State from '../state.js';
import Sparkline from '../components/sparkline.js';

const CommodityService = {
  _cache: null,
  _cacheTime: 0,
  _cacheTTL: 10000, // 10 seconds cache

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
   * Get simulated market data with caching
   * Generates realistic price movements with sparklines
   */
  getSimulatedMarket() {
    const now = Date.now();

    // Use cache if still fresh
    if (this._cache && (now - this._cacheTime) < this._cacheTTL) {
      return this._cache;
    }

    const cached = State.get('marketData');
    const hasPrevious = cached && cached.length > 0;

    const market = Config.COMMODITIES.map(c => {
      const fluctuation = (Math.random() - 0.5) * 2;
      const basePrice = hasPrevious
        ? this._findPreviousPrice(cached, c.id) || c.price
        : c.price;
      const currentPrice = Math.round(basePrice * (1 + fluctuation / 100));
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
        change: +(c.change + fluctuation * 0.5).toFixed(2),
        sparkline: Sparkline.generateData(currentPrice, Config.SPARKLINE_POINTS, 0.015)
      };
    });

    // Update cache
    this._cache = market;
    this._cacheTime = now;
    State.set('marketData', market);

    return market;
  },

  /**
   * Find previous price from cached data
   */
  _findPreviousPrice(cached, id) {
    const item = cached.find(c => c.id === id);
    return item ? (item.currentPrice || item.price) : null;
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
