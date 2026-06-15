/* ============================================================================
 * NCE — Market Pulse Ticker Component
 * ============================================================================ */

import { escapeHtml } from '../utils/helpers.js';
import Formatter from '../utils/formatter.js';
import Config from '../config.js';

const MarketPulse = {
  _interval: null,

  /**
   * Render ticker strip
   */
  render() {
    const items = this._generateTickerItems();
    // Duplicate for seamless scroll
    const content = items + items;

    return `
      <div class="app-ticker ticker-strip" role="marquee" aria-label="Market ticker">
        <div class="ticker-track">
          ${content}
        </div>
      </div>
    `;
  },

  /**
   * Generate ticker items HTML
   */
  _generateTickerItems() {
    return Config.COMMODITIES.map(c => {
      const fluctuation = (Math.random() - 0.5) * 3;
      const price = Math.round(c.price * (1 + fluctuation / 100));
      const change = +(c.change + fluctuation * 0.3).toFixed(2);
      const changeClass = change >= 0 ? 'ticker-item__change--up' : 'ticker-item__change--down';
      const arrow = change >= 0 ? '▲' : '▼';

      return `
        <span class="ticker-item">
          <span class="ticker-item__name">${escapeHtml(c.name)}</span>
          <span class="ticker-item__price">${Formatter.currency(price, true)}</span>
          <span class="ticker-item__change ${changeClass}">${arrow}${Formatter.percentChange(change)}</span>
          <span class="ticker-item__sep">|</span>
        </span>
      `;
    }).join('');
  },

  /**
   * Initialize ticker — set up periodic refresh
   */
  init() {
    // Refresh ticker every 30 seconds
    this._interval = setInterval(() => {
      this.refresh();
    }, 30000);
  },

  /**
   * Refresh ticker data
   */
  refresh() {
    const strip = document.querySelector('.ticker-strip .ticker-track');
    if (!strip) return;
    const items = this._generateTickerItems();
    strip.innerHTML = items + items;
  },

  /**
   * Destroy ticker interval
   */
  destroy() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
  }
};

export default MarketPulse;
