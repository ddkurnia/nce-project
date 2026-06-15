import { generateSparklineData, getRandomInt } from '../utils/helpers.js';
import { formatRupiah, formatPercent, formatNumber } from '../utils/formatter.js';
import { renderSparklineSVG } from './sparkline.js';

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
          ${isPositive ? '▲' : '▼'} ${formatPercent(change)}
        </span>
      </div>
      <span class="pulse-separator">•</span>
    `;
  }).join('');

  // Duplicate for seamless scroll
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

  const rows = sorted.map(c => {
    const isPositive = (c.change ?? 0) >= 0;
    const changeColor = isPositive ? 'var(--success)' : 'var(--danger)';
    return `
      <tr data-id="${c.id}" data-navigate="#/market/${c.id}">
        <td>
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:1.1rem;">${c.icon || '📦'}</span>
            <span class="font-semibold">${c.name}</span>
          </div>
        </td>
        <td class="font-mono font-bold">${formatRupiah(c.price)}</td>
        <td style="color:${changeColor};" class="font-mono font-semibold">
          ${isPositive ? '+' : ''}${(c.change ?? 0).toFixed(2)}%
        </td>
        <td class="text-secondary font-mono">${formatNumber(c.volume)}</td>
        <td class="sparkline-cell">${renderSparklineSVG(c.sparkline || [], 60, 24)}</td>
        <td>
          <button class="btn btn-sm btn-outline" data-action="view" data-id="${c.id}">Detail</button>
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
          <th data-sort="volume">Volume</th>
          <th>Chart</th>
          <th>Aksi</th>
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
          ${renderSparklineSVG(c.sparkline || [], 120, 32)}
        </div>
      </div>
    `;
  }).join('');

  return `<div class="market-grid">${cards}</div>`;
}
