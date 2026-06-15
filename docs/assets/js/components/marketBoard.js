/**
 * Market Board — Terminal-style trading board with depth bars
 * Renders table and grid views for commodity market data
 */
import { generateSparklineData, getRandomInt } from '../utils/helpers.js';
import { formatRupiah, formatPercent, formatNumber } from '../utils/formatter.js';
import { renderSparklineSVG, renderSparklineWithVolume } from './sparkline.js';

export function renderMarketPulse(commodities) {
  if (!commodities || !commodities.length) return '';

  const items = commodities.map(c => {
    const change = c.change ?? (Math.random() - 0.4) * 6;
    const isPositive = change >= 0;
    const price = c.price ?? getRandomInt(5000, 90000);
    return `
      <div class="pulse-item">
        <span class="pulse-name">${c.icon || ''} ${c.name}</span>
        <span class="pulse-price">${formatRupiah(price)}</span>
        <span class="pulse-change ${isPositive ? 'positive' : 'negative'}">
          ${isPositive ? '+' : ''}${change.toFixed(2)}%
        </span>
      </div>
      <span class="pulse-separator">•</span>
    `;
  }).join('');

  return `
    <div class="market-pulse-bar">
      <div class="market-pulse-track">
        ${items}${items}
      </div>
    </div>
  `;
}

export function renderMarketBoardTable(commodities, sortKey = 'name', sortAsc = true) {
  if (!commodities || !commodities.length) {
    return `<div class="empty-state">
      <p>Tidak ada data komoditas</p>
    </div>`;
  }

  const sorted = [...commodities].sort((a, b) => {
    let va = a[sortKey], vb = b[sortKey];
    if (typeof va === 'string') {
      return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    }
    return sortAsc ? va - vb : vb - va;
  });

  // Find max volume for depth bar scaling
  const maxVol = Math.max(...sorted.map(c => c.volume || 0), 1);

  const rows = sorted.map(c => {
    const isPositive = (c.change ?? 0) >= 0;
    const changeColor = isPositive ? 'var(--success)' : 'var(--danger)';
    const depthPct = Math.round(((c.volume || 0) / maxVol) * 100);
    const depthFill = isPositive ? 'var(--depth-buy)' : 'var(--depth-sell)';

    return `
      <tr data-id="${c.id}" data-navigate="#/market/${c.id}">
        <td>
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-size:1rem;">${c.icon || '📦'}</span>
            <div>
              <span class="font-semibold" style="font-size:var(--text-sm);">${c.name}</span>
              <div class="data-label" style="margin-top:1px;">Vol ${formatNumber(c.volume)}</div>
            </div>
          </div>
        </td>
        <td>
          <span class="font-data font-bold" style="font-size:var(--text-sm);">${formatRupiah(c.price)}</span>
        </td>
        <td>
          <span class="font-data font-semibold" style="color:${changeColor};font-size:var(--text-sm);">
            ${isPositive ? '+' : ''}${(c.change ?? 0).toFixed(2)}%
          </span>
        </td>
        <td style="width:80px;">
          ${renderSparklineSVG(c.sparkline || [], 76, 20)}
        </td>
        <td style="width:60px;">
          <div class="depth-bar" style="height:20px;">
            <div class="depth-bar-fill" style="width:${depthPct}%;background:${depthFill};"></div>
            <div class="depth-bar-content">
              <span class="depth-amount">${formatNumber(c.volume)}</span>
            </div>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <table class="market-table">
      <thead>
        <tr>
          <th data-sort="name">Nama</th>
          <th data-sort="price">Harga</th>
          <th data-sort="change">Perubahan</th>
          <th>Chart</th>
          <th>Depth</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

export function renderMarketBoardGrid(commodities) {
  if (!commodities || !commodities.length) {
    return `<div class="empty-state"><p>Tidak ada data komoditas</p></div>`;
  }

  const cards = commodities.map(c => {
    const isPositive = (c.change ?? 0) >= 0;
    const changeColor = isPositive ? 'var(--success)' : 'var(--danger)';
    const mockVolumes = Array.from({ length: 12 }, () => getRandomInt(50, 500));

    return `
      <div class="commodity-card" data-id="${c.id}" data-navigate="#/market/${c.id}">
        <div class="card-header">
          <span class="icon">${c.icon || '📦'}</span>
          <span class="name">${c.name}</span>
        </div>
        <div class="card-price">${formatRupiah(c.price)}</div>
        <div class="card-change" style="color:${changeColor};">
          ${isPositive ? '▲' : '▼'} ${formatPercent(c.change)}
        </div>
        <div class="card-sparkline">
          ${renderSparklineWithVolume(c.sparkline || [], mockVolumes, 140, 44)}
        </div>
      </div>
    `;
  }).join('');

  return `<div class="market-grid">${cards}</div>`;
}
