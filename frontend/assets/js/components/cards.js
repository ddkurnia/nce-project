import { formatRupiah, formatPercent, formatNumber, formatWeight, formatChange } from '../utils/formatter.js';
import { getCommodityLabel, getCommodityIcon } from '../constants/commodities.js';
import { getStatusLabel, getStatusBadgeClass } from '../constants/requests.js';
import { renderSparklineSVG } from './sparkline.js';
import { timeAgo } from '../utils/helpers.js';

export function renderStatCard(data) {
  const { label, value, change, changeDir, icon } = data;
  const changeClass = changeDir === 'up' ? 'positive' : changeDir === 'down' ? 'negative' : '';
  const arrow = changeDir === 'up' ? '▲' : changeDir === 'down' ? '▼' : '';

  return `
    <div class="stat-card">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div class="stat-value">${value}</div>
          <div class="stat-label">${label}</div>
        </div>
        ${icon ? `<span style="font-size:1.5rem;opacity:0.6;">${icon}</span>` : ''}
      </div>
      ${change ? `
        <div class="stat-change ${changeClass}">
          ${arrow} ${change}
        </div>
      ` : ''}
    </div>
  `;
}

export function renderCommodityCard(data) {
  const isPositive = (data.change ?? 0) >= 0;
  const changeColor = isPositive ? 'var(--success)' : 'var(--danger)';

  return `
    <div class="commodity-card" data-id="${data.id}" data-navigate="#/market/${data.id}">
      <div class="card-header">
        <span class="icon">${data.icon || getCommodityIcon(data.type)}</span>
        <span class="name">${data.name || getCommodityLabel(data.type)}</span>
      </div>
      <div class="card-price">${formatRupiah(data.price)}</div>
      <div class="card-change" style="color:${changeColor};">
        ${isPositive ? '▲' : '▼'} ${formatPercent(data.change)}
      </div>
      <div class="card-sparkline">
        ${renderSparklineSVG(data.sparkline || [], 120, 32)}
      </div>
    </div>
  `;
}

export function renderRequestCard(data) {
  const statusLabel = getStatusLabel(data.status);
  const statusBadge = getStatusBadgeClass(data.status);
  const icon = getCommodityIcon(data.commodityType);
  const name = getCommodityLabel(data.commodityType);

  return `
    <div class="rfq-card" data-id="${data.id}" data-navigate="#/rfq/${data.id}">
      <div class="rfq-header">
        <span class="rfq-commodity">${icon} ${name}</span>
        <span class="badge ${statusBadge}">${statusLabel}</span>
      </div>
      <div class="rfq-body">
        <div class="rfq-field">
          <div class="label">Volume</div>
          <div class="value">${formatWeight(data.volume)}</div>
        </div>
        <div class="rfq-field">
          <div class="label">Harga Target</div>
          <div class="value">${formatRupiah(data.targetPrice)}</div>
        </div>
        <div class="rfq-field">
          <div class="label">Penawaran</div>
          <div class="value">${data.offers ?? 0} penawaran</div>
        </div>
        <div class="rfq-field">
          <div class="label">Lokasi</div>
          <div class="value">${data.location || '-'}</div>
        </div>
      </div>
      <div class="rfq-footer">
        <span class="rfq-meta">${timeAgo(data.createdAt)}</span>
        <button class="btn btn-sm btn-outline" data-action="view" data-id="${data.id}">
          Lihat Detail
        </button>
      </div>
    </div>
  `;
}
