/**
 * Market Detail View — Phase 4 Bloomberg/TradingView Style
 * Candlestick + Line chart toggle, market status, order book
 */
import { showSearch } from '../components/header.js';
import { showToast } from '../components/toast.js';
import { isAuthenticated } from '../auth.js';
import { showLoginModal } from '../components/modal.js';
import { renderLineChart, renderCandlestickChart } from '../components/chartRenderer.js';
import { generateMockCommodities, generateSparklineData, getRandomInt } from '../utils/helpers.js';
import { formatRupiah, formatPercent, formatNumber, formatWeight } from '../utils/formatter.js';
import { getCommodityLabel, getCommodityIcon } from '../constants/commodities.js';
import { commodityService } from '../services/commodityService.js';
import { getRouteParams } from '../router.js';

let container = null;
let commodity = null;
let activePeriod = '1W';
let chartType = 'line'; // line | candle
let mockChartData = {};
let mockVolumes = {};

const PERIODS = [
  { key: '1D', label: '1H' }, { key: '1W', label: '1W' },
  { key: '1M', label: '1M' }, { key: '3M', label: '3M' },
  { key: '1Y', label: '1Y' }, { key: 'ALL', label: 'ALL' },
];

export async function mount(el) {
  container = el;
  showSearch(false);
  container.innerHTML = `<div class="detail-view"><div class="view-container">
    <div class="skeleton" style="height:200px;border-radius:var(--radius-md);"></div>
    <div class="skeleton skeleton-text" style="width:60%;margin-top:12px;"></div>
  </div></div>`;

  const params = getRouteParams();
  try {
    const res = await commodityService.getById(params.id);
    commodity = res.data || res;
  } catch {
    const mocks = generateMockCommodities();
    commodity = mocks.find(c => c.id === params.id) || mocks[0];
  }

  PERIODS.forEach(p => {
    const pts = p.key === '1D' ? 24 : p.key === '1W' ? 7 : p.key === '1M' ? 30 : p.key === '3M' ? 90 : p.key === '1Y' ? 365 : 730;
    mockChartData[p.key] = generateSparklineData(pts, commodity.price, commodity.price * 0.05);
    mockVolumes[p.key] = Array.from({ length: Math.min(pts, 50) }, () => getRandomInt(100, 1000));
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

  const supply = getRandomInt(500, 5000), demand = getRandomInt(300, 4500);
  const ratio = ((supply / Math.max(demand, 1)) * 100).toFixed(0);

  const recentTrades = Array.from({ length: 5 }, () => ({
    price: commodity.price + getRandomInt(-500, 500),
    volume: getRandomInt(50, 500),
    time: new Date(Date.now() - getRandomInt(1, 60) * 60000),
    type: Math.random() > 0.5 ? 'buy' : 'sell',
  }));

  const asks = Array.from({ length: 5 }, (_, i) => ({
    price: commodity.price + (i + 1) * getRandomInt(50, 200), amount: getRandomInt(100, 800),
  })).reverse();
  const bids = Array.from({ length: 5 }, (_, i) => ({
    price: commodity.price - (i + 1) * getRandomInt(50, 200), amount: getRandomInt(100, 800),
  }));
  const maxDepth = Math.max(...asks.map(a => a.amount), ...bids.map(b => b.amount), 1);

  const chartSvg = chartType === 'candle'
    ? renderCandlestickChart(chartData, volData)
    : renderLineChart(chartData, volData);

  container.innerHTML = `
    <div class="detail-view"><div class="view-container">
      <button class="back-btn" id="back-btn" aria-label="Kembali">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        <span>Market</span>
      </button>

      <div class="detail-header">
        <div class="detail-title-row">
          <span class="detail-icon">${commodity.icon || getCommodityIcon(commodity.type)}</span>
          <div style="flex:1;">
            <h1>${commodity.name || getCommodityLabel(commodity.type)}</h1>
            <span class="detail-type">${getCommodityLabel(commodity.type)} • ${commodity.location || 'Indonesia'}</span>
          </div>
          <div style="text-align:right;">
            <div class="detail-price">${formatRupiah(commodity.price)}</div>
            <div class="detail-change" style="color:${changeColor};">${changeArrow} ${formatPercent(commodity.change)} (${formatRupiah(Math.round(commodity.price * commodity.change / 100))})</div>
          </div>
        </div>
        <div class="detail-meta">
          <span>Vol: ${formatNumber(commodity.volume)}</span>
          <span>Unit: ${commodity.unit || 'kg'}</span>
          <span class="market-status open"><span class="market-status-dot"></span>LIVE</span>
        </div>
      </div>

      <div class="detail-chart-section">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <div class="period-tabs" style="margin-bottom:0;">
            ${PERIODS.map(p => `<button class="period-tab ${activePeriod === p.key ? 'active' : ''}" data-period="${p.key}">${p.label}</button>`).join('')}
          </div>
          <div class="view-toggle" style="margin-bottom:0;">
            <button class="${chartType === 'line' ? 'active' : ''}" data-chart="line" aria-label="Line">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </button>
            <button class="${chartType === 'candle' ? 'active' : ''}" data-chart="candle" aria-label="Candle">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="6" y1="2" x2="6" y2="6"/><rect x="3" y="6" width="6" height="6"/><line x1="6" y1="12" x2="6" y2="22"/><line x1="18" y1="2" x2="18" y2="8"/><rect x="15" y="8" width="6" height="8"/><line x1="18" y1="16" x2="18" y2="22"/></svg>
            </button>
          </div>
        </div>
        <div class="detail-chart">${chartSvg}</div>
      </div>

      <div class="card" style="margin-bottom:12px;padding:0;overflow:hidden;">
        <div style="padding:10px 12px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">
          <h4 style="font-size:var(--text-xs);text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);">Order Book</h4>
          <span class="spread-indicator">Spread: ${formatRupiah(asks.length ? asks[asks.length - 1].price - bids[0].price : 0)}</span>
        </div>
        ${asks.map(a => depthRow(a, maxDepth, 'sell')).join('')}
        <div style="padding:4px 10px;background:var(--spread);text-align:center;font-size:var(--text-2xs);font-family:var(--font-mono);color:var(--gold);">${formatRupiah(commodity.price)}</div>
        ${bids.map(b => depthRow(b, maxDepth, 'buy')).join('')}
      </div>

      <div class="card" style="margin-bottom:12px;">
        <h4 style="margin-bottom:8px;font-size:var(--text-xs);text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);">Supply vs Demand</h4>
        <div class="supply-demand-bar">
          <div class="sd-supply" style="width:${Math.min(supply / (supply + demand) * 100, 90)}%;"><span class="sd-label">Supply ${formatWeight(supply)}</span></div>
          <div class="sd-demand" style="width:${Math.min(demand / (supply + demand) * 100, 90)}%;"><span class="sd-label">Demand ${formatWeight(demand)}</span></div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:6px;">
          <span style="font-size:var(--text-2xs);color:var(--text-muted);font-family:var(--font-mono);">S/D Ratio: ${ratio}%</span>
          <span style="font-size:var(--text-2xs);color:${supply > demand ? 'var(--success)' : 'var(--danger)'};font-family:var(--font-mono);">${supply > demand ? 'OVERSUPPLY' : 'HIGH DEMAND'}</span>
        </div>
      </div>

      <div class="card" style="padding:0;overflow:hidden;margin-bottom:12px;">
        <div style="padding:10px 12px;border-bottom:1px solid var(--border);"><h4 style="font-size:var(--text-xs);text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);">Recent Trades</h4></div>
        <table class="market-table"><thead><tr><th>Harga</th><th>Volume</th><th>Waktu</th><th>Tipe</th></tr></thead>
        <tbody>${recentTrades.map(t => `<tr>
          <td class="font-data font-bold" style="font-size:var(--text-xs);">${formatRupiah(t.price)}</td>
          <td class="font-data" style="font-size:var(--text-xs);color:var(--text-muted);">${formatWeight(t.volume)}</td>
          <td style="color:var(--text-muted);font-size:var(--text-2xs);font-family:var(--font-mono);">${fmtTime(t.time)}</td>
          <td><span class="badge ${t.type === 'buy' ? 'badge-success' : 'badge-danger'}">${t.type === 'buy' ? 'BUY' : 'SELL'}</span></td>
        </tr>`).join('')}</tbody></table>
      </div>

      <div class="detail-actions">
        <button class="btn btn-primary btn-lg" id="create-rfq-btn" style="flex:1;">Buat RFQ untuk ${commodity.name || getCommodityLabel(commodity.type)}</button>
      </div>
    </div></div>`;

  attachListeners();
}

function depthRow(item, maxDepth, type) {
  const pct = Math.round((item.amount / maxDepth) * 100);
  const color = type === 'buy' ? 'var(--success)' : 'var(--danger)';
  return `<div class="depth-bar depth-bar-${type}" style="height:24px;">
    <div class="depth-bar-fill" style="width:${pct}%;"></div>
    <div class="depth-bar-content">
      <span class="depth-price" style="color:${color};">${formatRupiah(item.price)}</span>
      <span class="depth-amount">${formatNumber(item.amount)}</span>
    </div></div>`;
}

function fmtTime(date) {
  const diff = Math.floor((new Date() - new Date(date)) / 60000);
  if (diff < 1) return 'Baru';
  if (diff < 60) return `${diff}m`;
  if (diff < 1440) return `${Math.floor(diff / 60)}j`;
  return `${Math.floor(diff / 1440)}h`;
}

function attachListeners() {
  document.getElementById('back-btn')?.addEventListener('click', () => { window.location.hash = '#/market'; });
  container.querySelectorAll('[data-period]').forEach(b => b.addEventListener('click', () => { activePeriod = b.dataset.period; renderDetail(); }));
  container.querySelectorAll('[data-chart]').forEach(b => b.addEventListener('click', () => { chartType = b.dataset.chart; renderDetail(); }));
  document.getElementById('create-rfq-btn')?.addEventListener('click', async () => {
    if (!isAuthenticated()) { showLoginModal(); showToast('Silakan masuk untuk membuat RFQ', 'warning'); return; }
    const { showCreateRFQModal } = await import('../components/modal.js');
    showCreateRFQModal();
  });
}

export function unmount() { container = null; showSearch(false); }
