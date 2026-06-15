/* ============================================================================
 * NCE — Sparkline Component
 * SVG mini-charts for price visualization
 * ============================================================================ */

const Sparkline = {
  /**
   * Generate sparkline SVG from data points
   * @param {number[]} data - Array of numeric values
   * @param {object} opts - Options
   * @returns {string} SVG markup
   */
  render(data = [], opts = {}) {
    if (!data.length) return '';

    const width = opts.width || 80;
    const height = opts.height || 28;
    const strokeW = opts.strokeWidth || 1.5;
    const id = opts.id || '';

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const step = width / (data.length - 1);
    const padding = 2;

    // Build path
    const points = data.map((val, i) => {
      const x = i * step;
      const y = padding + ((max - val) / range) * (height - padding * 2);
      return `${x},${y}`;
    });

    const pathD = `M${points.join(' L')}`;

    // Determine direction
    const first = data[0];
    const last = data[data.length - 1];
    const direction = last > first ? 'up' : last < first ? 'down' : 'neutral';

    // Fill area under curve
    const fillD = `${pathD} L${width},${height} L0,${height} Z`;

    return `
      <svg class="sparkline sparkline--${direction}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" ${id ? `id="${id}"` : ''}>
        <path class="sparkline-fill" d="${fillD}" stroke="none"/>
        <path d="${pathD}" fill="none" stroke-width="${strokeW}" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  },

  /**
   * Generate random sparkline data simulating price movement
   * @param {number} basePrice - Starting price
   * @param {number} points - Number of data points
   * @param {number} volatility - Volatility factor (0-1)
   * @returns {number[]}
   */
  generateData(basePrice, points = 20, volatility = 0.02) {
    const data = [basePrice];
    for (let i = 1; i < points; i++) {
      const prev = data[i - 1];
      const change = prev * (Math.random() - 0.5) * 2 * volatility;
      data.push(Math.round(prev + change));
    }
    return data;
  }
};

export default Sparkline;
