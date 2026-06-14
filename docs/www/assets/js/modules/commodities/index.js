/**
 * Commodities Page Module - NCE Nusantara Commodity Exchange
 * Entry point: commodities.html
 *
 * Initializes and manages the commodity marketplace: card grid, search with
 * debounce, filters by type/location, sort, pagination, detail modal,
 * and create listing button.
 */

import { getAll, getById, COMMODITY_TYPES, LOCATIONS } from '../../services/commodityService.js';
import { renderCommodityCard, renderSkeleton, renderErrorState } from '../../components/cards.js';
import { showCommodityDetail, showNotification } from '../../components/modal.js';
import {
  formatCurrency,
  formatNumber,
  formatCommodityType,
} from '../../utils/formatter.js';
import { debounce, escapeHtml, getLocalStorage, setLocalStorage } from '../../utils/helpers.js';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const state = {
  commodities: [],
  total: 0,
  pages: 1,
  currentPage: 1,
  filters: {
    search: '',
    type: '',
    location: '',
    sortBy: 'date',
    sortOrder: 'desc',
    page: 1,
    perPage: 12,
  },
  isLoading: false,
};

// ---------------------------------------------------------------------------
// DOM References
// ---------------------------------------------------------------------------

let els = {};

function getEls() {
  if (Object.keys(els).length > 0) return els;

  els = {
    commodityGrid: document.getElementById('commodity-grid'),
    searchInput: document.getElementById('commodity-search'),
    typeFilter: document.getElementById('type-filter'),
    locationFilter: document.getElementById('location-filter'),
    sortSelect: document.getElementById('sort-select'),
    paginationContainer: document.getElementById('pagination'),
    createListingBtn: document.getElementById('create-listing-btn'),
    mobileMenuBtn: document.getElementById('mobile-menu-btn'),
    mobileMenu: document.getElementById('mobile-menu'),
    resultCount: document.getElementById('result-count'),
    activeFilters: document.getElementById('active-filters'),
  };

  return els;
}

// ---------------------------------------------------------------------------
// Mobile Menu Toggle
// ---------------------------------------------------------------------------

function initMobileMenu() {
  const { mobileMenuBtn, mobileMenu } = getEls();
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }
}

// ---------------------------------------------------------------------------
// Search (with debounce)
// ---------------------------------------------------------------------------

const debouncedSearch = debounce((query) => {
  state.filters.search = query;
  state.filters.page = 1;
  state.currentPage = 1;
  loadCommodities();
}, 300);

function initSearch() {
  const { searchInput } = getEls();
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    debouncedSearch(e.target.value.trim());
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      debouncedSearch.cancel();
      state.filters.search = e.target.value.trim();
      state.filters.page = 1;
      state.currentPage = 1;
      loadCommodities();
    }
  });
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

function initFilters() {
  const { typeFilter, locationFilter, sortSelect } = getEls();

  if (typeFilter) {
    populateTypeFilter();
    typeFilter.addEventListener('change', (e) => {
      state.filters.type = e.target.value;
      state.filters.page = 1;
      state.currentPage = 1;
      loadCommodities();
      updateActiveFilters();
    });
  }

  if (locationFilter) {
    populateLocationFilter();
    locationFilter.addEventListener('change', (e) => {
      state.filters.location = e.target.value;
      state.filters.page = 1;
      state.currentPage = 1;
      loadCommodities();
      updateActiveFilters();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      const value = e.target.value;
      const [sortBy, sortOrder] = value.split('-');
      state.filters.sortBy = sortBy;
      state.filters.sortOrder = sortOrder;
      state.filters.page = 1;
      state.currentPage = 1;
      loadCommodities();
    });
  }
}

function populateTypeFilter() {
  const { typeFilter } = getEls();
  if (!typeFilter) return;

  const currentVal = typeFilter.value;
  typeFilter.innerHTML = '<option value="">Semua Jenis</option>';
  COMMODITY_TYPES.forEach(type => {
    const option = document.createElement('option');
    option.value = type.key;
    option.textContent = `${type.icon} ${type.label}`;
    if (type.key === currentVal) option.selected = true;
    typeFilter.appendChild(option);
  });
}

function populateLocationFilter() {
  const { locationFilter } = getEls();
  if (!locationFilter) return;

  const currentVal = locationFilter.value;
  locationFilter.innerHTML = '<option value="">Semua Lokasi</option>';
  LOCATIONS.forEach(loc => {
    const option = document.createElement('option');
    option.value = loc;
    option.textContent = loc;
    if (loc === currentVal) option.selected = true;
    locationFilter.appendChild(option);
  });
}

