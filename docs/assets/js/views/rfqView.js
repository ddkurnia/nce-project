/* ============================================================================
 * NCE — RFQ View (Request for Quotation)
 * ============================================================================ */

import RequestService from '../services/requestService.js';
import Auth from '../auth.js';
import Cards from '../components/cards.js';
import Modal from '../components/modal.js';
import Toast from '../components/toast.js';
import { escapeHtml } from '../utils/helpers.js';

const RfqView = {
  _requests: [],
  _statusFilter: 'all',

  /**
   * Render RFQ view
   */
  render() {
    return `
      <div class="rfq-view view">
        <div class="rfq-create-bar">
          <div class="rfq-count" id="rfq-count">Loading...</div>
          <button class="btn btn--gold btn--sm" id="rfq-create-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Create RFQ
          </button>
        </div>

        <!-- Status filters -->
        <div style="display:flex;gap:8px;margin-bottom:16px;overflow-x:auto;scrollbar-width:none;">
          <button class="filter-chip ${this._statusFilter === 'all' ? 'active' : ''}" data-status="all" style="padding:6px 16px;border-radius:9999px;font-size:13px;font-weight:500;white-space:nowrap;border:1px solid var(--border);color:var(--text-muted);min-height:32px;background:${this._statusFilter === 'all' ? 'var(--gold-glow)' : 'transparent'};border-color:${this._statusFilter === 'all' ? 'var(--gold)' : 'var(--border)'};">All</button>
          <button class="filter-chip ${this._statusFilter === 'open' ? 'active' : ''}" data-status="open" style="padding:6px 16px;border-radius:9999px;font-size:13px;font-weight:500;white-space:nowrap;border:1px solid var(--border);color:var(--text-muted);min-height:32px;background:${this._statusFilter === 'open' ? 'var(--gold-glow)' : 'transparent'};border-color:${this._statusFilter === 'open' ? 'var(--gold)' : 'var(--border)'};">Open</button>
          <button class="filter-chip ${this._statusFilter === 'in_progress' ? 'active' : ''}" data-status="in_progress" style="padding:6px 16px;border-radius:9999px;font-size:13px;font-weight:500;white-space:nowrap;border:1px solid var(--border);color:var(--text-muted);min-height:32px;background:${this._statusFilter === 'in_progress' ? 'var(--gold-glow)' : 'transparent'};border-color:${this._statusFilter === 'in_progress' ? 'var(--gold)' : 'var(--border)'};">In Progress</button>
        </div>

        <!-- RFQ List -->
        <div class="rfq-list" id="rfq-list">
          <div class="loading-container">
            <div class="spinner"></div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Initialize RFQ view
   */
  async init() {
    await this._loadRequests();
    this._bindEvents();
  },

  async _loadRequests() {
    const listEl = document.getElementById('rfq-list');
    const countEl = document.getElementById('rfq-count');

    try {
      this._requests = await RequestService.fetchAll({ limit: 50 });
    } catch {
      this._requests = [];
    }

    if (countEl) {
      countEl.textContent = `${this._requests.length} Request${this._requests.length !== 1 ? 's' : ''}`;
    }

    this._renderList();
  },

  _renderList() {
    const listEl = document.getElementById('rfq-list');
    if (!listEl) return;

    let filtered = [...this._requests];
    if (this._statusFilter !== 'all') {
      filtered = filtered.filter(r => (r.status || 'open') === this._statusFilter);
    }

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">📋</div>
          <div class="empty-state__title">No RFQs Found</div>
          <div class="empty-state__desc">Create your first Request for Quotation to start trading</div>
        </div>
      `;
      return;
    }

    listEl.innerHTML = filtered.map(r => Cards.rfq(r)).join('');
  },

  _bindEvents() {
    // Create RFQ button
    const createBtn = document.getElementById('rfq-create-btn');
    if (createBtn) {
      createBtn.addEventListener('click', () => {
        if (!Auth.requireAuth()) return;
        this._showCreateModal();
      });
    }

    // Status filter buttons
    const filterBtns = document.querySelectorAll('[data-status]');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this._statusFilter = btn.dataset.status;
        this._renderList();
        // Update chip styles
        filterBtns.forEach(b => {
          b.style.background = b.dataset.status === this._statusFilter ? 'var(--gold-glow)' : 'transparent';
          b.style.borderColor = b.dataset.status === this._statusFilter ? 'var(--gold)' : 'var(--border)';
        });
      });
    });
  },

  _showCreateModal() {
    const content = `
      <div class="modal__title">Create RFQ</div>
      <form id="create-rfq-form">
        <div class="form-group">
          <label class="form-label">Commodity Name</label>
          <input type="text" class="form-input" name="commodityName" placeholder="e.g. Kelapa Sawit CPO" required>
        </div>
        <div class="form-group">
          <label class="form-label">Quantity (kg)</label>
          <input type="number" class="form-input" name="quantity" placeholder="e.g. 10000" required min="1">
        </div>
        <div class="form-group">
          <label class="form-label">Target Price (Rp)</label>
          <input type="number" class="form-input" name="targetPrice" placeholder="e.g. 12500" required min="0">
        </div>
        <div class="form-group">
          <label class="form-label">Destination</label>
          <input type="text" class="form-input" name="destination" placeholder="e.g. Jakarta">
        </div>
        <div class="form-group">
          <label class="form-label">Deadline</label>
          <input type="date" class="form-input" name="deadline">
        </div>
        <div class="form-group">
          <label class="form-label">Notes</label>
          <textarea class="form-input" name="notes" rows="3" placeholder="Additional requirements..."></textarea>
        </div>
        <button type="submit" class="btn btn--gold btn--full">Submit RFQ</button>
      </form>
    `;

    const overlay = Modal.open(content, {
      onOpen: (el) => {
        const form = el.querySelector('#create-rfq-form');
        if (form) {
          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(form);
            const data = Object.fromEntries(fd.entries());

            try {
              await RequestService.create(data);
              Toast.success('RFQ created successfully!');
              Modal.close();
              await this._loadRequests();
            } catch (err) {
              Toast.error(err.message || 'Failed to create RFQ');
            }
          });
        }
      }
    });
  }
};

export default RfqView;
