import { getState, setState } from '../state.js';
import { showSearch } from '../components/header.js';
import { showToast } from '../components/toast.js';
import { isAuthenticated } from '../auth.js';
import { showLoginModal } from '../components/modal.js';
import { generateMockRequests, getRandomInt } from '../utils/helpers.js';
import { formatRupiah, formatWeight, formatDate, formatDateTime } from '../utils/formatter.js';
import { timeAgo } from '../utils/helpers.js';
import { getCommodityLabel, getCommodityIcon } from '../constants/commodities.js';
import { getStatusLabel, getStatusBadgeClass, getStatusColor } from '../constants/requests.js';
import { requestService } from '../services/requestService.js';
import { getRouteParams } from '../router.js';

let container = null;
let request = null;
let offers = [];

export async function mount(el) {
  container = el;
  showSearch(false);

  container.innerHTML = `
    <div class="detail-view">
      <div class="view-container">
        <div class="skeleton" style="height:160px;border-radius:var(--radius-md);"></div>
        <div class="skeleton skeleton-text" style="width:60%;margin-top:16px;"></div>
        <div class="skeleton skeleton-text" style="width:40%;"></div>
      </div>
    </div>
  `;

  const params = getRouteParams();
  const id = params.id;

  try {
    const res = await requestService.getById(id);
    request = res.data || res;
  } catch {
    const mocks = generateMockRequests();
    request = mocks.find(r => r.id === id) || mocks[0];
  }

  try {
    if (id) {
      const res = await requestService.getOffers(id);
      offers = res.data || res || [];
    }
  } catch {
    offers = generateMockOffers();
  }

  renderDetail();
}

function generateMockOffers() {
  const count = getRandomInt(1, 5);
  return Array.from({ length: count }, (_, i) => ({
    id: `offer-${i + 1}`,
    supplierName: ['PT Sawit Jaya', 'CV Kopi Nusantara', 'PT Karet Mandiri', 'UD Pinang Sejahtera', 'PT Sagu Papua'][i % 5],
    price: (request?.targetPrice || 15000) + getRandomInt(-2000, 3000),
    volume: (request?.volume || 1000) + getRandomInt(-200, 500),
    location: ['Jakarta', 'Medan', 'Surabaya', 'Makassar', 'Palembang'][i % 5],
    deliveryDays: getRandomInt(3, 30),
    rating: (3.5 + Math.random() * 1.5).toFixed(1),
    createdAt: new Date(Date.now() - getRandomInt(1, 48) * 3600000).toISOString(),
    status: i === 0 ? 'best' : 'pending',
  }));
}