function updateActiveFilters() {
  const { activeFilters } = getEls();
  if (!activeFilters) return;

  const tags = [];

  if (state.filters.type) {
    const typeObj = COMMODITY_TYPES.find(t => t.key === state.filters.type);
    tags.push({ key: 'type', label: typeObj ? typeObj.label : state.filters.type });
  }

  if (state.filters.location) {
    tags.push({ key: 'location', label: state.filters.location });
  }

  if (state.filters.search) {
    tags.push({ key: 'search', label: `"${state.filters.search}"` });
  }

  if (tags.length === 0) {
    activeFilters.innerHTML = '';
    return;
  }

  activeFilters.innerHTML = `
    <div class="flex flex-wrap items-center gap-2 mb-4">
      ${tags.map(tag => `
        <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-navy-700/50 border border-slate-600/50 rounded-full text-xs text-slate-300">
          ${escapeHtml(tag.label)}
          <button class="filter-remove-btn text-slate-500 hover:text-white transition-colors" data-filter-key="${tag.key}">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </span>
      `).join('')}
      <button class="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium clear-all-filters-btn">Hapus semua filter</button>
    </div>`;

  activeFilters.querySelectorAll('.filter-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.filterKey;
      state.filters[key] = '';
      if (key === 'type' && getEls().typeFilter) getEls().typeFilter.value = '';
      if (key === 'location' && getEls().locationFilter) getEls().locationFilter.value = '';
      if (key === 'search' && getEls().searchInput) getEls().searchInput.value = '';
      state.filters.page = 1;
      state.currentPage = 1;
      loadCommodities();
      updateActiveFilters();
    });
  });

  const clearAllBtn = activeFilters.querySelector('.clear-all-filters-btn');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      state.filters.search = '';
      state.filters.type = '';
      state.filters.location = '';
      if (getEls().searchInput) getEls().searchInput.value = '';
      if (getEls().typeFilter) getEls().typeFilter.value = '';
      if (getEls().locationFilter) getEls().locationFilter.value = '';
      state.filters.page = 1;
      state.currentPage = 1;
      loadCommodities();
      updateActiveFilters();
    });
  }
}

// ---------------------------------------------------------------------------
// Commodity Grid
// ---------------------------------------------------------------------------

function renderCommodityGrid(commodities) {
  const { commodityGrid } = getEls();
  if (!commodityGrid) return;

  if (!commodities || commodities.length === 0) {
    commodityGrid.innerHTML = `
      <div class="col-span-full flex flex-col items-center justify-center py-16 text-center">
        <svg class="w-20 h-20 text-slate-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
        </svg>
        <p class="text-slate-400 text-lg font-medium mb-1">Tidak ada komoditas ditemukan</p>
        <p class="text-slate-500 text-sm">Coba ubah filter atau kata kunci pencarian Anda</p>
      </div>`;
    return;
  }

  commodityGrid.innerHTML = commodities.map(commodity => renderCommodityCard(commodity)).join('');

  commodityGrid.querySelectorAll('[data-commodity-id]').forEach(card => {
    card.addEventListener('click', async (e) => {
      if (e.target.closest('button')) return;
      const id = card.dataset.commodityId;
      try {
        const detail = await getById(id);
        showCommodityDetail(detail);
      } catch (error) {
        showNotification('Gagal memuat detail komoditas', 'error');
      }
    });
  });
}

function showCommodityGridLoading() {
  const { commodityGrid } = getEls();
  if (!commodityGrid) return;
  commodityGrid.innerHTML = Array(8).fill(renderSkeleton('commodity')).join('');
}

