/**
 * Buy Requests Page Module - NCE Nusantara Commodity Exchange
 * Entry point: buy-requests.html
 *
 * Initializes and manages the buy requests page: request cards, create
 * request modal, filter by status/commodity type, offer submission,
 * my requests tab, and pagination.
 */

import { getAllRequests, getRequestById, createRequest, submitOffer, getMyRequests, REQUEST_STATUSES } from '../../services/requestService.js';
import { COMMODITY_TYPES } from '../../services/commodityService.js';
import { renderBuyRequestCard, renderSkeleton, renderErrorState } from '../../components/cards.js';
import { showCreateBuyRequestForm, showOfferForm, showNotification, closeModal } from '../../components/modal.js';
import {
  formatCurrency,
  formatNumber,
  formatVolume,
  formatCommodityType,
  formatStatus,
} from '../../utils/formatter.js';
import { debounce, escapeHtml } from '../../utils/helpers.js';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const state = {
  requests: [],
  total: 0,
  pages: 1,
  currentPage: 1,
  activeTab: 'all',
  filters: {
    status: '',
    commodityType: '',
    search: '',
    page: 1,
    perPage: 10,
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
    requestGrid: document.getElementById('request-grid'),
    requestList: document.getElementById('request-list'),
    statusFilter: document.getElementById('status-filter'),
    typeFilter: document.getElementById('type-filter'),
    searchInput: document.getElementById('request-search'),
    paginationContainer: document.getElementById('pagination'),
    createBtn: document.getElementById('create-buy-request-btn'),
    modal: document.getElementById('create-request-modal'),
    closeModalBtn: document.getElementById('close-modal-btn'),
    cancelModalBtn: document.getElementById('cancel-modal-btn'),
    mobileMenuBtn: document.getElementById('mobile-menu-btn'),
    mobileMenu: document.getElementById('mobile-menu'),
    allTab: document.getElementById('tab-all'),
    myTab: document.getElementById('tab-my'),
    resultCount: document.getElementById('result-count'),
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
// Modal (Create Buy Request)
// ---------------------------------------------------------------------------

function initModal() {
  const { createBtn, modal, closeModalBtn, cancelModalBtn } = getEls();

  if (createBtn) {
    createBtn.addEventListener('click', () => {
      showCreateBuyRequestForm(async (formData) => {
        const result = await createRequest(formData);
        showNotification('Permintaan beli berhasil dibuat!', 'success');
        await loadRequests();
        return result;
      });
    });
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => closeModal(modal));
  }

  if (cancelModalBtn) {
    cancelModalBtn.addEventListener('click', () => closeModal(modal));
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal);
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal(modal);
  });
}

// ---------------------------------------------------------------------------
// Tabs (All / My Requests)
// ---------------------------------------------------------------------------

function initTabs() {
  const { allTab, myTab } = getEls();

  if (allTab) {
    allTab.addEventListener('click', () => {
      state.activeTab = 'all';
      state.filters.page = 1;
      state.currentPage = 1;
      updateTabUI();
      loadRequests();
    });
  }

  if (myTab) {
    myTab.addEventListener('click', () => {
      state.activeTab = 'my';
      state.filters.page = 1;
      state.currentPage = 1;
      updateTabUI();
      loadMyRequests();
    });
  }
}

function updateTabUI() {
  const { allTab, myTab } = getEls();

  [allTab, myTab].forEach(tab => {
    if (!tab) return;
    tab.classList.remove('bg-emerald-500/10', 'border-emerald-500/20', 'text-emerald-400');
    tab.classList.add('bg-navy-900', 'border-slate-700/50', 'text-slate-400');
  });

  const activeTab = state.activeTab === 'all' ? allTab : myTab;
  if (activeTab) {
    activeTab.classList.remove('bg-navy-900', 'border-slate-700/50', 'text-slate-400');
    activeTab.classList.add('bg-emerald-500/10', 'border-emerald-500/20', 'text-emerald-400');
  }
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

function initFilters() {
  const { statusFilter, typeFilter, searchInput } = getEls();

  if (statusFilter) {
    populateStatusFilter();
    statusFilter.addEventListener('change', (e) => {
      state.filters.status = e.target.value;
      state.filters.page = 1;
      state.currentPage = 1;
      loadRequests();
    });
  }

  if (typeFilter) {
    populateTypeFilter();
    typeFilter.addEventListener('change', (e) => {
      state.filters.commodityType = e.target.value;
      state.filters.page = 1;
      state.currentPage = 1;
      loadRequests();
    });
  }

  if (searchInput) {
    const debouncedSearch = debounce((query) => {
      state.filters.search = query;
      state.filters.page = 1;
      state.currentPage = 1;
      loadRequests();
    }, 300);

    searchInput.addEventListener('input', (e) => {
      debouncedSearch(e.target.value.trim());
    });
  }
}

function populateStatusFilter() {
  const { statusFilter } = getEls();
  if (!statusFilter) return;

  const currentVal = statusFilter.value;
  statusFilter.innerHTML = '<option value="">Semua Status</option>';
  REQUEST_STATUSES.forEach(status => {
    const option = document.createElement('option');
    option.value = status.key;
    option.textContent = status.label;
    if (status.key === currentVal) option.selected = true;
    statusFilter.appendChild(option);
  });
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

// ---------------------------------------------------------------------------
// Request Cards
// ---------------------------------------------------------------------------

function renderRequestGrid(requests) {
  const { requestGrid, requestList } = getEls();
  const container = requestGrid || requestList;
  if (!container) return;

  if (!requests || requests.length === 0) {
    container.innerHTML = `
      <div class="col-span-full flex flex-col items-center justify-center py-16 text-center">
        <svg class="w-20 h-20 text-slate-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/>
        </svg>
        <p class="text-slate-400 text-lg font-medium mb-1">Tidak ada permintaan beli ditemukan</p>
        <p class="text-slate-500 text-sm">Coba ubah filter atau buat permintaan baru</p>
      </div>`;
    return;
  }

  container.innerHTML = requests.map(request => renderBuyRequestCard(request)).join('');

  container.querySelectorAll('.offer-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const requestId = btn.dataset.requestId;
      try {
        const request = await getRequestById(requestId);
        showOfferForm(request, async (offerData) => {
          const result = await submitOffer(requestId, offerData);
          showNotification('Penawaran berhasil dikirim!', 'success');
          await loadRequests();
          return result;
        });
      } catch (error) {
        showNotification('Gagal memuat detail permintaan', 'error');
      }
    });
  });

  container.querySelectorAll('[data-request-id]').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      const requestId = card.dataset.requestId;
      handleRequestCardClick(requestId);
    });
  });
}

