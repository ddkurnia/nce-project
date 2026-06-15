/* ============================================================================
 * NCE — RFQ View (Request for Quotation + Offer Center)
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
  _activeTab: 'rfq', // 'rfq' or 'offers'
  _simulatedOffers: [],

  /**
   * Render RFQ view
   */
  render() {
    return `
      <div class="rfq-view view">
        <!-- Tabs -->
        <div class="rfq-tabs">
          <button class="rfq-tab ${this._activeTab === 'rfq' ? 'active' : ''}" data-tab="rfq">RFQ List</button>
          <button class="rfq-tab ${this._activeTab === 'offers' ? 'active' : ''}" data-tab="offers">Offer Center</button>
        </div>

        <!-- RFQ Tab Content -->
        <div id="rfq-tab-content" style="${this._activeTab === 'rfq' ? '' : 'display:none;'}">
          <div class="rfq-create-bar">
            <div class="rfq-count" id="rfq-count">Loading...</div>
            <button class="btn btn--gold btn--sm" id="rfq-create-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Create RFQ
            </button>
          </div>

          <!-- Status filters -->
          <div style="display:flex;gap:var(--space-sm);margin-bottom:var(--space-lg);overflow-x:auto;scrollbar-width:none;">
            <button class="filter-chip ${this._statusFilter === 'all' ? 'active' : ''}" data-status="all">All</button>
            <button class="filter-chip ${this._statusFilter === 'open' ? 'active' : ''}" data-status="open">Open</button>
            <button class="filter-chip ${this._statusFilter === 'in_progress' ? 'active' : ''}" data-status="in_progress">In Progress</button>
            <button class="filter-chip ${this._statusFilter === 'completed' ? 'active' : ''}" data-status="completed">Completed</button>
          </div>

          <!-- RFQ List -->
          <div class="rfq-list" id="rfq-list">
            <div class="loading-container"><div class="spinner"></div></div>
          </div>
        </div>

        <!-- Offers Tab Content -->
        <div id="offers-tab-content" style="${this._activeTab === 'offers' ? '' : 'display:none;'}">
          <div style="margin-bottom:var(--space-lg);">
            <div style="font-size:var(--text-sm);color:var(--text-muted);margin-bottom:var(--space-sm);">Incoming offers for your RFQs</div>
          </div>
          <div id="offers-list">
            <div class="loading-container"><div class="spinner"></div></div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Initialize RFQ view
   */
  async init() {
    this._generateSimulatedOffers();
    await this._loadRequests();
    this._renderOffers();
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
          <div class="empty-state__title">No RFQs Found</div>
          <div class="empty-state__desc">Create your first Request for Quotation to start trading</div>
        </div>
      `;
      return;
    }

    listEl.innerHTML = filtered.map(r => Cards.rfq(r)).join('');
  },

  _generateSimulatedOffers() {
    const companies = ['PT Sawit Nusantara', 'CV Kopi Aceh Mandiri', 'PT Kakao Sulawesi', 'PT Indo Palm Resources'];
    const commodities = ['Kelapa Sawit CPO', 'Kopi Arabika', 'Kakao', 'Lada Hitam'];
    const locations = ['Riau', 'Aceh', 'Sulawesi', 'Jakarta', 'Surabaya'];

    this._simulatedOffers = companies.map((company, i) => ({
      id: `offer-${i + 1}`,
      company,
      price: Math.round(10000 + Math.random() * 90000),
      quantity: Math.round(500 + Math.random() * 9500),
      location: locations[i % locations.length],
      trust: Math.round(80 + Math.random() * 18),
      commodity: commodities[i % commodities.length],
      rfqId: `rfq-${i + 1}`,
      time: `${Math.floor(Math.random() * 24)}h ago`
    }));
  },

  _renderOffers() {
    const el = document.getElementById('offers-list');
    if (!el) return;

    if (!Auth.isLoggedIn()) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__title">Sign In Required</div>
          <div class="empty-state__desc">Login to view and manage offers for your RFQs</div>
          <button class="btn btn--gold btn--sm" id="offers-login-btn" style="margin-top:var(--space-lg);">Login</button>
        </div>
      `;
      return;
    }

    if (this._simulatedOffers.length === 0) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__title">No Offers Yet</div>
          <div class="empty-state__desc">Offers from suppliers will appear here when they respond to your RFQs</div>
        </div>
      `;
      return;
    }

    el.innerHTML = this._simulatedOffers.map(o => `
      <div class="offer-card">
        <div class="offer-card__header">
          <div class="offer-card__company">${escapeHtml(o.company)}</div>
          <div style="display:flex;align-items:center;gap:var(--space-sm);">
            <span class="badge badge--gold" style="font-size:10px;">Trust ${o.trust}</span>
            <span style="font-size:10px;color:var(--text-faint);">${o.time}</span>
          </div>
        </div>
        <div style="font-size:var(--text-sm);color:var(--text-muted);margin-bottom:var(--space-xs);">For: ${escapeHtml(o.commodity)}</div>
        <div class="offer-card__price">Rp${o.price.toLocaleString('id-ID')}/kg</div>
        <div class="offer-card__meta">
          <div class="card__metric">
            <span class="card__metric-label">Qty</span>
            <span class="card__metric-value">${o.quantity >= 1000 ? (o.quantity / 1000).toFixed(1) + ' ton' : o.quantity + ' kg'}</span>
          </div>
          <div class="card__metric">
            <span class="card__metric-label">Location</span>
            <span class="card__metric-value" style="font-family:var(--font-sans);">${escapeHtml(o.location)}</span>
          </div>
        </div>
        <div style="display:flex;gap:var(--space-sm);margin-top:var(--space-md);">
          <button class="btn btn--gold btn--sm" style="flex:1;" data-action="accept-offer">Accept</button>
          <button class="btn btn--outline btn--sm" data-action="negotiate-offer">Negotiate</button>
          <button class="btn btn--outline btn--sm" data-action="chat-supplier" data-company="${escapeHtml(o.company)}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
          </button>
        </div>
      </div>
    `).join('');
  },

  _bindEvents() {
    const view = document.querySelector('.rfq-view');
    if (!view) return;

    // Tab switching
    view.querySelectorAll('.rfq-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this._activeTab = tab.dataset.tab;
        view.querySelectorAll('.rfq-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const rfqContent = document.getElementById('rfq-tab-content');
        const offersContent = document.getElementById('offers-tab-content');

        if (rfqContent) rfqContent.style.display = this._activeTab === 'rfq' ? '' : 'none';
        if (offersContent) offersContent.style.display = this._activeTab === 'offers' ? '' : 'none';
      });
    });

    // Create RFQ button
    const createBtn = document.getElementById('rfq-create-btn');
    if (createBtn) {
      createBtn.addEventListener('click', () => {
        if (!Auth.requireAuth()) return;
        this._showCreateModal();
      });
    }

    // Status filter buttons
    view.querySelectorAll('[data-status]').forEach(btn => {
      btn.addEventListener('click', () => {
        this._statusFilter = btn.dataset.status;
        this._renderList();
        view.querySelectorAll('[data-status]').forEach(b => {
          b.classList.toggle('active', b.dataset.status === this._statusFilter);
        });
      });
    });

    // Offer actions
    view.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]');
      if (!action) return;

      const act = action.dataset.action;
      if (act === 'accept-offer') {
        Toast.success('Offer accepted! The supplier will be notified.');
      } else if (act === 'negotiate-offer') {
        Toast.info('Negotiation feature coming soon');
      } else if (act === 'chat-supplier') {
        window.location.hash = '#/messages';
      }
    });

    // Offers login button
    const loginBtn = document.getElementById('offers-login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('nce:show-auth'));
      });
    }

    // RFQ card click - show detail
    view.addEventListener('click', (e) => {
      const card = e.target.closest('.card--rfq');
      if (!card) return;
      // Don't trigger if clicking a button inside the card
      if (e.target.closest('button')) return;
      const id = card.dataset.id;
      if (id) this._showRfqDetail(id);
    });
  },

  _showCreateModal() {
    const commodityOptions = Config.COMMODITIES.map(c =>
      `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`
    ).join('');

    const content = `
      <div class="modal__handle"></div>
      <div class="modal__title">Create RFQ</div>
      <form id="create-rfq-form">
        <div class="form-group">
          <label class="form-label">Commodity</label>
          <select class="form-input form-select" name="commodityName" required>
            <option value="">Select commodity...</option>
            ${commodityOptions}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Quantity (kg)</label>
          <input type="number" class="form-input" name="quantity" placeholder="e.g. 10000" required min="1">
        </div>
        <div class="form-group">
          <label class="form-label">Target Price (Rp/kg)</label>
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
  },

  _showRfqDetail(id) {
    const rfq = this._requests.find(r => r.id === id || r._id === id);
    if (!rfq) return;

    const commodity = rfq.commodity?.name || rfq.commodityName || 'N/A';
    const status = rfq.status || 'open';
    const quantity = rfq.quantity || rfq.amount || 0;
    const targetPrice = rfq.targetPrice || rfq.budget || rfq.price || 0;
    const destination = rfq.destination || rfq.location || '-';
    const deadline = rfq.deadline || rfq.expiryDate || '-';
    const notes = rfq.notes || rfq.description || '';

    const content = `
      <div class="modal__handle"></div>
      <div class="modal__title">${escapeHtml(commodity)}</div>
      <div style="display:flex;gap:var(--space-sm);margin-bottom:var(--space-lg);">
        <span class="badge badge--${status === 'open' ? 'open' : status === 'in_progress' ? 'in_progress' : 'completed'}">${status}</span>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);margin-bottom:var(--space-lg);">
        <div class="card__metric">
          <span class="card__metric-label">Quantity</span>
          <span class="card__metric-value">${escapeHtml(Formatter.quantity(quantity))}</span>
        </div>
        <div class="card__metric">
          <span class="card__metric-label">Target Price</span>
          <span class="card__metric-value" style="color:var(--gold);">${Formatter.currency(targetPrice)}</span>
        </div>
        <div class="card__metric">
          <span class="card__metric-label">Destination</span>
          <span class="card__metric-value" style="font-family:var(--font-sans);">${escapeHtml(destination)}</span>
        </div>
        <div class="card__metric">
          <span class="card__metric-label">Deadline</span>
          <span class="card__metric-value" style="font-family:var(--font-sans);">${Formatter.date(deadline)}</span>
        </div>
      </div>

      ${notes ? `<div style="margin-bottom:var(--space-lg);"><div class="card__metric-label" style="margin-bottom:4px;">Notes</div><div style="font-size:var(--text-sm);color:var(--text-secondary);">${escapeHtml(notes)}</div></div>` : ''}

      <div style="display:flex;gap:var(--space-sm);">
        <button class="btn btn--gold btn--sm" style="flex:1;">Submit Offer</button>
        <button class="btn btn--outline btn--sm">Contact Buyer</button>
      </div>
    `;

    Modal.open(content);
  }
};

export default RfqView;
