/**
 * Property Exchange Page Module - NCE Nusantara Commodity Exchange
 * Entry point: property.html
 *
 * Initializes and manages the property exchange page: property cards,
 * tab switching between types (Rumah, Tanah, Ruko, Gudang), search by
 * location, price/area filters, pagination, and create listing button.
 */

import { getAll, getById, PROPERTY_TYPES } from '../../services/propertyService.js';
import { renderPropertyCard, renderSkeleton, renderErrorState } from '../../components/cards.js';
import { showNotification } from '../../components/modal.js';
import {
  formatCurrency,
  formatNumber,
  formatPropertyType,
} from '../../utils/formatter.js';
import { debounce, escapeHtml } from '../../utils/helpers.js';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const state = {
  properties: [],
  total: 0,
  pages: 1,
  currentPage: 1,
  activeType: '',
  filters: {
    type: '',
    search: '',
    location: '',
    priceMin: null,
    priceMax: null,
    areaMin: null,
    areaMax: null,
    sortBy: 'date',
    sortOrder: 'desc',
    page: 1,
    perPage: 9,
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
    propertyGrid: document.getElementById('property-grid'),
    searchInput: document.getElementById('property-search'),
    locationSearch: document.getElementById('location-search'),
    priceMinInput: document.getElementById('price-min'),
    priceMaxInput: document.getElementById('price-max'),
    areaMinInput: document.getElementById('area-min'),
    areaMaxInput: document.getElementById('area-max'),
    paginationContainer: document.getElementById('pagination'),
    createPropertyBtn: document.getElementById('create-property-btn'),
    mobileMenuBtn: document.getElementById('mobile-menu-btn'),
    mobileMenu: document.getElementById('mobile-menu'),
    resultCount: document.getElementById('result-count'),
    tabContainer: document.querySelector('.flex.gap-2, .property-tabs'),
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
// Property Type Tabs
// ---------------------------------------------------------------------------

function initTypeTabs() {
  const tabs = document.querySelectorAll('.property-tab, [data-type]');

  tabs.forEach(tab => {
    tab.addEventListener('click', function () {
      tabs.forEach(t => {
        t.classList.remove('tab-active', 'bg-emerald-500/10', 'border-emerald-500/20', 'text-emerald-400');
        t.classList.add('bg-navy-900', 'border-slate-700/50', 'text-slate-300');
      });

      this.classList.remove('bg-navy-900', 'border-slate-700/50', 'text-slate-300');
      this.classList.add('tab-active', 'bg-emerald-500/10', 'border-emerald-500/20', 'text-emerald-400');

      const type = this.getAttribute('data-type') || '';
      state.activeType = type;
      state.filters.type = type;
      state.filters.page = 1;
      state.currentPage = 1;

      loadProperties();
    });
  });

  if (tabs.length > 0 && !state.activeType) {
    const allTab = Array.from(tabs).find(t => t.getAttribute('data-type') === '' || t.getAttribute('data-type') === 'all');
    if (allTab) {
      allTab.classList.remove('bg-navy-900', 'border-slate-700/50', 'text-slate-300');
      allTab.classList.add('tab-active', 'bg-emerald-500/10', 'border-emerald-500/20', 'text-emerald-400');
    }
  }
}

// ---------------------------------------------------------------------------
// Search & Filters
// ---------------------------------------------------------------------------

function initSearch() {
  const { searchInput, locationSearch } = getEls();

  if (searchInput) {
    const debouncedSearch = debounce((query) => {
      state.filters.search = query;
      state.filters.page = 1;
      state.currentPage = 1;
      loadProperties();
    }, 300);

    searchInput.addEventListener('input', (e) => {
      debouncedSearch(e.target.value.trim());
    });
  }

  if (locationSearch) {
    const debouncedLocationSearch = debounce((query) => {
      state.filters.location = query;
      state.filters.page = 1;
      state.currentPage = 1;
      loadProperties();
    }, 300);

    locationSearch.addEventListener('input', (e) => {
      debouncedLocationSearch(e.target.value.trim());
    });
  }
}

function initPriceFilter() {
  const { priceMinInput, priceMaxInput } = getEls();

  const applyPriceFilter = debounce(() => {
    state.filters.priceMin = priceMinInput?.value ? Number(priceMinInput.value) * 1000000 : null;
    state.filters.priceMax = priceMaxInput?.value ? Number(priceMaxInput.value) * 1000000 : null;
    state.filters.page = 1;
    state.currentPage = 1;
    loadProperties();
  }, 500);

  if (priceMinInput) {
    priceMinInput.addEventListener('input', applyPriceFilter);
  }
  if (priceMaxInput) {
    priceMaxInput.addEventListener('input', applyPriceFilter);
  }
}

function initAreaFilter() {
  const { areaMinInput, areaMaxInput } = getEls();

  const applyAreaFilter = debounce(() => {
    state.filters.areaMin = areaMinInput?.value ? Number(areaMinInput.value) : null;
    state.filters.areaMax = areaMaxInput?.value ? Number(areaMaxInput.value) : null;
    state.filters.page = 1;
    state.currentPage = 1;
    loadProperties();
  }, 500);

  if (areaMinInput) {
    areaMinInput.addEventListener('input', applyAreaFilter);
  }
  if (areaMaxInput) {
    areaMaxInput.addEventListener('input', applyAreaFilter);
  }
}

// ---------------------------------------------------------------------------
// Property Grid
// ---------------------------------------------------------------------------

function renderPropertyGrid(properties) {
  const { propertyGrid } = getEls();
  if (!propertyGrid) return;

  if (!properties || properties.length === 0) {
    propertyGrid.innerHTML = `
      <div class="col-span-full flex flex-col items-center justify-center py-16 text-center">
        <svg class="w-20 h-20 text-slate-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
        </svg>
        <p class="text-slate-400 text-lg font-medium mb-1">Tidak ada properti ditemukan</p>
        <p class="text-slate-500 text-sm">Coba ubah filter atau jenis properti</p>
      </div>`;
    return;
  }

  propertyGrid.innerHTML = properties.map(property => renderPropertyCard(property)).join('');

  propertyGrid.querySelectorAll('.detail-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const propertyId = btn.dataset.propertyId;
      try {
        const detail = await getById(propertyId);
        showPropertyDetail(detail);
      } catch (error) {
        showNotification('Gagal memuat detail properti', 'error');
      }
    });
  });

  propertyGrid.querySelectorAll('[data-property-id]').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      const propertyId = card.dataset.propertyId;
      handlePropertyCardClick(propertyId);
    });
  });
}

