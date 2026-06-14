/**
 * Nusantara Commodity Exchange (NCE) - Cards Component
 * Dark theme card components with emerald/cyan accents
 */

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Format number as Indonesian Rupiah
 * @param {number} amount
 * @returns {string}
 */
function formatIDR(amount) {
  if (amount == null || isNaN(amount)) return 'Rp 0';
  const formatted = Math.abs(amount).toLocaleString('id-ID');
  return amount < 0 ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

/**
 * Format large numbers with abbreviations
 * @param {number} num
 * @returns {string}
 */
function formatCompact(num) {
  if (num == null || isNaN(num)) return '0';
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'M';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'Jt';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'Rb';
  return num.toString();
}

/**
 * Calculate relative time string
 * @param {string|Date} dateStr
 * @returns {string}
 */
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Baru saja';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari lalu`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} bulan lalu`;
  const years = Math.floor(months / 12);
  return `${years} tahun lalu`;
}

/**
 * Get status color configuration
 * @param {string} status
 * @returns {object}
 */
function getStatusConfig(status) {
  const map = {
    active:   { bg: 'rgba(16, 185, 129, 0.15)', color: '#10B981', label: 'Aktif' },
    pending:  { bg: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', label: 'Menunggu' },
    completed:{ bg: 'rgba(6, 182, 212, 0.15)',   color: '#06B6D4', label: 'Selesai' },
    cancelled:{ bg: 'rgba(239, 68, 68, 0.15)',    color: '#EF4444', label: 'Dibatalkan' },
    accepted: { bg: 'rgba(16, 185, 129, 0.15)',   color: '#10B981', label: 'Diterima' },
    rejected: { bg: 'rgba(239, 68, 68, 0.15)',    color: '#EF4444', label: 'Ditolak' },
    expired:  { bg: 'rgba(107, 114, 128, 0.15)',  color: '#6B7280', label: 'Kedaluwarsa' },
    open:     { bg: 'rgba(16, 185, 129, 0.15)',   color: '#10B981', label: 'Terbuka' },
    closed:   { bg: 'rgba(107, 114, 128, 0.15)',  color: '#6B7280', label: 'Ditutup' }
  };
  return map[status] || { bg: 'rgba(107, 114, 128, 0.15)', color: '#6B7280', label: status };
}

// ── SVG Icons ──────────────────────────────────────────────────────────────
const icons = {
  verified: `<svg width="16" height="16" viewBox="0 0 24 24" fill="#10B981" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,

  location: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,

  volume: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`,

  trendUp: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,

  trendDown: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>`,

  offer: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,

  clock: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,

  area: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>`,

  tag: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,

  activity: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`
};

// ── Inject Styles ──────────────────────────────────────────────────────────
let stylesInjected = false;

function injectCardStyles() {
  if (stylesInjected) return;
  stylesInjected = true;

  const style = document.createElement('style');
  style.id = 'nce-cards-styles';
  style.textContent = `
    .nce-card {
      background: linear-gradient(135deg, #111827 0%, #0F172A 100%);
      border: 1px solid rgba(16, 185, 129, 0.08);
      border-radius: 16px;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    .nce-card:hover {
      border-color: rgba(16, 185, 129, 0.25);
      box-shadow: 0 0 30px rgba(16, 185, 129, 0.08), 0 8px 32px rgba(0, 0, 0, 0.3);
      transform: translateY(-2px);
    }

    .nce-card-image {
      width: 100%;
      height: 180px;
      background: linear-gradient(135deg, #1E293B, #0F172A);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }

    .nce-card-image::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, #111827 0%, transparent 60%);
    }

    .nce-card-image-placeholder {
      color: #374151;
      font-size: 48px;
    }

    .nce-card-body {
      padding: 16px 20px 20px;
    }

    .nce-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .nce-card-title {
      font-size: 16px;
      font-weight: 600;
      color: #F1F5F9;
      margin: 0;
      line-height: 1.3;
    }

    .nce-card-price {
      font-size: 18px;
      font-weight: 700;
      color: #10B981;
      margin: 0 0 12px;
    }

    .nce-card-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 12px;
    }

    .nce-card-meta-item {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 13px;
      color: #94A3B8;
    }

    .nce-card-meta-item svg {
      color: #64748B;
      flex-shrink: 0;
    }

    .nce-card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .nce-card-seller {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .nce-card-seller-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 600;
      color: white;
    }

    .nce-card-seller-name {
      font-size: 13px;
      color: #CBD5E1;
      font-weight: 500;
    }

    .nce-card-verified {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: #10B981;
      font-weight: 500;
    }

    .nce-badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .nce-badge-type {
      position: absolute;
      top: 12px;
      left: 12px;
      z-index: 1;
      background: rgba(6, 182, 212, 0.2);
      color: #06B6D4;
      backdrop-filter: blur(8px);
    }

    .nce-stat-card {
      background: linear-gradient(135deg, #111827 0%, #0F172A 100%);
      border: 1px solid rgba(16, 185, 129, 0.08);
      border-radius: 16px;
      padding: 24px;
      transition: all 0.3s ease;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    .nce-stat-card:hover {
      border-color: rgba(16, 185, 129, 0.2);
      box-shadow: 0 0 30px rgba(16, 185, 129, 0.06);
    }

    .nce-stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }

    .nce-stat-value {
      font-size: 28px;
      font-weight: 700;
      color: #F1F5F9;
      margin: 0 0 4px;
      line-height: 1;
    }

    .nce-stat-label {
      font-size: 14px;
      color: #64748B;
      margin: 0;
    }

    .nce-stat-change {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-top: 12px;
      font-size: 13px;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 6px;
    }

    .nce-stat-change.positive {
      color: #10B981;
      background: rgba(16, 185, 129, 0.1);
    }

    .nce-stat-change.negative {
      color: #EF4444;
      background: rgba(239, 68, 68, 0.1);
    }

    .nce-offer-card {
      background: linear-gradient(135deg, #111827 0%, #0F172A 100%);
      border: 1px solid rgba(16, 185, 129, 0.08);
      border-radius: 12px;
      padding: 16px 20px;
      transition: all 0.3s ease;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    .nce-offer-card:hover {
      border-color: rgba(16, 185, 129, 0.2);
      background: linear-gradient(135deg, #131C2E 0%, #0F172A 100%);
    }

    .nce-offer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .nce-offer-seller {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .nce-offer-seller-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      color: white;
    }

    .nce-offer-details {
      display: flex;
      gap: 24px;
      margin-bottom: 16px;
    }

    .nce-offer-detail {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .nce-offer-detail-label {
      font-size: 12px;
      color: #64748B;
    }

    .nce-offer-detail-value {
      font-size: 14px;
      font-weight: 600;
      color: #E2E8F0;
    }

    .nce-offer-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }

    .nce-btn-accept {
      padding: 8px 20px;
      background: linear-gradient(135deg, #10B981, #059669);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
    }

    .nce-btn-accept:hover {
      box-shadow: 0 0 16px rgba(16, 185, 129, 0.3);
    }

    .nce-btn-reject {
      padding: 8px 20px;
      background: transparent;
      color: #EF4444;
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
    }

    .nce-btn-reject:hover {
      background: rgba(239, 68, 68, 0.1);
      border-color: #EF4444;
    }

    .nce-activity-item {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 14px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    .nce-activity-item:last-child {
      border-bottom: none;
    }

    .nce-activity-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .nce-activity-content {
      flex: 1;
      min-width: 0;
    }

    .nce-activity-description {
      font-size: 14px;
      color: #CBD5E1;
      line-height: 1.5;
      margin: 0;
    }

    .nce-activity-time {
      font-size: 12px;
      color: #64748B;
      margin-top: 4px;
    }
  `;
  document.head.appendChild(style);
}

// ── Commodity Card ─────────────────────────────────────────────────────────
export function renderCommodityCard(commodity) {
  injectCardStyles();

  const {
    id = '',
    name = 'Unknown Commodity',
    price = 0,
    volume = 0,
    unit = 'kg',
    location = 'Indonesia',
    seller = {},
    verified = false,
    image = null,
    category = ''
  } = commodity;

  const sellerInitials = (seller.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const sellerColor = (() => {
    const colors = ['#10B981', '#06B6D4', '#8B5CF6', '#F59E0B', '#EF4444'];
    let h = 0;
    for (let i = 0; i < (seller.name || '').length; i++) h = (seller.name || '').charCodeAt(i) + ((h << 5) - h);
    return colors[Math.abs(h) % colors.length];
  })();

  return `
    <div class="nce-card" data-commodity-id="${id}" role="article" aria-label="Commodity: ${name}">
      <div class="nce-card-image">
        ${category ? `<span class="nce-badge nce-badge-type">${category}</span>` : ''}
        ${image
          ? `<img src="${image}" alt="${name}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;">`
          : `<span class="nce-card-image-placeholder">&#127807;</span>`
        }
      </div>
      <div class="nce-card-body">
        <div class="nce-card-header">
          <h3 class="nce-card-title">${name}</h3>
          ${verified ? `<span class="nce-card-verified">${icons.verified} Terverifikasi</span>` : ''}
        </div>
        <p class="nce-card-price">${formatIDR(price)}<span style="font-size:13px;color:#64748B;font-weight:400;">/${unit}</span></p>
        <div class="nce-card-meta">
          <span class="nce-card-meta-item">${icons.volume} ${formatCompact(volume)} ${unit}</span>
          <span class="nce-card-meta-item">${icons.location} ${location}</span>
        </div>
        <div class="nce-card-footer">
          <div class="nce-card-seller">
            <div class="nce-card-seller-avatar" style="background:${sellerColor};">${sellerInitials}</div>
            <span class="nce-card-seller-name">${seller.name || 'Unknown'}</span>
          </div>
          <a href="/commodities/${id}" style="font-size:13px;color:#10B981;text-decoration:none;font-weight:600;">Lihat Detail &rarr;</a>
        </div>
      </div>
    </div>
  `;
}

// ── Buy Request Card ───────────────────────────────────────────────────────
export function renderBuyRequestCard(request) {
  injectCardStyles();

  const {
    id = '',
    commodityType = 'Unknown',
    volumeNeeded = 0,
    unit = 'kg',
    targetPrice = 0,
    deliveryLocation = 'Indonesia',
    status = 'open',
    offerCount = 0,
    createdAt = null,
    buyer = {}
  } = request;

  const statusConfig = getStatusConfig(status);

  return `
    <div class="nce-card" data-request-id="${id}" role="article" aria-label="Buy Request: ${commodityType}">
      <div class="nce-card-body" style="padding-top:20px;">
        <div class="nce-card-header" style="margin-bottom:16px;">
          <h3 class="nce-card-title">${commodityType}</h3>
          <span class="nce-badge" style="background:${statusConfig.bg};color:${statusConfig.color};">${statusConfig.label}</span>
        </div>
        <div class="nce-card-meta" style="margin-bottom:16px;">
          <span class="nce-card-meta-item">${icons.volume} ${formatCompact(volumeNeeded)} ${unit}</span>
          <span class="nce-card-meta-item" style="color:#10B981;font-weight:600;">${formatIDR(targetPrice)}/${unit}</span>
          <span class="nce-card-meta-item">${icons.location} ${deliveryLocation}</span>
        </div>
        <div class="nce-card-footer" style="border-top:1px solid rgba(255,255,255,0.05);padding-top:12px;">
          <div style="display:flex;align-items:center;gap:12px;">
            <span class="nce-card-meta-item">${icons.offer} ${offerCount} penawaran</span>
            ${createdAt ? `<span class="nce-card-meta-item">${icons.clock} ${timeAgo(createdAt)}</span>` : ''}
          </div>
          <a href="/buy-requests/${id}" style="font-size:13px;color:#10B981;text-decoration:none;font-weight:600;">Lihat &rarr;</a>
        </div>
      </div>
    </div>
  `;
}

// ── Property Card ──────────────────────────────────────────────────────────
export function renderPropertyCard(property) {
  injectCardStyles();

  const {
    id = '',
    title = 'Untitled Property',
    price = 0,
    location = 'Indonesia',
    areaSize = 0,
    areaUnit = 'm\u00B2',
    type = 'property',
    image = null
  } = property;

  const typeLabels = {
    land: 'Tanah',
    building: 'Bangunan',
    warehouse: 'Gudang',
    farm: 'Lahan Pertanian',
    property: 'Properti'
  };
  const typeColors = {
    land: '#10B981',
    building: '#06B6D4',
    warehouse: '#8B5CF6',
    farm: '#F59E0B',
    property: '#EC4899'
  };

  const typeLabel = typeLabels[type] || type;
  const typeColor = typeColors[type] || '#64748B';

  return `
    <div class="nce-card" data-property-id="${id}" role="article" aria-label="Property: ${title}">
      <div class="nce-card-image">
        <span class="nce-badge nce-badge-type" style="background:${typeColor}22;color:${typeColor};">${typeLabel}</span>
        ${image
          ? `<img src="${image}" alt="${title}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;">`
          : `<span class="nce-card-image-placeholder">&#127968;</span>`
        }
      </div>
      <div class="nce-card-body">
        <h3 class="nce-card-title" style="margin-bottom:8px;">${title}</h3>
        <p class="nce-card-price">${formatIDR(price)}</p>
        <div class="nce-card-meta">
          <span class="nce-card-meta-item">${icons.location} ${location}</span>
          <span class="nce-card-meta-item">${icons.area} ${Number(areaSize).toLocaleString('id-ID')} ${areaUnit}</span>
        </div>
        <div style="margin-top:12px;">
          <a href="/properties/${id}" style="font-size:13px;color:#10B981;text-decoration:none;font-weight:600;">Lihat Detail &rarr;</a>
        </div>
      </div>
    </div>
  `;
}

// ── Stat Card ──────────────────────────────────────────────────────────────
export function renderStatCard(stat) {
  injectCardStyles();

  const {
    icon = '',
    value = '0',
    label = '',
    change = 0,
    changeLabel = '',
    iconBg = 'rgba(16, 185, 129, 0.12)',
    iconColor = '#10B981'
  } = stat;

  const isPositive = change >= 0;
  const changeIcon = isPositive ? icons.trendUp : icons.trendDown;
  const changeClass = isPositive ? 'positive' : 'negative';
  const changeText = isPositive ? `+${change}%` : `${change}%`;

  return `
    <div class="nce-stat-card" role="status" aria-label="${label}: ${value}">
      <div class="nce-stat-icon" style="background:${iconBg};color:${iconColor};">
        ${icon}
      </div>
      <p class="nce-stat-value">${value}</p>
      <p class="nce-stat-label">${label}</p>
      ${change !== 0 ? `
        <div class="nce-stat-change ${changeClass}">
          ${changeIcon}
          ${changeText}
          ${changeLabel ? `<span style="color:#64748B;font-weight:400;margin-left:4px;">${changeLabel}</span>` : ''}
        </div>
      ` : ''}
    </div>
  `;
}

// ── Offer Card ─────────────────────────────────────────────────────────────
export function renderOfferCard(offer) {
  injectCardStyles();

  const {
    id = '',
    sellerName = 'Unknown',
    price = 0,
    volume = 0,
    unit = 'kg',
    status = 'pending',
    deliveryTime = '',
    notes = ''
  } = offer;

  const statusConfig = getStatusConfig(status);
  const initials = sellerName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const avatarColor = (() => {
    const colors = ['#10B981', '#06B6D4', '#8B5CF6', '#F59E0B', '#EF4444'];
    let h = 0;
    for (let i = 0; i < sellerName.length; i++) h = sellerName.charCodeAt(i) + ((h << 5) - h);
    return colors[Math.abs(h) % colors.length];
  })();

  const showActions = status === 'pending';

  return `
    <div class="nce-offer-card" data-offer-id="${id}" role="article" aria-label="Offer from ${sellerName}">
      <div class="nce-offer-header">
        <div class="nce-offer-seller">
          <div class="nce-offer-seller-avatar" style="background:${avatarColor};">${initials}</div>
          <div>
            <div style="font-size:14px;font-weight:600;color:#E2E8F0;">${sellerName}</div>
            <span class="nce-badge" style="background:${statusConfig.bg};color:${statusConfig.color};font-size:11px;padding:2px 8px;">${statusConfig.label}</span>
          </div>
        </div>
      </div>
      <div class="nce-offer-details">
        <div class="nce-offer-detail">
          <span class="nce-offer-detail-label">Harga</span>
          <span class="nce-offer-detail-value" style="color:#10B981;">${formatIDR(price)}</span>
        </div>
        <div class="nce-offer-detail">
          <span class="nce-offer-detail-label">Volume</span>
          <span class="nce-offer-detail-value">${formatCompact(volume)} ${unit}</span>
        </div>
        ${deliveryTime ? `
          <div class="nce-offer-detail">
            <span class="nce-offer-detail-label">Pengiriman</span>
            <span class="nce-offer-detail-value">${deliveryTime}</span>
          </div>
        ` : ''}
      </div>
      ${notes ? `<p style="font-size:13px;color:#94A3B8;margin:0 0 12px;line-height:1.5;">${notes}</p>` : ''}
      ${showActions ? `
        <div class="nce-offer-actions">
          <button class="nce-btn-reject" data-offer-id="${id}" data-action="reject">Tolak</button>
          <button class="nce-btn-accept" data-offer-id="${id}" data-action="accept">Terima</button>
        </div>
      ` : ''}
    </div>
  `;
}

// ── Activity Item ──────────────────────────────────────────────────────────
export function renderActivityItem(activity) {
  injectCardStyles();

  const {
    icon = icons.activity,
    description = '',
    timestamp = null,
    iconBg = 'rgba(16, 185, 129, 0.12)',
    iconColor = '#10B981'
  } = activity;

  return `
    <div class="nce-activity-item" role="listitem">
      <div class="nce-activity-icon" style="background:${iconBg};color:${iconColor};">
        ${icon}
      </div>
      <div class="nce-activity-content">
        <p class="nce-activity-description">${description}</p>
        ${timestamp ? `<span class="nce-activity-time">${timeAgo(timestamp)}</span>` : ''}
      </div>
    </div>
  `;
}
