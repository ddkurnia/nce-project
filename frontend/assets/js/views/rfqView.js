import { getState, setState } from '../state.js';
import { renderRequestCard } from '../components/cards.js';
import { renderRFQListSkeleton } from '../components/loading.js';
import { showSearch } from '../components/header.js';
import { generateMockRequests } from '../utils/helpers.js';
import { requestService } from '../services/requestService.js';
import { COMMODITY_TYPES } from '../constants/commodities.js';
import { REQUEST_STATUSES } from '../constants/requests.js';
import { showCreateRFQModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { isAuthenticated } from '../auth.js';
import { showLoginModal } from '../components/modal.js';

let container = null;
let currentTab = 'all'; // all | mine
let currentStatus = 'all';
let requests = [];
let myRequests = [];

export async function mount(el) {
  container = el;
  showSearch(false);

  container.innerHTML = `
    <div class="rfq-view">
      <div class="view-container">
        ${renderRFQListSkeleton()}
      </div>
    </div>
  `;

  try {
    const res = await requestService.getAll();
    requests = res.data || res || [];
  } catch {
    requests = generateMockRequests();
  }

  try {
    if (isAuthenticated()) {
      const res = await requestService.getMyRequests();
      myRequests = res.data || res || [];
    }
  } catch {
    myRequests = [];
  }

  setState('requests', requests);
  renderRFQView();
}

function renderRFQView() {
  if (!container) return;

  const filtered = filterRequests();

  container.innerHTML = `
    <div class="rfq-view">
      <div class="view-container">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
          <h2 style="font-size:1.25rem;">📋 Pusat RFQ</h2>
        </div>

        <div class="rfq-tabs">
          <button class="rfq-tab ${currentTab === 'all' ? 'active' : ''}" data-tab="all">
            Semua RFQ
          </button>
          <button class="rfq-tab ${currentTab === 'mine' ? 'active' : ''}" data-tab="mine">
            RFQ Saya
          </button>
        </div>

        <div class="rfq-filters">
          <button class="filter-chip ${currentStatus === 'all' ? 'active' : ''}" data-status="all">
            Semua
          </button>
          ${REQUEST_STATUSES.map(s => `
            <button class="filter-chip ${currentStatus === s.key ? 'active' : ''}"
                    data-status="${s.key}">
              ${s.label}
            </button>
          `).join('')}
        </div>

        <div class="rfq-list">
          ${filtered.length > 0 ?
            filtered.map(r => renderRequestCard(r)).join('') :
            renderEmptyRFQ()
          }
        </div>
      </div>

      <button class="fab" id="create-rfq-btn" aria-label="Buat RFQ">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
    </div>
  `;

  attachEventListeners();
}

function filterRequests() {
  const source = currentTab === 'mine' ? myRequests : requests;
  if (currentStatus === 'all') return source;
  return source.filter(r => r.status === currentStatus);
}

function renderEmptyRFQ() {
  return `
    <div class="empty-state">
      <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
      <h4>Belum ada RFQ</h4>
      <p>Buat permintaan pembelian komoditas pertama Anda</p>
    </div>
  `;
}

function attachEventListeners() {
  // Tab toggle
  container.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentTab = btn.dataset.tab;
      renderRFQView();
    });
  });

  // Status filter
  container.querySelectorAll('[data-status]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentStatus = btn.dataset.status;
      renderRFQView();
    });
  });

  // Create RFQ FAB
  const fabBtn = document.getElementById('create-rfq-btn');
  if (fabBtn) {
    fabBtn.addEventListener('click', () => {
      if (!isAuthenticated()) {
        showLoginModal();
        showToast('Silakan masuk untuk membuat RFQ', 'warning');
        return;
      }
      showCreateRFQModal();
    });
  }

  // Card navigation
  container.querySelectorAll('[data-navigate]').forEach(el => {
    el.addEventListener('click', (e) => {
      // Don't navigate if clicking a button
      if (e.target.closest('button')) return;
      const target = el.dataset.navigate;
      if (target) window.location.hash = target;
    });
  });
}

export function unmount() {
  container = null;
  showSearch(false);
}
