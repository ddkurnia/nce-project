/* ============================================================================
 * NCE — Home View (Market Overview Dashboard)
 * Bloomberg-style market overview with data density
 * ============================================================================ */

import CommodityService from '../services/commodityService.js';
import RequestService from '../services/requestService.js';
import PropertyService from '../services/propertyService.js';
import Config from '../config.js';
import Cards from '../components/cards.js';
import MarketBoard from '../components/marketBoard.js';
import Formatter from '../utils/formatter.js';
import Auth from '../auth.js';
import { escapeHtml } from '../utils/helpers.js';

const HomeView = {
  _refreshTimer: null,

  /**
   * Render home view
   */
  render() {
    const greeting = this._getGreeting();

    return `
      <div class="home-view view">
        <!-- Greeting -->
        <div class="home-greeting" style="margin-bottom:var(--space-xl);">
          <div style="font-size:var(--text-sm);color:var(--text-muted);">${greeting}</div>
          <div style="font-size:var(--text-lg);font-weight:700;">
            ${Auth.isLoggedIn() ? escapeHtml(Auth.getUser()?.name || 'Trader') : 'Digital Trading Floor'}
          </div>
        </div>

        <!-- Market Summary -->
        <div class="market-summary" id="home-summary">
          <div class="summary-stat"><div class="spinner" style="width:16px;height:16px;"></div></div>
          <div class="summary-stat"><div class="spinner" style="width:16px;height:16px;"></div></div>
          <div class="summary-stat"><div class="spinner" style="width:16px;height:16px;"></div></div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <button class="quick-action" data-action="create-rfq">
            <div class="quick-action__icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </div>
            Create RFQ
          </button>
          <button class="quick-action" data-action="view-market">
            <div class="quick-action__icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            </div>
            Market
          </button>
          <button class="quick-action" data-action="my-offers">
            <div class="quick-action__icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
            </div>
            Offers
          </button>
          <button class="quick-action" data-action="messages">
            <div class="quick-action__icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
            </div>
            Chat
          </button>
        </div>

        <!-- Top Commodities with Sparklines -->
        <div class="section">
          <div class="section__header">
            <h2 class="section__title">
              <svg class="section__title-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>
              Top Commodities
            </h2>
            <a href="#/market" class="section__link">See All</a>
          </div>
          <div class="horizontal-scroll" id="home-top-commodities">
            <div class="skeleton" style="width:150px;height:80px;"></div>
            <div class="skeleton" style="width:150px;height:80px;"></div>
            <div class="skeleton" style="width:150px;height:80px;"></div>
          </div>
        </div>

        <!-- Market Movers -->
        <div class="section">
          <div class="section__header">
            <h2 class="section__title">
              <svg class="section__title-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              Market Movers
            </h2>
          </div>
          <div id="home-market-movers" style="display:flex;flex-direction:column;gap:var(--space-sm);">
            <div class="skeleton" style="height:56px;"></div>
            <div class="skeleton" style="height:56px;"></div>
            <div class="skeleton" style="height:56px;"></div>
          </div>
        </div>

        <!-- Latest RFQ -->
        <div class="section">
          <div class="section__header">
            <h2 class="section__title">
              <svg class="section__title-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Latest RFQ
            </h2>
            <a href="#/rfq" class="section__link">View All</a>
          </div>
          <div id="home-latest-rfq">
            <div class="skeleton" style="height:120px;margin-bottom:8px;"></div>
            <div class="skeleton" style="height:120px;"></div>
          </div>
        </div>

        <!-- Top Verified Companies -->
        <div class="section">
          <div class="section__header">
            <h2 class="section__title">
              <svg class="section__title-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Top Companies
            </h2>
          </div>
          <div class="horizontal-scroll" id="home-top-companies">
            <div class="skeleton" style="width:200px;height:80px;"></div>
            <div class="skeleton" style="width:200px;height:80px;"></div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Initialize home view
   */
  async init() {
    this._loadSummary();
    this._loadTopCommodities();
    this._loadMarketMovers();
    this._loadLatestRFQ();
    this._loadTopCompanies();
    this._bindActions();

    // Auto-refresh market data
    this._refreshTimer = setInterval(() => {
      if (!document.hidden) {
        this._loadSummary();
        this._loadTopCommodities();
        this._loadMarketMovers();
      }
    }, Config.MARKET_REFRESH_INTERVAL);
  },

  /**
   * Cleanup on view change
   */
  destroy() {
    if (this._refreshTimer) {
      clearInterval(this._refreshTimer);
      this._refreshTimer = null;
    }
  },

  _getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 17) return 'Selamat Siang';
    return 'Selamat Malam';
  },

  _loadSummary() {
    const el = document.getElementById('home-summary');
    if (!el) return;

    const market = CommodityService.getSimulatedMarket();
    const avgChange = market.reduce((s, c) => s + c.change, 0) / market.length;
    const totalSupply = market.reduce((s, c) => s + c.supply, 0);
    const totalDemand = market.reduce((s, c) => s + c.demand, 0);
    const activeRFQs = market.reduce((s, c) => s + c.buyOrders + c.sellOrders, 0);

    el.innerHTML = `
      <div class="summary-stat">
        <div class="summary-stat__value" style="color:${avgChange >= 0 ? 'var(--success)' : 'var(--danger)'}">
          ${avgChange >= 0 ? '+' : ''}${Formatter.percentChange(avgChange)}
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

    const data = CommodityService.getSimulatedMarket()
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
      .slice(0, 8);

    el.innerHTML = data.map(c => Cards.commodity(c)).join('');
  },

  _loadMarketMovers() {
    const el = document.getElementById('home-market-movers');
    if (!el) return;

    const movers = CommodityService.getMarketMovers(4);
    el.innerHTML = movers.map(m => Cards.marketMover(m)).join('');
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
          <div class="card" style="text-align:center;padding:var(--space-xl);">
            <div style="font-size:var(--text-sm);color:var(--text-muted);margin-bottom:var(--space-md);">No active RFQs yet</div>
            <button class="btn btn--gold btn--sm" data-action="create-rfq">Create Your First RFQ</button>
          </div>
        `;
      }
    } catch {
      el.innerHTML = `
        <div class="card" style="text-align:center;padding:var(--space-xl);">
          <div style="font-size:var(--text-sm);color:var(--text-muted);">Could not load RFQs</div>
        </div>
      `;
    }
  },

  _loadTopCompanies() {
    const el = document.getElementById('home-top-companies');
    if (!el) return;

    const companies = Config.COMPANIES.filter(c => c.verified).slice(0, 5);
    el.innerHTML = companies.map(c => Cards.company(c)).join('');
  },

  _bindActions() {
    const view = document.querySelector('.home-view');
    if (!view) return;

    view.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]');
      if (!action) return;

      const act = action.dataset.action;
      switch (act) {
        case 'create-rfq':
          if (!Auth.requireAuth()) return;
          window.location.hash = '#/rfq';
          break;
        case 'view-market':
          window.location.hash = '#/market';
          break;
        case 'my-offers':
          if (!Auth.requireAuth()) return;
          window.location.hash = '#/rfq';
          break;
        case 'messages':
          window.location.hash = '#/messages';
          break;
      }
    });
  }
};

export default HomeView;