function renderDetail() {
  if (!container || !request) return;

  const statusLabel = getStatusLabel(request.status);
  const statusBadge = getStatusBadgeClass(request.status);
  const statusColor = getStatusColor(request.status);
  const icon = getCommodityIcon(request.commodityType);
  const label = getCommodityLabel(request.commodityType);

  const bestOffer = offers.find(o => o.status === 'best') || offers[0];

  container.innerHTML = `
    <div class="detail-view">
      <div class="view-container">
        <!-- Back Button -->
        <button class="back-btn" id="back-btn" aria-label="Kembali">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          <span>RFQ</span>
        </button>

        <!-- RFQ Header -->
        <div class="detail-header">
          <div class="detail-title-row">
            <span class="detail-icon">${icon}</span>
            <div style="flex:1;">
              <h1>RFQ ${label}</h1>
              <span class="detail-type">ID: ${request.id} • ${timeAgo(request.createdAt)}</span>
            </div>
            <span class="badge ${statusBadge}" style="font-size:0.7rem;">${statusLabel}</span>
          </div>
        </div>

        <!-- RFQ Details Card -->
        <div class="card" style="margin-bottom:16px;">
          <div class="rfq-detail-grid">
            <div class="rfq-detail-field">
              <div class="label">Komoditas</div>
              <div class="value">${icon} ${label}</div>
            </div>
            <div class="rfq-detail-field">
              <div class="label">Volume</div>
              <div class="value font-mono">${formatWeight(request.volume)}</div>
            </div>
            <div class="rfq-detail-field">
              <div class="label">Harga Target</div>
              <div class="value font-mono text-gold">${formatRupiah(request.targetPrice)}</div>
            </div>
            <div class="rfq-detail-field">
              <div class="label">Lokasi</div>
              <div class="value">${request.location || '-'}</div>
            </div>
            <div class="rfq-detail-field">
              <div class="label">Total Penawaran</div>
              <div class="value">${request.offers ?? offers.length}</div>
            </div>
            <div class="rfq-detail-field">
              <div class="label">Status</div>
              <div class="value" style="color:${statusColor};">${statusLabel}</div>
            </div>
          </div>
          ${request.description ? `
            <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);">
              <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px;">Deskripsi</div>
              <p style="font-size:0.85rem;line-height:1.6;">${request.description}</p>
            </div>
          ` : ''}
        </div>

        <!-- Best Offer (if available) -->
        ${bestOffer ? `
          <div class="card card-gold" style="margin-bottom:16px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
              <h4 style="font-size:0.9rem;color:var(--gold);">Penawaran Terbaik</h4>
              <span class="badge badge-gold">Best</span>
            </div>
            <div class="rfq-detail-grid">
              <div class="rfq-detail-field">
                <div class="label">Supplier</div>
                <div class="value">${bestOffer.supplierName}</div>
              </div>
              <div class="rfq-detail-field">
                <div class="label">Harga</div>
                <div class="value font-mono text-gold">${formatRupiah(bestOffer.price)}/kg</div>
              </div>
              <div class="rfq-detail-field">
                <div class="label">Volume Tersedia</div>
                <div class="value font-mono">${formatWeight(bestOffer.volume)}</div>
              </div>
              <div class="rfq-detail-field">
                <div class="label">Pengiriman</div>
                <div class="value">${bestOffer.deliveryDays} hari</div>
              </div>
            </div>
            <div style="margin-top:12px;">
              <button class="btn btn-primary btn-sm" id="accept-offer-btn" data-id="${bestOffer.id}">
                Terima Penawaran
              </button>
            </div>
          </div>
        ` : ''}

        <!-- All Offers -->
        ${offers.length > 0 ? `
          <div class="card" style="padding:0;overflow:hidden;margin-bottom:16px;">
            <div style="padding:12px 16px;border-bottom:1px solid var(--border);">
              <h4 style="font-size:0.9rem;">Semua Penawaran (${offers.length})</h4>
            </div>
            ${offers.map((o, i) => `
              <div class="offer-row ${o.status === 'best' ? 'offer-best' : ''}" data-id="${o.id}">
                <div class="offer-main">
                  <div class="offer-supplier">
                    <span class="offer-rank">#${i + 1}</span>
                    <div>
                      <div class="offer-name">${o.supplierName}</div>
                      <div class="offer-meta">${o.location} • Rating ${o.rating}</div>
                    </div>
                  </div>
                  <div class="offer-pricing">
                    <div class="offer-price font-mono">${formatRupiah(o.price)}/kg</div>
                    <div class="offer-delivery">${o.deliveryDays} hari pengiriman</div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="empty-state" style="padding:24px;">
            <p style="font-size:0.85rem;color:var(--text-muted);">Belum ada penawaran untuk RFQ ini</p>
          </div>
        `}

        <!-- Action Buttons -->
        <div class="detail-actions">
          <button class="btn btn-outline" id="submit-offer-btn" style="flex:1;">
            Ajukan Penawaran
          </button>
        </div>
      </div>
    </div>
  `;

  attachEventListeners();
}

function attachEventListeners() {
  // Back button
  const backBtn = document.getElementById('back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.hash = '#/rfq';
    });
  }

  // Accept best offer
  const acceptBtn = document.getElementById('accept-offer-btn');
  if (acceptBtn) {
    acceptBtn.addEventListener('click', () => {
      if (!isAuthenticated()) {
        showLoginModal();
        showToast('Silakan masuk untuk menerima penawaran', 'warning');
        return;
      }
      showToast('Penawaran diterima! Detail selanjutnya akan dikirim via email.', 'success');
    });
  }

  // Submit offer
  const submitBtn = document.getElementById('submit-offer-btn');
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      if (!isAuthenticated()) {
        showLoginModal();
        showToast('Silakan masuk untuk mengajukan penawaran', 'warning');
        return;
      }
      showToast('Fitur ajukan penawaran segera hadir', 'info');
    });
  }
}

export function unmount() {
  container = null;
  showSearch(false);
}
