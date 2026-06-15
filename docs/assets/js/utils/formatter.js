/* ============================================================================
 * NCE — Formatter Utilities
 * ============================================================================ */

const Formatter = {
  /**
   * Format number as Indonesian Rupiah
   */
  currency(value, compact = false) {
    if (value == null) return 'Rp0';
    const num = Number(value);
    if (isNaN(num)) return 'Rp0';

    if (compact && num >= 1000000) {
      return 'Rp' + (num / 1000000).toFixed(1) + 'M';
    }
    if (compact && num >= 1000) {
      return 'Rp' + (num / 1000).toFixed(0) + 'K';
    }
    return 'Rp' + num.toLocaleString('id-ID');
  },

  /**
   * Format price with unit
   */
  priceWithUnit(value, unit = 'kg') {
    return `${this.currency(value)}/${unit}`;
  },

  /**
   * Format percentage change
   */
  percentChange(value, withSign = true) {
    if (value == null) return '0.00%';
    const sign = withSign && value > 0 ? '+' : '';
    return `${sign}${Number(value).toFixed(2)}%`;
  },

  /**
   * Format quantity with unit
   */
  quantity(value, unit = 'kg') {
    if (value == null) return `0 ${unit}`;
    const num = Number(value);
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)} ton`;
    }
    return `${num.toLocaleString('id-ID')} ${unit}`;
  },

  /**
   * Format date to locale string
   */
  date(dateStr, format = 'short') {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';

    if (format === 'short') {
      return d.toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
    }
    if (format === 'relative') {
      const now = Date.now();
      const diff = now - d.getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      const days = Math.floor(hrs / 24);
      if (days < 7) return `${days}d ago`;
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    }
    return d.toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  },

  /**
   * Format number with commas
   */
  number(value) {
    if (value == null) return '0';
    return Number(value).toLocaleString('id-ID');
  },

  /**
   * Get change direction class
   */
  changeClass(value) {
    if (value > 0) return 'card__change--up';
    if (value < 0) return 'card__change--down';
    return '';
  },

  /**
   * Get change arrow symbol
   */
  changeArrow(value) {
    if (value > 0) return '▲';
    if (value < 0) return '▼';
    return '—';
  },

  /**
   * Format trust score
   */
  trustScore(value) {
    if (value == null) return 0;
    return Math.min(99, Math.max(0, Number(value)));
  }
};

export default Formatter;