function showCommodityGridError(message) {
  const { commodityGrid } = getEls();
  if (!commodityGrid) return;
  commodityGrid.innerHTML = `<div class="col-span-full">${renderErrorState(message, 'retry-commodities-btn')}</div>`;
  const retryBtn = commodityGrid.querySelector('.retry-commodities-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => loadCommodities());
  }
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

function renderPagination() {
  const { paginationContainer } = getEls();
  if (!paginationContainer) return;

  if (state.pages <= 1) {
    paginationContainer.innerHTML = '';
    return;
  }

  let buttons = '';

  buttons += `<button class="pagination-btn px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${state.currentPage === 1 ? 'bg-slate-700/30 text-slate-600 cursor-not-allowed' : 'bg-navy-800 border border-slate-700/50 text-slate-300 hover:border-emerald-500/30 hover:text-emerald-400'}" data-page="${state.currentPage - 1}" ${state.currentPage === 1 ? 'disabled' : ''}>
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
  </button>`;

  const maxVisible = 5;
  let startPage = Math.max(1, state.currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(state.pages, startPage + maxVisible - 1);
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  if (startPage > 1) {
    buttons += `<button class="pagination-btn px-3 py-1.5 rounded-lg text-xs font-medium bg-navy-800 border border-slate-700/50 text-slate-300 hover:border-emerald-500/30 hover:text-emerald-400 transition-colors" data-page="1">1</button>`;
    if (startPage > 2) {
      buttons += `<span class="px-2 text-slate-500">...</span>`;
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    const isActive = i === state.currentPage;
    buttons += `<button class="pagination-btn px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isActive ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-navy-800 border border-slate-700/50 text-slate-300 hover:border-emerald-500/30 hover:text-emerald-400'}" data-page="${i}">${i}</button>`;
  }

  if (endPage < state.pages) {
    if (endPage < state.pages - 1) {
      buttons += `<span class="px-2 text-slate-500">...</span>`;
    }
    buttons += `<button class="pagination-btn px-3 py-1.5 rounded-lg text-xs font-medium bg-navy-800 border border-slate-700/50 text-slate-300 hover:border-emerald-500/30 hover:text-emerald-400 transition-colors" data-page="${state.pages}">${state.pages}</button>`;
  }

  buttons += `<button class="pagination-btn px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${state.currentPage === state.pages ? 'bg-slate-700/30 text-slate-600 cursor-not-allowed' : 'bg-navy-800 border border-slate-700/50 text-slate-300 hover:border-emerald-500/30 hover:text-emerald-400'}" data-page="${state.currentPage + 1}" ${state.currentPage === state.pages ? 'disabled' : ''}>
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
  </button>`;

  paginationContainer.innerHTML = `
    <div class="flex items-center justify-between mt-6">
      <p class="text-xs text-slate-400">Menampilkan ${((state.currentPage - 1) * state.filters.perPage) + 1}-${Math.min(state.currentPage * state.filters.perPage, state.total)} dari ${state.total} komoditas</p>
      <div class="flex items-center gap-1">
        ${buttons}
      </div>
    </div>`;

  paginationContainer.querySelectorAll('.pagination-btn:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = parseInt(btn.dataset.page, 10);
      if (page >= 1 && page <= state.pages && page !== state.currentPage) {
        state.currentPage = page;
        state.filters.page = page;
        loadCommodities();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
}

function updateResultCount() {
  const { resultCount } = getEls();
  if (!resultCount) return;
  resultCount.textContent = `${state.total} komoditas ditemukan`;
}

// ---------------------------------------------------------------------------
// Data Loading
// ---------------------------------------------------------------------------

async function loadCommodities() {
  if (state.isLoading) return;
  state.isLoading = true;

  showCommodityGridLoading();

  try {
    const result = await getAll(state.filters);
    state.commodities = result.data;
    state.total = result.total;
    state.pages = result.pages;
    state.currentPage = result.currentPage;

    renderCommodityGrid(result.data);
    renderPagination();
    updateResultCount();
  } catch (error) {
    console.error('Failed to load commodities:', error);
    showCommodityGridError('Gagal memuat daftar komoditas');
  } finally {
    state.isLoading = false;
  }
}

// ---------------------------------------------------------------------------
// Create Listing Button
// ---------------------------------------------------------------------------

function initCreateListingButton() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('#create-listing-btn, .create-listing-btn');
    if (!btn) return;

    showNotification('Fitur tambah listing akan segera tersedia!', 'success');
  });
}

// ---------------------------------------------------------------------------
// Initialize
// ---------------------------------------------------------------------------

/**
 * Main initialization function for the Commodities page.
 * Called when the page loads.
 */
export async function initCommodities() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    await onReady();
  }
}

async function onReady() {
  console.log('NCE Commodities module initializing...');

  getEls();

  initMobileMenu();
  initSearch();
  initFilters();
  initCreateListingButton();

  await loadCommodities();
  updateActiveFilters();

  console.log('NCE Commodities module loaded');
}

// ---------------------------------------------------------------------------
// Auto-initialize when loaded as ES module
// ---------------------------------------------------------------------------

initCommodities();
