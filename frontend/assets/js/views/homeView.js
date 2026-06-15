/**
 * Home View — Phase 4 Bloomberg Terminal Dashboard
 * Market status, stagger animations, refined index cards
 */
import { getState, setState, subscribe } from '../state.js';
import { renderStatCard, renderRequestCard } from '../components/cards.js';
import { renderSparklineSVG } from '../components/sparkline.js';
import { renderStatGridSkeleton, renderMarketTableSkeleton } from '../components/loading.js';
import { renderMatchCard, renderMatchSummary, generateMockMatches } from '../components/businessMatch.js';
import { renderTrustMeter } from '../components/trustScore.js';
import { generateMockCommodities, generateMockRequests, timeAgo, getRandomInt } from '../utils/helpers.js';
import { formatRupiah, formatPercent, formatNumber } from '../utils/formatter.js';
import { getCommodityLabel, getCommodityIcon } from '../constants/commodities.js';
import { showSearch } from '../components/header.js';
import { commodityService } from '../services/commodityService.js';
import { requestService } from '../services/requestService.js';
import { initNotifications } from '../services/notificationService.js';

let container = null;

export async function mount(el) {
  container = el;
  showSearch(false);
  container.innerHTML = renderLoadingState();

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

    initNotifications();
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
  const topMovers = [...commodities].sort((a, b) => Math.abs(b.change ?? 0) - Math.abs(a.change ?? 0)).slice(0, 3);
  const recentRequests = requests.slice(0, 3);
  const matches = generateMockMatches();

  // Market index calculations
  const avgChange = commodities.length ? commodities.reduce((s, c) => s + (c.change ?? 0), 0) / commodities.length : 0;
  const totalVol = commodities.reduce((s, c) => s + (c.volume || 0), 0);
  const isMarketUp = avgChange >= 0;
  const gainers = commodities.filter(c => (c.change ?? 0) > 0).length;
  const losers = commodities.filter(c => (c.change ?? 0) < 0).length;

  container.innerHTML = `
    <div class="market-pulse-bar">
      <div class="market-pulse-track">
        ${renderPulseItems(commodities)}
        ${renderPulseItems(commodities)}
      </div>
    </div>
    <div class="home-view">
      <div class="view-container stagger-children">
        <!-- Greeting + Market Status -->
        <div class="greeting" style="display:flex;align-items:center;justify-content:space-between;">
          <div>
            <h1>${greeting}</h1>
            <p>Pantau pasar komoditas Indonesia secara real-time</p>
          </div>
          <span class="market-status open">
            <span class="market-status-dot"></span>
            OPEN
          </span>
        </div>

        <!-- Market Index Bar -->
        <div class="market-index-bar stagger-children">
          <div class="index-card ${isMarketUp ? 'up' : 'down'}">
            <div class="index-label">NCE Index</div>
            <div class="index-value font-mono">${isMarketUp ? '▲' : '▼'} ${avgChange.toFixed(2)}%</div>
          </div>
          <div class="index-card">
            <div class="index-label">Volume</div>
            <div class="index-value font-mono">${formatNumber(totalVol)}</div>
          </div>
          <div class="index-card up">
            <div class="index-label">Gainers</div>
            <div class="index-value font-mono" style="color:var(--success);">${gainers}</div>
          </div>
          <div class="index-card down">
            <div class="index-label">Losers</div>
            <div class="index-value font-mono" style="color:var(--danger);">${losers}</div>
          </div>
        </div>

        <!-- Stat Grid -->
        <div class="stat-grid">
          ${renderStatCard({ label: 'Listing Aktif', value: formatNumber(commodities.length), change: '+12%', changeDir: 'up', icon: '📊' })}
          ${renderStatCard({ label: 'RFQ Aktif', value: formatNumber(requests.filter(r => r.status === 'open').length), change: '+8%', changeDir: 'up', icon: '🛒' })}
          ${renderStatCard({ label: 'Penjual', value: formatNumber(gainers), change: '+5%', changeDir: 'up', icon: '🏪' })}
          ${renderStatCard({ label: 'Transaksi', value: formatNumber(Math.floor(totalVol / 100)), change: '-2%', changeDir: 'down', icon: '💰' })}
        </div>

        <!-- Top Movers — Terminal Heat Map -->
        <div class="top-movers">
          <div class="section-header">
            <h3>🔥 Top Movers</h3>
          </div>
          <div class="movers-grid">
            ${topMovers.map(c => {
              const isPositive = (c.change ?? 0) >= 0;
              const changeColor = isPositive ? 'var(--success)' : 'var(--danger)';
              const bgClass = isPositive ? 'var(--success-dim)' : 'var(--danger-dim)';
              return `
                <div class="mover-card" data-navigate="#/market/${c.id}">
                  <div class="mover-icon">${c.icon || '📦'}</div>
                  <div class="mover-info">
                    <div class="mover-name">${c.name || getCommodityLabel(c.type)}</div>
                    <div class="mover-price font-mono">${formatRupiah(c.price)}</div>
                  </div>
                  <div class="mover-change" style="color:${changeColor};background:${bgClass};">
                    ${isPositive ? '▲' : '▼'} ${formatPercent(c.change)}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Market Board Preview -->
        <div class="market-preview">
          <div class="section-header">
            <h3>📈 Market Board</h3>
            <a href="#/market" class="section-link" style="display:flex;align-items:center;gap:2px;">Lihat Semua <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></a>
          </div>
          <div class="card" style="padding:0;overflow:hidden;">
            ${renderMarketPreviewRows(topCommodities)}
          </div>
        </div>

        <!-- Business Matching -->
        <div class="business-match-section">
          <div class="section-header">
            <h3>🤝 Business Match</h3>
            <span class="section-link">Saran untuk Anda</span>
          </div>
          ${renderMatchSummary(matches)}
          <div class="match-list">
            ${matches.slice(0, 3).map(m => renderMatchCard(m)).join('')}
          </div>
        </div>

        <!-- RFQ Terbaru -->
        <div class="rfq-preview">
          <div class="section-header">
            <h3>📋 RFQ Terbaru</h3>
            <a href="#/rfq" class="section-link" style="display:flex;align-items:center;gap:2px;">Lihat Semua <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></a>
          </div>
          ${recentRequests.length > 0 ?
            recentRequests.map(r => renderRequestCard(r)).join('') :
            '<p class="text-muted" style="font-size:var(--text-xs);">Belum ada permintaan</p>'
          }
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <a href="#/rfq" class="btn btn-primary">📝 Buat RFQ</a>
          <a href="#/market" class="btn btn-secondary">📊 Lihat Market</a>
        </div>
      </div>
    </div>
  `;

  attachEventListeners();
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
          ${isPositive ? '+' : ''}${change.toFixed(2)}%
        </span>
      </div>
      <span class="pulse-separator">•</span>
    `;
  }).join('');
}

function renderMarketPreviewRows(commodities) {
  if (!commodities.length) return '<p style="padding:12px;color:var(--text-muted);font-size:var(--text-xs);">Tidak ada data</p>';

  return commodities.map(c => {
    const isPositive = (c.change ?? 0) >= 0;
    const changeColor = isPositive ? 'var(--success)' : 'var(--danger)';
    return `
      <div class="commodity-row" data-navigate="#/market/${c.id}">
        <div class="commodity-info">
          <div class="commodity-name">${c.icon || '📦'} ${c.name || getCommodityLabel(c.type)}</div>
          <div class="commodity-volume">Vol ${formatNumber(c.volume)}</div>
        </div>
        <div class="sparkline-cell">
          ${renderSparklineSVG(c.sparkline || [], 56, 18)}
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

function attachEventListeners() {
  container.querySelectorAll('[data-navigate]').forEach(el => {
    el.addEventListener('click', (e) => {
      const target = e.currentTarget.dataset.navigate;
      if (target) window.location.hash = target;
    });
  });

  container.querySelectorAll('.match-contact-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const { showToast } = await import('../components/toast.js');
      showToast('Fitur hubungi supplier segera hadir', 'info');
    });
  });
}

export function unmount() {
  container = null;
}
