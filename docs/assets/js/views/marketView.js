/* ============================================================================
 * NCE — Market View (Trading Floor Board)
 * Bloomberg/TradingView-style commodity trading board
 * ============================================================================ */

import CommodityService from '../services/commodityService.js';
import MarketBoard from '../components/marketBoard.js';
import Config from '../config.js';
import { escapeHtml, debounce } from '../utils/helpers.js';
import Formatter from '../utils/formatter.js';

const MarketView = {
  _filter: 'All',
  _search: '',
  _data: [],
  _refreshTimer: null,
  _viewMode: 'full',  // 'full' or 'compact'

  /**
   * Render market view
   */
  render() {
    const filterChips = Config.COMMODITY_TYPES.map(type => {
      const active = type === this._filter ? 'active' : '';
      return `<button class="filter-chip ${active}" data-filter="${escapeHtml(type)}">${escapeHtml(type)}</button>`;
    }).join('');

    return `
      <div class="market-view view">
        <!-- Header -->
        <div class="market-header">
          <div>
            <div class="market-header__title">Trading Floor</div>
            <div class="market-status market-status--open">
              <div class="header-market-status__dot"></div>
              Market Open
            </div>
          </div>
          <div style="display:flex;gap:var(--space-xs);">
            <button class="btn btn--outline btn--xs" id="market-view-toggle" title="Toggle view">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            </button>
          </div>
        </div>

        <!-- Market Stats Bar -->
        <div class="market-stats" id="market-stats">
          <div class="market-stat">
            <div class="market-stat__value" style="color:var(--success);" id="stat-gainers">-</div>
            <div class="market-stat__label">Gainers</div>
          </div>
          <div class="market-stat">
            <div class="market-stat__value" style="color:var(--danger);" id="stat-losers">-</div>
            <div class="market-stat__label">Losers</div>
          </div>
          <div class="market-stat">
            <div class="market-stat__value" style="color:var(--gold);" id="stat-volume">-</div>
            <div class="market-stat__label">Volume</div>
          </div>
          <div class="market-stat">
            <div class="market-stat__value" style="color:var(--info);" id="stat-spread">-</div>
            <div class="market-stat__label">Avg Spread</div>
          </div>
        </div>

        <!-- Search -->
        <div class="search-bar">
          <svg class="search-bar__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="search" placeholder="Search commodity..." id="market-search" autocomplete="off">
        </div>

        <!-- Filters -->
        <div class="market-filters" id="market-filters">
          ${filterChips}
        </div>

        <!-- Board -->
        <div id="market-board">
          <div class="loading-container">
            <div class="spinner"></div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Initialize market view
   */
  async init() {
    this._data = CommodityService.getSimulatedMarket();
    this._renderStats();
    this._renderBoard();
    this._bindEvents();

    // Auto-refresh
    this._refreshTimer = setInterval(() => {
      if (!document.hidden) {
        this._data = CommodityService.getSimulatedMarket();
        this._renderStats();
        this._renderBoard();
      }
    }, Config.MARKET_REFRESH_INTERVAL);
  },

  /**
   * Cleanup
   */
  destroy() {
    if (this._refreshTimer) {
      clearInterval(this._refreshTimer);
      this._refreshTimer = null;
    }
  },

  /**
   * Render market statistics
   */
  _renderStats() {
    const gainersEl = document.getElementById('stat-gainers');
    const losersEl = document.getElementById('stat-losers');
    const volumeEl = document.getElementById('stat-volume');
    const spreadEl = document.getElementById('stat-spread');

    const gainers = this._data.filter(c => c.change > 0).length;
    const losers = this._data.filter(c => c.change < 0).length;
    const totalVolume = this._data.reduce((s, c) => s + (c.buyOrders || 0) + (c.sellOrders || 0), 0);
    const avgSpread = this._data.length > 0
      ? this._data.reduce((s, c) => s + Math.abs(c.change), 0) / this._data.length
      : 0;

    if (gainersEl) gainersEl.textContent = gainers;
    if (losersEl) losersEl.textContent = losers;
    if (volumeEl) volumeEl.textContent = Formatter.number(totalVolume);
    if (spreadEl) spreadEl.textContent = avgSpread.toFixed(2) + '%';
  },

  /**
   * Bind events
   */
  _bindEvents() {
    // Filter chips
    const filters = document.getElementById('market-filters');
    if (filters) {
      filters.addEventListener('click', (e) => {
        const chip = e.target.closest('.filter-chip');
        if (!chip) return;
        this._filter = chip.dataset.filter;
        filters.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this._renderBoard();
      });
    }

    // Search
    const searchInput = document.getElementById('market-search');
    if (searchInput) {
      searchInput.addEventListener('input', debounce((e) => {
        this._search = e.target.value.toLowerCase();
        this._renderBoard();
      }, 250));
    }

    // View toggle
    const toggleBtn = document.getElementById('market-view-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this._viewMode = this._viewMode === 'full' ? 'compact' : 'full';
        this._renderBoard();
      });
    }
  },

  /**
   * Render market board
   */
  _renderBoard() {
    const el = document.getElementById('market-board');
    if (!el) return;

    let data = [...this._data];

    // Apply search
    if (this._search) {
      data = data.filter(c =>
        c.name.toLowerCase().includes(this._search) ||
        (c.code && c.code.toLowerCase().includes(this._search)) ||
        c.id.toLowerCase().includes(this._search)
      );
    }

    // Apply type filter
    if (this._filter !== 'All') {
      const filterMap = {
        'Sawit': ['cpo', 'palm-oil'],
        'Kopi': ['arabica', 'robusta'],
        'Kakao': ['cocoa'],
        'Rempah': ['pepper', 'clove', 'nutmeg', 'betelnut', 'cinnamon', 'ginger'],
        'Kelapa': ['coconut'],
        'Karet': ['rubber'],
        'Tembakau': ['tobacco']
      };
      const matchIds = filterMap[this._filter];
      if (matchIds) {
        data = data.filter(c => matchIds.includes(c.id));
      }
    }

    // Sort by absolute change (movers first)
    data.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

    if (this._viewMode === 'compact') {
      el.innerHTML = MarketBoard.renderCompact(data);
    } else {
      el.innerHTML = MarketBoard.render(data);
    }
  }
};

export default MarketView;
