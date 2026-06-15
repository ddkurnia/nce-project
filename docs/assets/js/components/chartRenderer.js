/**
 * Chart Renderer — Phase 4 Trading Terminal Charts
 * Line chart, candlestick chart with MA overlays, volume bars
 */
import { formatRupiah } from '../utils/formatter.js';

export function renderLineChart(data, volumes = []) {
  if (!data || data.length < 2) return '<p style="padding:16px;color:var(--text-muted);font-size:var(--text-xs);">No chart data</p>';

  const W = 600, chartH = 180, volH = 40, H = chartH + volH;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const isUp = data[data.length - 1] >= data[0];
  const lineColor = isUp ? 'var(--success)' : 'var(--danger)';

  const grid = renderGrid(chartH, W, min, range);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${chartH - ((v - min) / range) * (chartH - 8) - 4}`);
  const areaPts = [...pts, `${W},${chartH}`, `0,${chartH}`].join(' ');

  const ma7 = calcMA(data, 7);
  const ma25 = calcMA(data, 25);
  const ma7Line = renderMALine(ma7, data.length, min, range, chartH, W);
  const ma25Line = renderMALine(ma25, data.length, min, range, chartH, W);

  const volBars = renderVolumeBars(volumes, data, W, chartH, volH);
  const lastY = chartH - ((data[data.length - 1] - min) / range) * (chartH - 8) - 4;

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;">
    <defs><linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${isUp ? 'rgba(0,230,118,0.08)' : 'rgba(255,82,82,0.08)'}"/>
      <stop offset="100%" stop-color="${isUp ? 'rgba(0,230,118,0)' : 'rgba(255,82,82,0)'}"/>
    </linearGradient></defs>
    ${grid}
    <polygon points="${areaPts}" fill="url(#chartAreaGrad)"/>
    ${ma25Line ? `<polyline points="${ma25Line}" fill="none" stroke="var(--chart-ma-slow)" stroke-width="1" stroke-dasharray="3,3" opacity="0.6"/>` : ''}
    ${ma7Line ? `<polyline points="${ma7Line}" fill="none" stroke="var(--chart-ma-fast)" stroke-width="1" opacity="0.7"/>` : ''}
    <polyline points="${pts.join(' ')}" fill="none" stroke="${lineColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${W}" cy="${lastY}" r="3" fill="${lineColor}"/>
    <circle cx="${W}" cy="${lastY}" r="7" fill="${isUp ? 'rgba(0,230,118,0.15)' : 'rgba(255,82,82,0.15)'}"/>
    ${volBars}
    <line x1="0" y1="${chartH}" x2="${W}" y2="${chartH}" stroke="var(--chart-grid)" stroke-width="1"/>
    <line x1="${W}" y1="${lastY}" x2="${W}" y2="${chartH}" stroke="var(--chart-crosshair)" stroke-width="1" stroke-dasharray="2,2" opacity="0.5"/>
  </svg>`;
}

export function renderCandlestickChart(data, volumes = []) {
  if (!data || data.length < 4) return renderLineChart(data, volumes);

  const W = 600, chartH = 180, volH = 40, H = chartH + volH;
  const candleCount = Math.min(data.length, 40);
  const step = Math.max(1, Math.floor(data.length / candleCount));
  const candles = [];
  for (let i = 0; i < data.length - step; i += step) {
    const slice = data.slice(i, Math.min(i + step + 1, data.length));
    candles.push({ open: slice[0], close: slice[slice.length - 1], high: Math.max(...slice), low: Math.min(...slice) });
  }
  if (candles.length < 2) return renderLineChart(data, volumes);

  const cMin = Math.min(...candles.map(c => c.low));
  const cMax = Math.max(...candles.map(c => c.high));
  const cRange = cMax - cMin || 1;

  const grid = renderGrid(chartH, W, cMin, cRange);
  const barW = (W / candles.length) * 0.6;
  const gap = W / candles.length;

  const candleEls = candles.map((c, i) => {
    const x = (i + 0.5) * gap;
    const isUp = c.close >= c.open;
    const color = isUp ? 'var(--candle-up)' : 'var(--candle-down)';
    const fill = isUp ? 'var(--candle-up-fill)' : 'var(--candle-down-fill)';
    const highY = chartH - ((c.high - cMin) / cRange) * (chartH - 8) - 4;
    const lowY = chartH - ((c.low - cMin) / cRange) * (chartH - 8) - 4;
    const openY = chartH - ((c.open - cMin) / cRange) * (chartH - 8) - 4;
    const closeY = chartH - ((c.close - cMin) / cRange) * (chartH - 8) - 4;
    const bodyTop = Math.min(openY, closeY);
    const bodyH = Math.max(Math.abs(closeY - openY), 1);
    return `<line x1="${x}" y1="${highY}" x2="${x}" y2="${lowY}" stroke="var(--candle-wick)" stroke-width="1"/>
            <rect x="${x - barW / 2}" y="${bodyTop}" width="${barW}" height="${bodyH}" fill="${fill}" stroke="${color}" stroke-width="1" rx="1"/>`;
  }).join('');

  const maxVol = Math.max(...(volumes.length ? volumes : [1]), 1);
  const volBars = volumes.slice(0, candles.length).map((vol, i) => {
    const x = (i + 0.5) * gap - barW / 2;
    const barH = (vol / maxVol) * volH;
    const isBuy = candles[i] && candles[i].close >= candles[i].open;
    return `<rect x="${x}" y="${chartH + volH - barH}" width="${barW}" height="${barH}" fill="${isBuy ? 'var(--chart-volume-up)' : 'var(--chart-volume-down)'}" rx="1"/>`;
  }).join('');

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;">
    ${grid}${candleEls}${volBars}
    <line x1="0" y1="${chartH}" x2="${W}" y2="${chartH}" stroke="var(--chart-grid)" stroke-width="1"/>
  </svg>`;
}

function renderGrid(chartH, W, min, range) {
  return [0.25, 0.5, 0.75].map(pct => {
    const y = chartH - pct * (chartH - 8) - 4;
    const price = min + pct * range;
    return `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="var(--chart-grid)" stroke-width="1"/>
            <text x="${W - 4}" y="${y - 3}" fill="var(--text-muted)" font-size="8" font-family="var(--font-mono)" text-anchor="end">${formatRupiah(Math.round(price))}</text>`;
  }).join('');
}

function renderMALine(maData, dataLen, min, range, chartH, W) {
  const pts = maData.map((v, i) => {
    if (v === null) return null;
    return `${(i / (dataLen - 1)) * W},${chartH - ((v - min) / range) * (chartH - 8) - 4}`;
  }).filter(Boolean).join(' ');
  return pts;
}

function renderVolumeBars(volumes, data, W, chartH, volH) {
  if (!volumes.length) return '';
  const maxVol = Math.max(...volumes, 1);
  return volumes.map((vol, i) => {
    const x = (i / volumes.length) * W;
    const barW = (W / volumes.length) - 1;
    const barH = (vol / maxVol) * volH;
    const isBuy = i === 0 || data[Math.min(i, data.length - 1)] >= data[Math.max(0, i - 1)];
    return `<rect x="${x}" y="${chartH + volH - barH}" width="${Math.max(barW, 1)}" height="${barH}" fill="${isBuy ? 'var(--chart-volume-up)' : 'var(--chart-volume-down)'}" rx="1"/>`;
  }).join('');
}

function calcMA(data, period) {
  return data.map((_, i) => {
    if (i < period - 1) return null;
    const slice = data.slice(i - period + 1, i + 1);
    return slice.reduce((a, b) => a + b, 0) / period;
  });
}
