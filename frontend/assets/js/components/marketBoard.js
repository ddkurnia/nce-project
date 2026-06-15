/**
 * Market Board — Native Compact Layout
 * Compact rows for mobile, full table for desktop
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

/**
 * Render native compact market list (mobile-first)
 */
function renderMarketList(commodities, sortKey, sortAsc) {
  const sorted = [...commodities].sort((a, b) => {
    let va = a[sortKey], vb = b[sortKey];
    if (typeof va === 'string') {
      return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    }
    return sortAsc ? va - vb : vb - va;
  });

  const nameSorted = sortKey === 'name' ? `sorted ${sortAsc ? 'asc' : ''}` : '';
  const priceSorted = sortKey === 'price' ? `sorted ${sortAsc ? 'asc' : ''}` : '';
  const changeSorted = sortKey === 'change' ? `sorted ${sortAsc ? 'asc' : ''}` : '';

  const rows = sorted.map(c => {
    const isPositive = (c.change ?? 0) >= 0;
    const changeClass = isPositive ? 'positive' : 'negative';
    const changeSign = isPositive ? '+' : '';

    return `
      <div class="market-row" data-id="${c.id}" data-navigate="#/market/${c.id}">
        <div class="row-left">
          <span class="row-icon">${c.icon || '📦'}</span>
          <div class="row-info">
            <span class="row-name">${c.name}</span>
            <span class="row-volume">Vol ${formatNumber(c.volume)}</span>
          </div>
        </div>
        <div class="row-chart">
          ${renderSparklineSVG(c.sparkline || [], 52, 20)}
        </div>
        <div class="row-right">
          <span class="row-price">${formatRupiah(c.price)}</span>
          <span class="row-change ${changeClass}">${changeSign}${(c.change ?? 0).toFixed(2)}%</span>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="market-list">
      <div class="market-list-header">
        <span class="col-name ${nameSorted}" data-sort="name">Nama</span>
        <span class="col-chart">Chart</span>
        <span class="col-price ${priceSorted}" data-sort="price">Harga</span>
        <span class="col-change ${changeSorted}" data-sort="change">%</span>
      </div>
      <div class="market-list-body">
        ${rows}
      </div>
    </div>
  `;
}

/**
 * Render full market table (desktop only)
 */
function renderMarketTable(commodities, sortKey, sortAsc) {
  const sorted = [...commodities].sort((a, b) => {
    let va = a[sortKey], vb = b[sortKey];
    if (typeof va === 'string') {
      return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    }
    return sortAsc ? va - vb : vb - va;
  });

  const maxVol = Math.max(...sorted.map(c => c.volume || 0), 1);

  const rows = sorted.map(c => {
    const isPositive = (c.change ?? 0) >= 0;
    const changeColor = isPositive ? 'var(--success)' : 'var(--danger)';
    const depthPct = Math.round(((c.volume || 0) / maxVol) * 100);
    const depthFill = isPositive
      ? 'linear-gradient(to right, var(--depth-buy), var(--depth-buy-strong))'
      : 'linear-gradient(to left, var(--depth-sell), var(--depth-sell-strong))';

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

  const nameSorted = sortKey === 'name' ? `sorted ${sortAsc ? 'asc' : ''}` : '';
  const priceSorted = sortKey === 'price' ? `sorted ${sortAsc ? 'asc' : ''}` : '';
  const changeSorted = sortKey === 'change' ? `sorted ${sortAsc ? 'asc' : ''}` : '';

  return `
    <table class="market-table">
      <thead>
        <tr>
          <th class="${nameSorted}" data-sort="name">Nama</th>
          <th class="${priceSorted}" data-sort="price">Harga</th>
          <th class="${changeSorted}" data-sort="change">Perubahan</th>
          <th>Chart</th>
          <th>Depth</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

/**
 * Main render — renders BOTH list (mobile) and table (desktop)
 * CSS media queries handle which one is visible
 */
export function renderMarketBoardTable(commodities, sortKey = 'name', sortAsc = true) {
  if (!commodities || !commodities.length) {
    return `<div class="empty-state"><p>Tidak ada data komoditas</p></div>`;
  }

  const listHTML = renderMarketList(commodities, sortKey, sortAsc);
  const tableHTML = renderMarketTable(commodities, sortKey, sortAsc);

  return listHTML + tableHTML;
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
          ${renderSparklineWithVolume(c.sparkline || [], mockVolumes, 140, 40)}
        </div>
      </div>
    `;
  }).join('');

  return `<div class="market-grid">${cards}</div>`;
}