function showRequestGridLoading() {
  const { requestGrid, requestList } = getEls();
  const container = requestGrid || requestList;
  if (!container) return;
  container.innerHTML = Array(4).fill(renderSkeleton('buyRequest')).join('');
}

function showRequestGridError(message) {
  const { requestGrid, requestList } = getEls();
  const container = requestGrid || requestList;
  if (!container) return;
  container.innerHTML = `<div class="col-span-full">${renderErrorState(message, 'retry-requests-btn')}</div>`;
  const retryBtn = container.querySelector('.retry-requests-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => loadRequests());
  }
}

function handleRequestCardClick(requestId) {
  console.log('Request card clicked:', requestId);
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

  for (let i = 1; i <= state.pages; i++) {
    const isActive = i === state.currentPage;
    buttons += `<button class="pagination-btn px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isActive ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-navy-800 border border-slate-700/50 text-slate-300 hover:border-emerald-500/30 hover:text-emerald-400'}" data-page="${i}">${i}</button>`;
  }

  buttons += `<button class="pagination-btn px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${state.currentPage === state.pages ? 'bg-slate-700/30 text-slate-600 cursor-not-allowed' : 'bg-navy-800 border border-slate-700/50 text-slate-300 hover:border-emerald-500/30 hover:text-emerald-400'}" data-page="${state.currentPage + 1}" ${state.currentPage === state.pages ? 'disabled' : ''}>
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
  </button>`;

  paginationContainer.innerHTML = `
    <div class="flex items-center justify-between mt-6">
      <p class="text-xs text-slate-400">Menampilkan ${((state.currentPage - 1) * state.filters.perPage) + 1}-${Math.min(state.currentPage * state.filters.perPage, state.total)} dari ${state.total} permintaan</p>
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
        loadRequests();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
}

function updateResultCount() {
  const { resultCount } = getEls();
  if (!resultCount) return;
  resultCount.textContent = `${state.total} permintaan beli ditemukan`;
}

// ---------------------------------------------------------------------------
// Data Loading
// ---------------------------------------------------------------------------

async function loadRequests() {
  if (state.isLoading) return;
  state.isLoading = true;

  showRequestGridLoading();

  try {
    const result = await getAllRequests(state.filters);
    state.requests = result.data;
    state.total = result.total;
    state.pages = result.pages;
    state.currentPage = result.currentPage;

    renderRequestGrid(result.data);
    renderPagination();
    updateResultCount();
  } catch (error) {
    console.error('Failed to load buy requests:', error);
    showRequestGridError('Gagal memuat daftar permintaan beli');
  } finally {
    state.isLoading = false;
  }
}

async function loadMyRequests() {
  if (state.isLoading) return;
  state.isLoading = true;

  showRequestGridLoading();

  try {
    const result = await getMyRequests(state.filters);
    state.requests = result.data;
    state.total = result.total;
    state.pages = result.pages;
    state.currentPage = result.currentPage;

    renderRequestGrid(result.data);
    renderPagination();
    updateResultCount();
  } catch (error) {
    console.error('Failed to load my buy requests:', error);
    showRequestGridError('Gagal memuat permintaan beli Anda');
  } finally {
    state.isLoading = false;
  }
}

// ---------------------------------------------------------------------------
// Initialize
// ---------------------------------------------------------------------------

/**
 * Main initialization function for the Buy Requests page.
 * Called when the page loads.
 */
export async function initBuyRequests() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    await onReady();
  }
}

async function onReady() {
  console.log('NCE Buy Requests module initializing...');

  getEls();

  initMobileMenu();
  initModal();
  initTabs();
  initFilters();

  await loadRequests();

  console.log('NCE Buy Requests module loaded');
}

// ---------------------------------------------------------------------------
// Auto-initialize when loaded as ES module
// ---------------------------------------------------------------------------

initBuyRequests();