function showPropertyGridLoading() {
  const { propertyGrid } = getEls();
  if (!propertyGrid) return;
  propertyGrid.innerHTML = Array(6).fill(renderSkeleton('property')).join('');
}

function showPropertyGridError(message) {
  const { propertyGrid } = getEls();
  if (!propertyGrid) return;
  propertyGrid.innerHTML = `<div class="col-span-full">${renderErrorState(message, 'retry-properties-btn')}</div>`;
  const retryBtn = propertyGrid.querySelector('.retry-properties-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => loadProperties());
  }
}

function handlePropertyCardClick(propertyId) {
  console.log('Property card clicked:', propertyId);
}

function showPropertyDetail(property) {
  const typeLabel = formatPropertyType(property.type);
  const priceFormatted = formatCurrency(property.price);

  const modalHtml = `
    <div id="modal-property-detail" class="fixed inset-0 z-[60] hidden items-center justify-center p-4" style="background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);">
      <div class="bg-navy-800 border border-slate-700/50 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div class="flex items-center justify-between p-5 border-b border-slate-700/50">
          <div>
            <h3 class="text-lg font-semibold text-white">${escapeHtml(property.title)}</h3>
            <p class="text-xs text-slate-400 mt-0.5">${typeLabel}</p>
          </div>
          <button class="modal-close-btn p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="p-5 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-navy-900/50 rounded-lg p-3">
              <p class="text-[10px] text-slate-500 uppercase tracking-wider">Harga</p>
              <p class="text-lg font-bold text-emerald-400">${priceFormatted}</p>
            </div>
            <div class="bg-navy-900/50 rounded-lg p-3">
              <p class="text-[10px] text-slate-500 uppercase tracking-wider">Luas</p>
              <p class="text-lg font-bold text-white">${formatNumber(property.area)} ${property.areaUnit}</p>
            </div>
            <div class="bg-navy-900/50 rounded-lg p-3">
              <p class="text-[10px] text-slate-500 uppercase tracking-wider">Lokasi</p>
              <p class="text-sm text-white">${escapeHtml(property.location)}</p>
            </div>
            <div class="bg-navy-900/50 rounded-lg p-3">
              <p class="text-[10px] text-slate-500 uppercase tracking-wider">Pemilik</p>
              <p class="text-sm text-white">${escapeHtml(property.seller)}</p>
            </div>
          </div>
          ${property.bedrooms ? `<div class="flex gap-4 text-sm text-slate-300">
            <span>${property.bedrooms} Kamar Tidur</span>
            <span>${property.bathrooms} Kamar Mandi</span>
          </div>` : ''}
          <div>
            <p class="text-xs font-medium text-slate-300 mb-2">Deskripsi</p>
            <p class="text-sm text-slate-400 leading-relaxed">${escapeHtml(property.description)}</p>
          </div>
          <div class="flex gap-3 pt-3 border-t border-slate-700/30">
            <button class="modal-close-btn flex-1 px-4 py-2.5 text-sm font-medium text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors">Tutup</button>
            <button class="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm font-semibold rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all contact-seller-btn" data-seller="${escapeHtml(property.seller)}">Hubungi Pemilik</button>
          </div>
        </div>
      </div>
    </div>`;

  let existingModal = document.getElementById('modal-property-detail');
  if (existingModal) existingModal.remove();

  document.body.insertAdjacentHTML('beforeend', modalHtml);
  const modal = document.getElementById('modal-property-detail');

  modal.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      document.body.style.overflow = '';
      modal.remove();
    });
  });

  const contactBtn = modal.querySelector('.contact-seller-btn');
  if (contactBtn) {
    contactBtn.addEventListener('click', () => {
      showNotification('Fitur hubungi pemilik akan segera tersedia!', 'success');
    });
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      document.body.style.overflow = '';
      modal.remove();
    }
  });
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

  for (let i = startPage; i <= endPage; i++) {
    const isActive = i === state.currentPage;
    buttons += `<button class="pagination-btn px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isActive ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-navy-800 border border-slate-700/50 text-slate-300 hover:border-emerald-500/30 hover:text-emerald-400'}" data-page="${i}">${i}</button>`;
  }

  buttons += `<button class="pagination-btn px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${state.currentPage === state.pages ? 'bg-slate-700/30 text-slate-600 cursor-not-allowed' : 'bg-navy-800 border border-slate-700/50 text-slate-300 hover:border-emerald-500/30 hover:text-emerald-400'}" data-page="${state.currentPage + 1}" ${state.currentPage === state.pages ? 'disabled' : ''}>
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
  </button>`;

  paginationContainer.innerHTML = `
    <div class="flex items-center justify-between mt-6">
      <p class="text-xs text-slate-400">Menampilkan ${((state.currentPage - 1) * state.filters.perPage) + 1}-${Math.min(state.currentPage * state.filters.perPage, state.total)} dari ${state.total} properti</p>
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
        loadProperties();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
}

function updateResultCount() {
  const { resultCount } = getEls();
  if (!resultCount) return;
  resultCount.textContent = `${state.total} properti ditemukan`;
}

// ---------------------------------------------------------------------------
// Data Loading
// ---------------------------------------------------------------------------

async function loadProperties() {
  if (state.isLoading) return;
  state.isLoading = true;

  showPropertyGridLoading();

  try {
    const result = await getAll(state.filters);
    state.properties = result.data;
    state.total = result.total;
    state.pages = result.pages;
    state.currentPage = result.currentPage;

    renderPropertyGrid(result.data);
    renderPagination();
    updateResultCount();
  } catch (error) {
    console.error('Failed to load properties:', error);
    showPropertyGridError('Gagal memuat daftar properti');
  } finally {
    state.isLoading = false;
  }
}

// ---------------------------------------------------------------------------
// Create Property Listing Button
// ---------------------------------------------------------------------------

function initCreatePropertyButton() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('#create-property-btn, .create-property-btn');
    if (!btn) return;
    showNotification('Fitur pasang properti akan segera tersedia!', 'success');
  });
}

// ---------------------------------------------------------------------------
// Initialize
// ---------------------------------------------------------------------------

/**
 * Main initialization function for the Property Exchange page.
 * Called when the page loads.
 */
export async function initProperty() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    await onReady();
  }
}

async function onReady() {
  console.log('NCE Property module initializing...');

  getEls();

  initMobileMenu();
  initTypeTabs();
  initSearch();
  initPriceFilter();
  initAreaFilter();
  initCreatePropertyButton();

  await loadProperties();

  console.log('NCE Property module loaded');
}

// ---------------------------------------------------------------------------
// Auto-initialize when loaded as ES module
// ---------------------------------------------------------------------------

initProperty();
