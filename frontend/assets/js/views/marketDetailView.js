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
        <div class="skeleton skeleton-text" style="width:60%;margin-top:16px;"></div>
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
    // Fallback to mock data
    const mocks = generateMockCommodities();
    commodity = mocks.find(c => c.id === id) || mocks[0];
  }

  // Generate mock chart data for each period
  PERIODS.forEach(p => {
    const points = p.key === '1D' ? 24 : p.key === '1W' ? 7 : p.key === '1M' ? 30 : p.key === '3M' ? 90 : p.key === '1Y' ? 365 : 730;
    mockChartData[p.key] = generateSparklineData(points, commodity.price, commodity.price * 0.05);
  });

  renderDetail();
}

function renderDetail() {
  if (!container || !commodity) return;

  const isPositive = (commodity.change ?? 0) >= 0;
  const changeColor = isPositive ? 'var(--success)' : 'var(--danger)';
  const changeArrow = isPositive ? '▲' : '▼';
  const chartData = mockChartData[activePeriod] || [];

  // Mock supply/demand data
  const supply = getRandomInt(500, 5000);
  const demand = getRandomInt(300, 4500);
  const ratio = ((supply / Math.max(demand, 1)) * 100).toFixed(0);

  // Mock recent trades
  const recentTrades = Array.from({ length: 5 }, (_, i) => ({
    price: commodity.price + getRandomInt(-500, 500),
    volume: getRandomInt(50, 500),
    time: new Date(Date.now() - getRandomInt(1, 60) * 60000),
    type: Math.random() > 0.5 ? 'buy' : 'sell',
  }));

  container.innerHTML = `
    <div class="detail-view">
      <div class="view-container">
        <!-- Back Button -->
        <button class="back-btn" id="back-btn" aria-label="Kembali">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          <span>Market</span>
        </button>

        <!-- Commodity Header -->
        <div class="detail-header">
          <div class="detail-title-row">
            <span class="detail-icon">${commodity.icon || getCommodityIcon(commodity.type)}</span>
            <div>
              <h1>${commodity.name || getCommodityLabel(commodity.type)}</h1>
              <span class="detail-type">${getCommodityLabel(commodity.type)} • ${commodity.location || 'Indonesia'}</span>
            </div>
          </div>
          <div class="detail-price-row">
            <span class="detail-price">${formatRupiah(commodity.price)}</span>
            <span class="detail-change" style="color:${changeColor};">
              ${changeArrow} ${formatPercent(commodity.change)} (${formatRupiah(Math.round(commodity.price * commodity.change / 100))})
            </span>
          </div>
          <div class="detail-meta">
            <span>Vol: ${formatNumber(commodity.volume)}</span>
            <span>Unit: ${commodity.unit || 'kg'}</span>
            <span>Updated: ${formatDate(new Date().toISOString())}</span>
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
            ${renderChartSVG(chartData)}
          </div>
        </div>

        <!-- Supply vs Demand -->
        <div class="card" style="margin-bottom:16px;">
          <h4 style="margin-bottom:12px;font-size:0.9rem;">Supply vs Demand</h4>
          <div class="supply-demand-bar">
            <div class="sd-supply" style="width:${Math.min(supply / (supply + demand) * 100, 90)}%;">
              <span class="sd-label">Supply ${formatWeight(supply)}</span>
            </div>
            <div class="sd-demand" style="width:${Math.min(demand / (supply + demand) * 100, 90)}%;">
              <span class="sd-label">Demand ${formatWeight(demand)}</span>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:8px;">
            <span style="font-size:0.7rem;color:var(--text-muted);">S/D Ratio: ${ratio}%</span>
            <span style="font-size:0.7rem;color:${supply > demand ? 'var(--success)' : 'var(--danger)'};">
              ${supply > demand ? 'Oversupply' : 'High Demand'}
            </span>
          </div>
        </div>

        <!-- Recent Trades -->
        <div class="card" style="padding:0;overflow:hidden;margin-bottom:16px;">
          <div style="padding:12px 16px;border-bottom:1px solid var(--border);">
            <h4 style="font-size:0.9rem;">Recent Trades</h4>
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
                  <td class="font-mono font-bold">${formatRupiah(t.price)}</td>
                  <td class="font-mono">${formatWeight(t.volume)}</td>
                  <td style="color:var(--text-muted);font-size:0.75rem;">${formatTimeShort(t.time)}</td>
                  <td>
                    <span class="badge ${t.type === 'buy' ? 'badge-success' : 'badge-danger'}" style="font-size:0.6rem;">
                      ${t.type === 'buy' ? 'Beli' : 'Jual'}
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

function renderChartSVG(data) {
  if (!data || data.length < 2) return '<p style="padding:20px;color:var(--text-muted);">No chart data</p>';

  const width = 600;
  const height = 200;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const isUpTrend = data[data.length - 1] >= data[0];
  const lineColor = isUpTrend ? 'var(--success)' : 'var(--danger)';
  const fillColor = isUpTrend ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)';

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 8) - 4;
    return `${x},${y}`;
  });

  const areaPoints = [...points, `${width},${height}`, `0,${height}`].join(' ');

  return `
    <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;">
      <defs>
        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${isUpTrend ? '#22C55E' : '#EF4444'}" stop-opacity="0.15"/>
          <stop offset="100%" stop-color="${isUpTrend ? '#22C55E' : '#EF4444'}" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <polygon points="${areaPoints}" fill="url(#chartGradient)"/>
      <polyline
        points="${points.join(' ')}"
        fill="none"
        stroke="${lineColor}"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
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
  // Back button
  const backBtn = document.getElementById('back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.hash = '#/market';
    });
  }

  // Period tabs
  container.querySelectorAll('[data-period]').forEach(btn => {
    btn.addEventListener('click', () => {
      activePeriod = btn.dataset.period;
      renderDetail();
    });
  });

  // Create RFQ button
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
