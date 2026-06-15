/**
 * Technical Indicators — Market analysis utilities
 * RSI, MACD, Bollinger Bands, Stochastic, ATR
 */

/**
 * Calculate Relative Strength Index (RSI)
 * @param {number[]} prices - Array of closing prices
 * @param {number} period - RSI period (default 14)
 * @returns {number[]} RSI values (null for insufficient data)
 */
export function calcRSI(prices, period = 14) {
  if (prices.length < period + 1) return prices.map(() => null);

  const result = new Array(period).fill(null);
  let avgGain = 0, avgLoss = 0;

  // Initial average
  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) avgGain += diff;
    else avgLoss += Math.abs(diff);
  }
  avgGain /= period;
  avgLoss /= period;

  const calcRSI = (ag, al) => al === 0 ? 100 : 100 - (100 / (1 + ag / al));
  result.push(calcRSI(avgGain, avgLoss));

  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    result.push(calcRSI(avgGain, avgLoss));
  }

  return result;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * @param {number[]} prices - Array of closing prices
 * @param {number} fast - Fast EMA period (default 12)
 * @param {number} slow - Slow EMA period (default 26)
 * @param {number} signal - Signal line period (default 9)
 * @returns {{ macd: number[], signal: number[], histogram: number[] }}
 */
export function calcMACD(prices, fast = 12, slow = 26, signal = 9) {
  const emaFast = calcEMA(prices, fast);
  const emaSlow = calcEMA(prices, slow);

  const macdLine = prices.map((_, i) => {
    if (emaFast[i] === null || emaSlow[i] === null) return null;
    return emaFast[i] - emaSlow[i];
  });

  const validMacd = macdLine.filter(v => v !== null);
  const signalLine = calcEMA(validMacd, signal);

  // Align signal with macd
  const offset = macdLine.length - signalLine.length;
  const alignedSignal = new Array(offset).fill(null).concat(signalLine);

  const histogram = macdLine.map((v, i) => {
    if (v === null || alignedSignal[i] === null) return null;
    return v - alignedSignal[i];
  });

  return { macd: macdLine, signal: alignedSignal, histogram };
}

/**
 * Calculate Bollinger Bands
 * @param {number[]} prices - Array of closing prices
 * @param {number} period - SMA period (default 20)
 * @param {number} stdDev - Standard deviation multiplier (default 2)
 * @returns {{ upper: number[], middle: number[], lower: number[] }}
 */
export function calcBollingerBands(prices, period = 20, stdDev = 2) {
  const middle = calcSMA(prices, period);

  const upper = prices.map((_, i) => {
    if (middle[i] === null) return null;
    const slice = prices.slice(i - period + 1, i + 1);
    const mean = middle[i];
    const variance = slice.reduce((s, v) => s + (v - mean) ** 2, 0) / period;
    return mean + stdDev * Math.sqrt(variance);
  });

  const lower = prices.map((_, i) => {
    if (middle[i] === null) return null;
    const slice = prices.slice(i - period + 1, i + 1);
    const mean = middle[i];
    const variance = slice.reduce((s, v) => s + (v - mean) ** 2, 0) / period;
    return mean - stdDev * Math.sqrt(variance);
  });

  return { upper, middle, lower };
}

/**
 * Calculate Stochastic Oscillator
 * @param {number[]} highs - Array of high prices
 * @param {number[]} lows - Array of low prices
 * @param {number[]} closes - Array of closing prices
 * @param {number} period - Lookback period (default 14)
 * @returns {{ k: number[], d: number[] }}
 */
export function calcStochastic(highs, lows, closes, period = 14) {
  const k = closes.map((_, i) => {
    if (i < period - 1) return null;
    const highSlice = highs.slice(i - period + 1, i + 1);
    const lowSlice = lows.slice(i - period + 1, i + 1);
    const highest = Math.max(...highSlice);
    const lowest = Math.min(...lowSlice);
    if (highest === lowest) return 50;
    return ((closes[i] - lowest) / (highest - lowest)) * 100;
  });

  const d = calcSMA(k.filter(v => v !== null), 3);
  const offset = k.length - d.length;
  const alignedD = new Array(offset).fill(null).concat(d);

  return { k, d: alignedD };
}

/**
 * Calculate Average True Range (ATR)
 * @param {number[]} highs - Array of high prices
 * @param {number[]} lows - Array of low prices
 * @param {number[]} closes - Array of closing prices
 * @param {number} period - ATR period (default 14)
 * @returns {number[]}
 */
export function calcATR(highs, lows, closes, period = 14) {
  if (closes.length < 2) return closes.map(() => null);

  const trueRanges = [null];
  for (let i = 1; i < closes.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trueRanges.push(tr);
  }

  return calcSMA(trueRanges.slice(1), period);
}

// ==================== HELPERS ====================

function calcSMA(data, period) {
  return data.map((_, i) => {
    if (i < period - 1) return null;
    const slice = data.slice(i - period + 1, i + 1);
    const valid = slice.filter(v => v !== null);
    if (valid.length < period) return null;
    return valid.reduce((a, b) => a + b, 0) / valid.length;
  });
}

function calcEMA(data, period) {
  if (data.length < period) return data.map(() => null);

  const result = new Array(period - 1).fill(null);
  const k = 2 / (period + 1);

  // Seed EMA with SMA
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result.push(ema);

  for (let i = period; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
    result.push(ema);
  }

  return result;
}

/**
 * Interpret RSI value
 */
export function interpretRSI(rsi) {
  if (rsi === null || rsi === undefined) return { label: '-', signal: 'neutral' };
  if (rsi > 70) return { label: 'Overbought', signal: 'sell' };
  if (rsi > 55) return { label: 'Bullish', signal: 'buy' };
  if (rsi < 30) return { label: 'Oversold', signal: 'buy' };
  if (rsi < 45) return { label: 'Bearish', signal: 'sell' };
  return { label: 'Neutral', signal: 'hold' };
}

/**
 * Interpret MACD histogram
 */
export function interpretMACD(histogram) {
  if (!histogram || histogram.length < 2) return { label: '-', signal: 'neutral' };
  const latest = histogram[histogram.length - 1];
  const prev = histogram[histogram.length - 2];

  if (latest > 0 && prev <= 0) return { label: 'Bullish Crossover', signal: 'buy' };
  if (latest < 0 && prev >= 0) return { label: 'Bearish Crossover', signal: 'sell' };
  if (latest > 0) return { label: 'Bullish', signal: 'buy' };
  if (latest < 0) return { label: 'Bearish', signal: 'sell' };
  return { label: 'Neutral', signal: 'hold' };
}
