/* ============================================================================
 * NCE — Home View (Market Overview)
 * ============================================================================ */

import CommodityService from '../services/commodityService.js';
import RequestService from '../services/requestService.js';
import PropertyService from '../services/propertyService.js';
import Config from '../config.js';
import Cards from '../components/cards.js';
import Formatter from '../utils/formatter.js';

const HomeView = {
  /**
   * Render home view
   */
  render() {
    return `
      <div class="home-view view">
        <!-- Market Summary -->
        <div class="market-summary" id="home-summary"></div>

        <!-- Top Commodities -->
        <div class="section">
          <div class="section__header">
            <h2 class="section__title">Top Commodities</h2>
            <a href="#/market" class="section__link">See All →</a>
          </div>
          <div class="horizontal-scroll" id="home-top-commodities">
            <div class="skeleton" style="width:140px;height:90px;"></div>
            <div class="skeleton" style="width:140px;height:90px;"></div>
            <div class="skeleton" style="width:140px;height:90px;"></div>
          </div>
        </div>

        <!-- Latest RFQ -->
        <div class="section">
          <div class="section__header">
            <h2 class="section__title">Latest RFQ</h2>
            <a href="#/rfq" class="section__link">View All →</a>
          </div>
          <div id="home-latest-rfq">
            <div class="skeleton" style="height:120px;margin-bottom:8px;"></div>
            <div class="skeleton" style="height:120px;"></div>
          </div>
        </div>

        <!-- Market Movers -->
        <div class="section">
          <div class="section__header">
            <h2 class="section__title">Market Movers</h2>
          </div>
          <div id="home-market-movers" style="display:flex;flex-direction:column;gap:8px;">
            <div class="skeleton" style="height:56px;"></div>
            <div class="skeleton" style="height:56px;"></div>
            <div class="skeleton" style="height:56px;"></div>
          </div>
        </div>

        <!-- Top Verified Companies -->
        <div class="section">
          <div class="section__header">
            <h2 class="section__title">Top Companies</h2>
          </div>
          <div class="horizontal-scroll" id="home-top-companies">
            <div class="skeleton" style="width:200px;height:80px;"></div>
            <div class="skeleton" style="width:200px;height:80px;"></div>
          </div>
        </div>

        <!-- Latest Business Opportunities -->
        <div class="section">
          <div class="section__header">
            <h2 class="section__title">Business Opportunities</h2>
          </div>
          <div class="horizontal-scroll" id="home-opportunities">
            <div class="skeleton" style="width:180px;height:80px;"></div>
            <div class="skeleton" style="width:180px;height:80px;"></div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Initialize home view — load data
   */
  async init() {
    this._loadSummary();
    this._loadTopCommodities();
    this._loadLatestRFQ();
    this._loadMarketMovers();
    this._loadTopCompanies();
    this._loadOpportunities();
  },

  _loadSummary() {
    const el = document.getElementById('home-summary');
    if (!el) return;
    const market = CommodityService.getSimulatedMarket();
    const avgChange = market.reduce((s, c) => s + c.change, 0) / market.length;
    const totalSupply = market.reduce((s, c) => s + c.supply, 0);
    const totalDemand = market.reduce((s, c) => s + c.demand, 0);

    el.innerHTML = `
      <div class="summary-stat">
        <div class="summary-stat__value" style="color:${avgChange >= 0 ? 'var(--success)' : 'var(--danger)'}">
          ${avgChange >= 0 ? '▲' : '▼'} ${Formatter.percentChange(avgChange)}
        </div>
        <div class="summary-stat__label">Market</div>
      </div>
      <div class="summary-stat">
        <div class="summary-stat__value">${Formatter.number(totalSupply)}t</div>
        <div class="summary-stat__label">Supply</div>
      </div>
      <div class="summary-stat">
        <div class="summary-stat__value">${Formatter.number(totalDemand)}t</div>
        <div class="summary-stat__label">Demand</div>
      </div>
    `;
  },

  _loadTopCommodities() {
    const el = document.getElementById('home-top-commodities');
    if (!el) return;
    const data = CommodityService.getSimulatedMarket().slice(0, 8);
    el.innerHTML = data.map(c => Cards.commodity(c)).join('');
  },

  async _loadLatestRFQ() {
    const el = document.getElementById('home-latest-rfq');
    if (!el) return;
    try {
      const requests = await RequestService.fetchAll({ limit: 3 });
      if (requests.length) {
        el.innerHTML = requests.map(r => Cards.rfq(r)).join('');
      } else {
        el.innerHTML = `
          <div class="empty-state" style="padding:24px;">
            <div class="empty-state__title" style="font-size:14px;">No active RFQs</div>
            <div class="empty-state__desc" style="font-size:12px;">Create one to get started</div>
          </div>
        `;
      }
    } catch {
      el.innerHTML = `
        <div class="empty-state" style="padding:24px;">
          <div class="empty-state__desc" style="font-size:12px;">Could not load RFQs</div>
        </div>
      `;
    }
  },

  _loadMarketMovers() {
    const el = document.getElementById('home-market-movers');
    if (!el) return;
    const movers = CommodityService.getMarketMovers(5);
    el.innerHTML = movers.map(m => Cards.marketMover(m)).join('');
  },

  _loadTopCompanies() {
    const el = document.getElementById('home-top-companies');
    if (!el) return;
    el.innerHTML = Config.COMPANIES.map(c => Cards.company(c)).join('');
  },

  async _loadOpportunities() {
    const el = document.getElementById('home-opportunities');
    if (!el) return;
    try {
      const properties = await PropertyService.fetchAll({ limit: 5 });
      if (properties.length) {
        el.innerHTML = properties.map(p => Cards.opportunity(p)).join('');
      } else {
        el.innerHTML = `
          <div class="card" style="min-width:180px;text-align:center;">
            <div style="font-size:12px;color:var(--text-muted);">No opportunities yet</div>
          </div>
        `;
      }
    } catch {
      el.innerHTML = `
        <div class="card" style="min-width:180px;text-align:center;">
          <div style="font-size:12px;color:var(--text-muted);">Coming soon</div>
        </div>
      `;
    }
  }
};

export default HomeView;
