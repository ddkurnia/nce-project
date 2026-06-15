/**
 * Market Detail View — Bloomberg-style commodity detail with chart
 * Terminal-style chart with grid lines, volume bars, crosshair
 */
import { getState, setState } from '../state.js';
import { showSearch } from '../components/header.js';
import { renderSparklineSVG } from '../components/sparkline.js';
import { showToast } from '../components/toast.js';
import { isAuthenticated } from '../auth.js';
import { showLoginModal } from '../components/modal.js';
import { generateMockCommodities, generateSparklineData, getRandomInt } from '../utils/helpers.js';
import { formatRupiah, formatPercent, formatNumber, formatWeight, formatDate } from '../utils/formatter.js';
import { getCommodityLabel, getCommodityIcon } from '../constants/commodities.js';
import { commodityService } from '../services/commodityService.js';
import { requestService } from '../services/requestService.js';
import { getRouteParams } from '../router.js';

let container = null;
let commodity = null;
let activePeriod = '1W';
let mockChartData = {};
let mockVolumes = {};

const PERIODS = [
  { key: '1D', label: '1H' },
  { key: '1W', label: '1W' },
  { key: '1M', label: '1M' },
  { key: '3M', label: '3M' },
  { key: '1Y', label: '1Y' },
  { key: 'ALL', label: 'ALL' },
];

export async function mount(el) {
  container = el;
  showSearch(false);

  container.innerHTML = `
    <div class="detail-view">
      <div class="view-container">
        <div class="skeleton" style="height:200px;border-radius:var(--radius-md);"></div>
        <div class="skeleton skeleton-text" style="width:60%;margin-top:12px;"></div>
        <div class="skeleton skeleton-text" style="width:40%;"></div>
      </div>
    </div>
  `;

  const params = getRouteParams();
  const id = params.id;

  try {
    const res = await commodityService.getById(id);
    commodity = res.data || res;
  } catch {
    const mocks = generateMockCommodities();
    commodity = mocks.find(c => c.id === id) || mocks[0];
  }

  PERIODS.forEach(p => {
    const points = p.key === '1D' ? 24 : p.key === '1W' ? 7 : p.key === '1M' ? 30 : p.key === '3M' ? 90 : p.key === '1Y' ? 365 : 730;
    mockChartData[p.key] = generateSparklineData(points, commodity.price, commodity.price * 0.05);
    mockVolumes[p.key] = Array.from({ length: Math.min(points, 50) }, () => getRandomInt(100, 1000));
  });

  renderDetail();
}

