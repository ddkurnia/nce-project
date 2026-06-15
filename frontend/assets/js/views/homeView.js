import { getState, setState, subscribe } from '../state.js';
import { renderMarketPulse } from '../components/marketBoard.js';
import { renderStatCard, renderRequestCard } from '../components/cards.js';
import { renderSparklineSVG } from '../components/sparkline.js';
import { renderStatGridSkeleton, renderMarketTableSkeleton } from '../components/loading.js';
import { generateMockCommodities, generateMockRequests, timeAgo } from '../utils/helpers.js';
import { formatRupiah, formatPercent, formatNumber } from '../utils/formatter.js';
import { getCommodityLabel, getCommodityIcon } from '../constants/commodities.js';
import { getStatusLabel, getStatusBadgeClass } from '../constants/requests.js';
import { showSearch } from '../components/header.js';
import { commodityService } from '../services/commodityService.js';
import { requestService } from '../services/requestService.js';

let container = null;
let pulseContainer = null;

export async function mount(el) {
  container = el;
  showSearch(false);

  // Show loading first
  container.innerHTML = renderLoadingState();

  // Load data
  try {
    let commodities = [];
    let requests = [];

    try {
      const res = await commodityService.getAll();
      commodities = res.data || res || [];
    } catch {
      commodities = generateMockCommodities();
    }

    try {
      const res = await requestService.getAll();
      requests = res.data || res || [];
    } catch {
      requests = generateMockRequests();
    }

    setState('commodities', commodities);
    setState('requests', requests);

    renderHome(commodities, requests);
  } catch (err) {
    console.error('Home view error:', err);
    renderHome(generateMockCommodities(), generateMockRequests());
  }
}

function renderLoadingState() {
  return `
    <div class="home-view">
      <div class="view-container">
        ${renderStatGridSkeleton()}
        ${renderMarketTableSkeleton()}
      </div>
    </div>
  `;
}

function renderHome(commodities, requests) {
  if (!container) return;

  const user = getState('user');
  const greeting = user ? `Halo, ${user.displayName || 'Trader'}` : 'Lantai Digital Indonesia';

  const topCommodities = commodities.slice(0, 5);
  const openRequests = requests.filter(r => r.status === 'open');
  const recentRequests = requests.slice(0, 3);

  // Stats
  const totalListings = commodities.length;
  const activeBuyers = requests.filter(r => r.status === 'open').length;
  const activeSellers = commodities.filter(c => (c.change ?? 0) > 0).length;
  const totalTransactions = Math.floor(commodities.reduce((s, c) => s + (c.volume || 0), 0) / 100);

  container.innerHTML = `
    <div class="market-pulse-bar">
      <div class="market-pulse-track">
        ${renderPulseItems(commodities)}
        ${renderPulseItems(commodities)}
      </div>
    </div>
    <div class="home-view">
      <div class="view-container">
        <div class="greeting">
          <h1>${greeting}</h1>
          <p>Pantau pasar komoditas Indonesia secara real-time</p>
        </div>

        <div class="stat-grid">
          ${renderStatCard({ label: 'Listing Aktif', value: formatNumber(totalListings), change: '+12%', changeDir: 'up', icon: '📊' })}
          ${renderStatCard({ label: 'Pembeli Aktif', value: formatNumber(activeBuyers), change: '+8%', changeDir: 'up', icon: '🛒' })}
          ${renderStatCard({ label: 'Penjual Aktif', value: formatNumber(activeSellers), change: '+5%', changeDir: 'up', icon: '🏪' })}
          ${renderStatCard({ label: 'Transaksi Bulan Ini', value: formatNumber(totalTransactions), change: '-2%', changeDir: 'down', icon: '💰' })}
        </div>

        <div class="market-preview">
          <div class="section-header">
            <h3>📈 Market Board</h3>
            <a href="#/market" class="section-link">Lihat Semua →</a>
          </div>
          <div class="card" style="padding:0;overflow:hidden;">
            ${renderMarketPreviewRows(topCommodities)}
          </div>
        </div>

        <div class="rfq-preview">
          <div class="section-header">
            <h3>📋 RFQ Terbaru</h3>
            <a href="#/rfq" class="section-link">Lihat Semua →</a>
          </div>
          ${recentRequests.length > 0 ?
            recentRequests.map(r => renderRequestCard(r)).join('') :
            '<p class="text-muted" style="font-size:0.85rem;">Belum ada permintaan</p>'
          }
        </div>

        <div class="quick-actions">
          <a href="#/rfq" class="btn btn-primary">📝 Buat RFQ</a>
          <a href="#/market" class="btn btn-secondary">📊 Lihat Market</a>
        </div>
      </div>
    </div>
  `;

  // Attach click handlers for navigation
  container.querySelectorAll('[data-navigate]').forEach(el => {
    el.addEventListener('click', (e) => {
      const target = e.currentTarget.dataset.navigate;
      if (target) window.location.hash = target;
    });
  });
}

function renderPulseItems(commodities) {
  return commodities.map(c => {
    const change = c.change ?? 0;
    const isPositive = change >= 0;
    return `
      <div class="pulse-item">
        <span class="pulse-name">${c.icon || '📦'} ${c.name || c.type}</span>
        <span class="pulse-price">${formatRupiah(c.price)}</span>
        <span class="pulse-change ${isPositive ? 'positive' : 'negative'}">
          ${isPositive ? '▲' : '▼'} ${formatPercent(change)}
        </span>
      </div>
      <span class="pulse-separator">•</span>
    `;
  }).join('');
}

function renderMarketPreviewRows(commodities) {
  if (!commodities.length) return '<p style="padding:16px;color:var(--text-muted);">Tidak ada data</p>';

  return commodities.map(c => {
    const isPositive = (c.change ?? 0) >= 0;
    const changeColor = isPositive ? 'var(--success)' : 'var(--danger)';
    return `
      <div class="commodity-row" data-navigate="#/market/${c.id}">
        <div class="commodity-info">
          <div class="commodity-name">${c.icon || '📦'} ${c.name || getCommodityLabel(c.type)}</div>
          <div class="commodity-volume">Vol: ${formatNumber(c.volume)}</div>
        </div>
        <div class="sparkline-cell">
          ${renderSparklineSVG(c.sparkline || [], 60, 24)}
        </div>
        <div class="commodity-price">
          <div class="price">${formatRupiah(c.price)}</div>
          <div class="change" style="color:${changeColor};">
            ${isPositive ? '+' : ''}${(c.change ?? 0).toFixed(2)}%
          </div>
        </div>
      </div>
    `;
  }).join('');
}

export function unmount() {
  container = null;
}
