/* ============================================================================
 * NCE — Market View (Market Board)
 * ============================================================================ */

import CommodityService from '../services/commodityService.js';
import MarketBoard from '../components/marketBoard.js';
import Config from '../config.js';
import { escapeHtml, debounce } from '../utils/helpers.js';

const MarketView = {
  _filter: 'All',
  _search: '',
  _data: [],

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
        <!-- Search -->
        <div class="search-bar">
          <svg class="search-bar__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="search" placeholder="Search commodities..." id="market-search" autocomplete="off">
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
    this._renderBoard();
    this._bindEvents();
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
      }, 300));
    }
  },

  /**
   * Render market board with current filters
   */
  _renderBoard() {
    const el = document.getElementById('market-board');
    if (!el) return;

    let data = [...this._data];

    // Apply search
    if (this._search) {
      data = data.filter(c => c.name.toLowerCase().includes(this._search));
    }

    // Apply type filter
    if (this._filter !== 'All') {
      const filterMap = {
        'Sawit': 'cpo', 'Kopi': 'arabica', 'Kakao': 'cocoa',
        'Rempah': ['pepper', 'clove', 'nutmeg'],
        'Kelapa': 'coconut', 'Karet': 'rubber', 'Tembakau': 'tobacco'
      };
      const matchIds = filterMap[this._filter];
      if (Array.isArray(matchIds)) {
        data = data.filter(c => matchIds.includes(c.id));
      } else if (matchIds) {
        data = data.filter(c => c.id === matchIds);
      }
    }

    el.innerHTML = MarketBoard.render(data);
  }
};

export default MarketView;
