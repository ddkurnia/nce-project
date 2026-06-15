import { getState, setState } from '../state.js';
import { renderMarketBoardTable, renderMarketBoardGrid } from '../components/marketBoard.js';
import { renderSkeleton } from '../components/loading.js';
import { showSearch } from '../components/header.js';
import { generateMockCommodities } from '../utils/helpers.js';
import { commodityService } from '../services/commodityService.js';
import { COMMODITY_TYPES } from '../constants/commodities.js';

let container = null;
let currentView = 'list'; // list | grid
let currentFilter = 'semua';
let currentSort = { key: 'name', asc: true };
let searchQuery = '';
let commodities = [];

export async function mount(el) {
  container = el;
  showSearch(true);

  container.innerHTML = `
    <div class="market-view">
      <div class="view-container">
        ${renderSkeleton('card', 3)}
      </div>
    </div>
  `;

  try {
    const res = await commodityService.getAll();
    commodities = res.data || res || [];
  } catch {
    commodities = generateMockCommodities();
  }

  setState('commodities', commodities);
  renderMarketView();
}

function renderMarketView() {
  if (!container) return;

  const filtered = filterCommodities();
  const filterTabs = renderFilterTabs();
  const board = currentView === 'list'
    ? renderMarketBoardTable(filtered, currentSort.key, currentSort.asc)
    : renderMarketBoardGrid(filtered);

  container.innerHTML = `
    <div class="market-view">
      <div class="view-container">
        <div class="filter-tabs">${filterTabs}</div>
        <div class="view-toggle">
          <button class="${currentView === 'list' ? 'active' : ''}" data-view="list" aria-label="Tampilan tabel">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          </button>
          <button class="${currentView === 'grid' ? 'active' : ''}" data-view="grid" aria-label="Tampilan grid">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          </button>
        </div>
        ${board}
      </div>
    </div>
  `;

  attachEventListeners();
}

function renderFilterTabs() {
  const tabs = [
    { key: 'semua', label: 'Semua' },
    ...COMMODITY_TYPES.map(c => ({ key: c.key, label: `${c.icon} ${c.label}` })),
  ];

  return tabs.map(t => `
    <button class="tab-item ${currentFilter === t.key ? 'active' : ''}"
            data-filter="${t.key}">${t.label}</button>
  `).join('');
}

function filterCommodities() {
  let result = [...commodities];

  // Type filter
  if (currentFilter !== 'semua') {
    result = result.filter(c => c.type === currentFilter || c.key === currentFilter);
  }

  // Search filter
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    result = result.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.type || '').toLowerCase().includes(q)
    );
  }

  return result;
}

function attachEventListeners() {
  // View toggle
  container.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentView = btn.dataset.view;
      renderMarketView();
    });
  });

  // Filter tabs
  container.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.filter;
      renderMarketView();
    });
  });

  // Sort headers
  container.querySelectorAll('[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (currentSort.key === key) {
        currentSort.asc = !currentSort.asc;
      } else {
        currentSort = { key, asc: true };
      }
      renderMarketView();
    });
  });

  // Commodity row/card click
  container.querySelectorAll('[data-navigate]').forEach(el => {
    el.addEventListener('click', () => {
      const target = el.dataset.navigate;
      if (target) window.location.hash = target;
    });
  });

  // Search listener
  const searchInput = document.getElementById('header-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderMarketView();
    });
  }
}

export function unmount() {
  container = null;
  showSearch(false);
}