function renderDetail() {
  if (!container || !commodity) return;

  const isPositive = (commodity.change ?? 0) >= 0;
  const changeColor = isPositive ? 'var(--success)' : 'var(--danger)';
  const changeArrow = isPositive ? '▲' : '▼';
  const chartData = mockChartData[activePeriod] || [];
  const volData = mockVolumes[activePeriod] || [];

  const supply = getRandomInt(500, 5000);
  const demand = getRandomInt(300, 4500);
  const ratio = ((supply / Math.max(demand, 1)) * 100).toFixed(0);

  const recentTrades = Array.from({ length: 5 }, (_, i) => ({
    price: commodity.price + getRandomInt(-500, 500),
    volume: getRandomInt(50, 500),
    time: new Date(Date.now() - getRandomInt(1, 60) * 60000),
    type: Math.random() > 0.5 ? 'buy' : 'sell',
  }));

  // Order book depth data
  const asks = Array.from({ length: 5 }, (_, i) => ({
    price: commodity.price + (i + 1) * getRandomInt(50, 200),
    amount: getRandomInt(100, 800),
  })).reverse();
  const bids = Array.from({ length: 5 }, (_, i) => ({
    price: commodity.price - (i + 1) * getRandomInt(50, 200),
    amount: getRandomInt(100, 800),
  }));
  const maxDepth = Math.max(...asks.map(a => a.amount), ...bids.map(b => b.amount), 1);

  container.innerHTML = `
    <div class="detail-view">
      <div class="view-container">
        <button class="back-btn" id="back-btn" aria-label="Kembali">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          <span>Market</span>
        </button>

        <!-- Commodity Header -->
        <div class="detail-header">
          <div class="detail-title-row">
            <span class="detail-icon">${commodity.icon || getCommodityIcon(commodity.type)}</span>
            <div style="flex:1;">
              <h1>${commodity.name || getCommodityLabel(commodity.type)}</h1>
              <span class="detail-type">${getCommodityLabel(commodity.type)} • ${commodity.location || 'Indonesia'}</span>
            </div>
            <div style="text-align:right;">
              <div class="detail-price">${formatRupiah(commodity.price)}</div>
              <div class="detail-change" style="color:${changeColor};">
                ${changeArrow} ${formatPercent(commodity.change)} (${formatRupiah(Math.round(commodity.price * commodity.change / 100))})
              </div>
            </div>
          </div>
          <div class="detail-meta">
            <span>Vol: ${formatNumber(commodity.volume)}</span>
            <span>Unit: ${commodity.unit || 'kg'}</span>
            <span class="live-dot"></span>
            <span>LIVE</span>
          </div>
        </div>

        <!-- Chart Area -->
        <div class="detail-chart-section">
          <div class="period-tabs">
            ${PERIODS.map(p => `
              <button class="period-tab ${activePeriod === p.key ? 'active' : ''}" data-period="${p.key}">
                ${p.label}
              </button>
            `).join('')}
          </div>
          <div class="detail-chart">
            ${renderChartSVG(chartData, volData)}
          </div>
        </div>

        <!-- Order Book Depth -->
        <div class="card" style="margin-bottom:12px;padding:0;overflow:hidden;">
          <div style="padding:10px 12px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">
            <h4 style="font-size:var(--text-xs);text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);">Order Book</h4>
            <span class="spread-indicator">Spread: ${formatRupiah(asks.length ? asks[asks.length - 1].price - bids[0].price : 0)}</span>
          </div>
          <!-- Asks (sells) — reversed so lowest ask at bottom -->
          ${asks.map(a => {
            const pct = Math.round((a.amount / maxDepth) * 100);
            return `
              <div class="depth-bar depth-bar-sell" style="height:24px;">
                <div class="depth-bar-fill" style="width:${pct}%;"></div>
                <div class="depth-bar-content">
                  <span class="depth-price" style="color:var(--danger);">${formatRupiah(a.price)}</span>
                  <span class="depth-amount">${formatNumber(a.amount)}</span>
                </div>
              </div>`;
          }).join('')}
          <!-- Spread line -->
          <div style="padding:4px 10px;background:var(--spread);text-align:center;font-size:var(--text-2xs);font-family:var(--font-mono);color:var(--gold);">
            ${formatRupiah(commodity.price)}
          </div>
          <!-- Bids (buys) -->
          ${bids.map(b => {
            const pct = Math.round((b.amount / maxDepth) * 100);
            return `
              <div class="depth-bar depth-bar-buy" style="height:24px;">
                <div class="depth-bar-fill" style="width:${pct}%;"></div>
                <div class="depth-bar-content">
                  <span class="depth-price" style="color:var(--success);">${formatRupiah(b.price)}</span>
                  <span class="depth-amount">${formatNumber(b.amount)}</span>
                </div>
              </div>`;
          }).join('')}
        </div>

        <!-- Supply vs Demand -->
        <div class="card" style="margin-bottom:12px;">
          <h4 style="margin-bottom:8px;font-size:var(--text-xs);text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);">Supply vs Demand</h4>
          <div class="supply-demand-bar">
            <div class="sd-supply" style="width:${Math.min(supply / (supply + demand) * 100, 90)}%;">
              <span class="sd-label">Supply ${formatWeight(supply)}</span>
            </div>
            <div class="sd-demand" style="width:${Math.min(demand / (supply + demand) * 100, 90)}%;">
              <span class="sd-label">Demand ${formatWeight(demand)}</span>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:6px;">
            <span style="font-size:var(--text-2xs);color:var(--text-muted);font-family:var(--font-mono);">S/D Ratio: ${ratio}%</span>
            <span style="font-size:var(--text-2xs);color:${supply > demand ? 'var(--success)' : 'var(--danger)'};font-family:var(--font-mono);">
              ${supply > demand ? 'OVERSUPPLY' : 'HIGH DEMAND'}
            </span>
          </div>
        </div>

        <!-- Recent Trades -->
        <div class="card" style="padding:0;overflow:hidden;margin-bottom:12px;">
          <div style="padding:10px 12px;border-bottom:1px solid var(--border);">
            <h4 style="font-size:var(--text-xs);text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);">Recent Trades</h4>
          </div>
          <table class="market-table">
            <thead>
              <tr>
                <th>Harga</th>
                <th>Volume</th>
                <th>Waktu</th>
                <th>Tipe</th>
              </tr>
            </thead>
            <tbody>
              ${recentTrades.map(t => `
                <tr>
                  <td class="font-data font-bold" style="font-size:var(--text-xs);">${formatRupiah(t.price)}</td>
                  <td class="font-data" style="font-size:var(--text-xs);color:var(--text-muted);">${formatWeight(t.volume)}</td>
                  <td style="color:var(--text-muted);font-size:var(--text-2xs);font-family:var(--font-mono);">${formatTimeShort(t.time)}</td>
                  <td>
                    <span class="badge ${t.type === 'buy' ? 'badge-success' : 'badge-danger'}">
                      ${t.type === 'buy' ? 'BUY' : 'SELL'}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Action Buttons -->
        <div class="detail-actions">
          <button class="btn btn-primary btn-lg" id="create-rfq-btn" style="flex:1;">
            Buat RFQ untuk ${commodity.name || getCommodityLabel(commodity.type)}
          </button>
        </div>
      </div>
    </div>
  `;

  attachEventListeners();
}

function renderChartSVG(data, volumes = []) {
  if (!data || data.length < 2) return '<p style="padding:16px;color:var(--text-muted);font-size:var(--text-xs);">No chart data</p>';

  const width = 600;
  const chartH = 180;
  const volH = 40;
  const height = chartH + volH;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const isUpTrend = data[data.length - 1] >= data[0];
  const lineColor = isUpTrend ? 'var(--success)' : 'var(--danger)';
  const fillTop = isUpTrend ? 'rgba(0,230,118,0.10)' : 'rgba(255,82,82,0.10)';
  const fillBot = isUpTrend ? 'rgba(0,230,118,0)' : 'rgba(255,82,82,0)';

  // Grid lines
  const gridLines = [0.25, 0.5, 0.75].map(pct => {
    const y = chartH - pct * (chartH - 8) - 4;
    const price = min + pct * range;
    return `
      <line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
      <text x="${width - 4}" y="${y - 3}" fill="var(--text-muted)" font-size="8" font-family="var(--font-mono)" text-anchor="end">${formatRupiah(Math.round(price))}</text>
    `;
  }).join('');

  // Price line + area
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = chartH - ((val - min) / range) * (chartH - 8) - 4;
    return `${x},${y}`;
  });

  const areaPoints = [...points, `${width},${chartH}`, `0,${chartH}`].join(' ');

  // Volume bars
  const maxVol = Math.max(...(volumes.length ? volumes : [1]), 1);
  const volBars = volumes.length ? volumes.map((vol, i) => {
    const x = (i / volumes.length) * width;
    const barW = (width / volumes.length) - 1;
    const barH = (vol / maxVol) * volH;
    const isBuy = i === 0 || data[Math.min(i, data.length - 1)] >= data[Math.max(0, i - 1)];
    return `<rect x="${x}" y="${chartH + volH - barH}" width="${Math.max(barW, 1)}" height="${barH}" 
                  fill="${isBuy ? 'rgba(0,230,118,0.12)' : 'rgba(255,82,82,0.12)'}" rx="1"/>`;
  }).join('') : '';

  // Last price dot
  const lastX = width;
  const lastY = chartH - ((data[data.length - 1] - min) / range) * (chartH - 8) - 4;

  return `
    <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;">
      <defs>
        <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${fillTop}"/>
          <stop offset="100%" stop-color="${fillBot}"/>
        </linearGradient>
      </defs>
      <!-- Grid -->
      ${gridLines}
      <!-- Area fill -->
      <polygon points="${areaPoints}" fill="url(#chartAreaGrad)"/>
      <!-- Price line -->
      <polyline
        points="${points.join(' ')}"
        fill="none"
        stroke="${lineColor}"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <!-- Last price dot -->
      <circle cx="${lastX}" cy="${lastY}" r="3" fill="${lineColor}"/>
      <circle cx="${lastX}" cy="${lastY}" r="6" fill="${isUpTrend ? 'rgba(0,230,118,0.2)' : 'rgba(255,82,82,0.2)'}"/>
      <!-- Volume bars -->
      ${volBars}
      <!-- Divider line -->
      <line x1="0" y1="${chartH}" x2="${width}" y2="${chartH}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
    </svg>
  `;
}

function formatTimeShort(date) {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now - d) / 60000);
  if (diff < 1) return 'Baru';
  if (diff < 60) return `${diff}m`;
  if (diff < 1440) return `${Math.floor(diff / 60)}j`;
  return `${Math.floor(diff / 1440)}h`;
}

function attachEventListeners() {
  const backBtn = document.getElementById('back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.hash = '#/market';
    });
  }

  container.querySelectorAll('[data-period]').forEach(btn => {
    btn.addEventListener('click', () => {
      activePeriod = btn.dataset.period;
      renderDetail();
    });
  });

  const rfqBtn = document.getElementById('create-rfq-btn');
  if (rfqBtn) {
    rfqBtn.addEventListener('click', async () => {
      if (!isAuthenticated()) {
        showLoginModal();
        showToast('Silakan masuk untuk membuat RFQ', 'warning');
        return;
      }
      const { showCreateRFQModal } = await import('../components/modal.js');
      showCreateRFQModal();
    });
  }
}

export function unmount() {
  container = null;
  showSearch(false);
}
