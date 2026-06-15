/**
 * Intelligence Service — Market Intelligence & Price Alerts
 * Technical analysis, price alerts, anomaly detection
 */
import { get, post, del } from '../api.js';
import { isAuthenticated } from '../auth.js';
import { setState, getState, subscribe } from '../state.js';
import { showToast } from '../components/toast.js';
import { addNotification } from './notificationService.js';

let priceAlerts = [];
let alertCheckInterval = null;

// ==================== PRICE ALERTS ====================

/**
 * Create a new price alert
 */
export async function createPriceAlert(alert) {
  const normalized = {
    id: `alert_${Date.now()}`,
    commodityId: alert.commodityId,
    commodityName: alert.commodityName || '',
    condition: alert.condition, // 'above' or 'below'
    targetPrice: alert.targetPrice,
    currentPrice: alert.currentPrice || 0,
    active: true,
    createdAt: new Date().toISOString(),
    triggered: false,
  };

  priceAlerts.push(normalized);
  setState('priceAlerts', priceAlerts);

  if (isAuthenticated()) {
    try {
      const res = await post('/alerts', normalized);
      if (res.data?.id) normalized.id = res.data.id;
    } catch { /* offline — alert stored locally */ }
  }

  return normalized;
}

/**
 * Get all price alerts for current user
 */
export async function getPriceAlerts() {
  if (isAuthenticated()) {
    try {
      const res = await get('/alerts');
      priceAlerts = (res.data || res || []).map(normalizeAlert);
    } catch { /* use cached */ }
  }
  return [...priceAlerts];
}

/**
 * Delete a price alert
 */
export async function deletePriceAlert(alertId) {
  priceAlerts = priceAlerts.filter(a => a.id !== alertId);
  setState('priceAlerts', priceAlerts);

  if (isAuthenticated()) {
    try { await del(`/alerts/${alertId}`); } catch { /* offline */ }
  }
}

/**
 * Check price alerts against current market data
 * Called periodically and on commodity data refresh
 */
export function checkPriceAlerts(commodities) {
  if (!commodities || !priceAlerts.length) return;

  priceAlerts.forEach(alert => {
    if (!alert.active || alert.triggered) return;

    const commodity = commodities.find(c => c.id === alert.commodityId || c.type === alert.commodityId);
    if (!commodity) return;

    const currentPrice = commodity.price;
    let triggered = false;

    if (alert.condition === 'above' && currentPrice >= alert.targetPrice) {
      triggered = true;
    } else if (alert.condition === 'below' && currentPrice <= alert.targetPrice) {
      triggered = true;
    }

    if (triggered) {
      alert.triggered = true;
      alert.triggeredAt = new Date().toISOString();
      alert.triggeredPrice = currentPrice;

      const direction = alert.condition === 'above' ? 'naik melebihi' : 'turun di bawah';
      addNotification({
        type: 'price',
        title: `Alert: ${alert.commodityName}`,
        body: `Harga ${direction} ${formatAlertPrice(alert.targetPrice)}. Saat ini: ${formatAlertPrice(currentPrice)}`,
      });

      showToast(`🔔 ${alert.commodityName} ${direction} target!`, 'warning');
    }
  });

  setState('priceAlerts', priceAlerts);
}

/**
 * Start periodic alert checking (every 60 seconds)
 */
export function startAlertMonitoring() {
  if (alertCheckInterval) return;
  alertCheckInterval = setInterval(() => {
    const commodities = getState('commodities');
    if (commodities?.length) checkPriceAlerts(commodities);
  }, 60000);
}

/**
 * Stop alert monitoring
 */
export function stopAlertMonitoring() {
  if (alertCheckInterval) {
    clearInterval(alertCheckInterval);
    alertCheckInterval = null;
  }
}

// ==================== TREND DETECTION ====================

/**
 * Detect trend direction from price data
 * @returns {{ direction: 'bullish'|'bearish'|'neutral', strength: number, signal: string }}
 */
export function detectTrend(prices) {
  if (!prices || prices.length < 5) {
    return { direction: 'neutral', strength: 0, signal: 'Data tidak cukup' };
  }

  const shortMA = calcSMA(prices, 5);
  const longMA = calcSMA(prices, 20);

  const shortLatest = shortMA[shortMA.length - 1];
  const longLatest = longMA[longMA.length - 1];
  const shortPrev = shortMA[shortMA.length - 2] || shortLatest;
  const longPrev = longMA[longMA.length - 2] || longLatest;

  // Crossover detection
  const wasBelow = shortPrev <= longPrev;
  const isAbove = shortLatest > longLatest;

  if (wasBelow && isAbove) {
    return { direction: 'bullish', strength: 80, signal: 'Golden Cross — Sinyal beli' };
  }
  if (!wasBelow && !isAbove) {
    return { direction: 'bearish', strength: 80, signal: 'Death Cross — Sinyal jual' };
  }

  // Trend strength
  const diff = ((shortLatest - longLatest) / longLatest) * 100;
  if (diff > 2) return { direction: 'bullish', strength: 60, signal: 'Trend naik kuat' };
  if (diff > 0.5) return { direction: 'bullish', strength: 40, signal: 'Trend naik moderat' };
  if (diff < -2) return { direction: 'bearish', strength: 60, signal: 'Trend turun kuat' };
  if (diff < -0.5) return { direction: 'bearish', strength: 40, signal: 'Trend turun moderat' };
  return { direction: 'neutral', strength: 20, signal: 'Sideways — Tren tidak jelas' };
}

/**
 * Detect price anomaly (sudden spikes/drops)
 */
export function detectAnomaly(prices, threshold = 2.5) {
  if (!prices || prices.length < 10) return null;

  const recent = prices.slice(-5);
  const historical = prices.slice(-20, -5);
  if (!historical.length) return null;

  const histMean = historical.reduce((a, b) => a + b, 0) / historical.length;
  const histStd = Math.sqrt(historical.reduce((s, v) => s + (v - histMean) ** 2, 0) / historical.length);

  const latestPrice = recent[recent.length - 1];
  const zScore = histStd > 0 ? (latestPrice - histMean) / histStd : 0;

  if (Math.abs(zScore) > threshold) {
    return {
      type: zScore > 0 ? 'spike' : 'drop',
      zScore: zScore.toFixed(2),
      price: latestPrice,
      mean: histMean,
      deviation: ((latestPrice - histMean) / histMean * 100).toFixed(1),
      severity: Math.abs(zScore) > 4 ? 'extreme' : Math.abs(zScore) > 3 ? 'high' : 'moderate',
    };
  }

  return null;
}

/**
 * Calculate Simple Moving Average
 */
function calcSMA(data, period) {
  return data.map((_, i) => {
    if (i < period - 1) return null;
    const slice = data.slice(i - period + 1, i + 1);
    return slice.reduce((a, b) => a + b, 0) / period;
  });
}

function normalizeAlert(raw) {
  return {
    id: raw.id || `alert_${Date.now()}`,
    commodityId: raw.commodityId || '',
    commodityName: raw.commodityName || '',
    condition: raw.condition || 'above',
    targetPrice: raw.targetPrice || 0,
    currentPrice: raw.currentPrice || 0,
    active: raw.active !== false,
    triggered: !!raw.triggered,
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

function formatAlertPrice(price) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price);
}
