/**
 * formatter.js - Data Formatting Utilities
 * Nusantara Commodity Exchange (NCE)
 *
 * Provides formatting functions for currency, numbers, dates,
 * commodity types, statuses, and other display values.
 */

// ---------------------------------------------------------------------------
// Mapping tables
// ---------------------------------------------------------------------------

const COMMODITY_TYPE_MAP = {
  pinang: 'Pinang',
  kelapa: 'Kelapa',
  sawit: 'Sawit',
  kakao: 'Kakao',
  kopi: 'Kopi',
  karet: 'Karet',
  sagu: 'Sagu',
  rumputLaut: 'Rumput Laut',
};

const PROPERTY_TYPE_MAP = {
  rumah: 'Rumah',
  tanah: 'Tanah',
  ruko: 'Ruko',
  gudang: 'Gudang',
};

const STATUS_MAP = {
  active: 'Aktif',
  pending: 'Menunggu',
  verified: 'Terverifikasi',
  rejected: 'Ditolak',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

// ---------------------------------------------------------------------------
// Currency & Number formatting
// ---------------------------------------------------------------------------

/**
 * Format a number as Indonesian currency.
 * Example: formatCurrency(1234567) → "Rp 1.234.567"
 *
 * @param {number} amount   - The amount to format.
 * @param {string} currency - Currency code (default 'IDR').
 * @returns {string} Formatted currency string.
 */
export function formatCurrency(amount, currency = 'IDR') {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return currency === 'IDR' ? 'Rp 0' : `${currency} 0`;
  }

  const numericAmount = Math.round(Number(amount));
  const formatted = Math.abs(numericAmount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  const sign = numericAmount < 0 ? '-' : '';

  if (currency === 'IDR') {
    return `Rp ${sign}${formatted}`;
  }

  return `${currency} ${sign}${formatted}`;
}

/**
 * Format a number with thousand separators (Indonesian style uses dots).
 * Example: formatNumber(1234567) → "1.234.567"
 *
 * @param {number} num - The number to format.
 * @returns {string} Formatted number string.
 */
export function formatNumber(num) {
  if (num === null || num === undefined || Number.isNaN(Number(num))) {
    return '0';
  }

  const numericValue = Number(num);
  const isNegative = numericValue < 0;
  const absoluteStr = Math.abs(numericValue).toString();
  const [integerPart, decimalPart] = absoluteStr.split('.');
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  let result = formattedInteger;
  if (decimalPart !== undefined) {
    result += `,${decimalPart}`;
  }

  return isNegative ? `-${result}` : result;
}

/**
 * Format weight/volume with unit.
 * Example: formatVolume(1500, 'kg') → "1.500 kg"
 *
 * @param {number} volume - The volume/weight value.
 * @param {string} unit   - Unit string (default 'kg').
 * @returns {string} Formatted volume string.
 */
export function formatVolume(volume, unit = 'kg') {
  if (volume === null || volume === undefined || Number.isNaN(Number(volume))) {
    return `0 ${unit}`;
  }

  return `${formatNumber(volume)} ${unit}`;
}

// ---------------------------------------------------------------------------
// Date & Time formatting
// ---------------------------------------------------------------------------

/**
 * Format a date to DD/MM/YYYY.
 *
 * @param {Date|string|number} date - Date value to format.
 * @returns {string} Formatted date string or '-' if invalid.
 */
export function formatDate(date) {
  const d = parseDate(date);
  if (!d) return '-';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Format a date to DD/MM/YYYY HH:mm.
 *
 * @param {Date|string|number} date - Date value to format.
 * @returns {string} Formatted datetime string or '-' if invalid.
 */
export function formatDateTime(date) {
  const d = parseDate(date);
  if (!d) return '-';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Format a date as a relative time string in Indonesian.
 * Examples: "5 menit lalu", "2 jam lalu", "3 hari lalu"
 *
 * @param {Date|string|number} date - Date value to format.
 * @returns {string} Relative time string in Indonesian.
 */
export function formatRelativeTime(date) {
  const d = parseDate(date);
  if (!d) return '-';

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();

  if (diffMs < 0) {
    return 'Baru saja';
  }

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) {
    return 'Baru saja';
  }
  if (minutes < 60) {
    return `${minutes} menit lalu`;
  }
  if (hours < 24) {
    return `${hours} jam lalu`;
  }
  if (days < 7) {
    return `${days} hari lalu`;
  }
  if (weeks < 5) {
    return `${weeks} minggu lalu`;
  }
  if (months < 12) {
    return `${months} bulan lalu`;
  }

  return `${years} tahun lalu`;
}

// ---------------------------------------------------------------------------
// Percentage & Compact number
// ---------------------------------------------------------------------------

/**
 * Format a value as percentage with + sign for positive values.
 * Example: formatPercentage(5.2) → "+5,2%", formatPercentage(-3.1) → "-3,1%"
 *
 * @param {number} value - The percentage value.
 * @returns {string} Formatted percentage string.
 */
export function formatPercentage(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '0%';
  }

  const numericValue = Number(value);
  const formatted = numericValue.toLocaleString('id-ID', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });

  const sign = numericValue > 0 ? '+' : '';

  return `${sign}${formatted}%`;
}

/**
 * Format a number in compact notation.
 * Examples: formatCompactNumber(1200) → "1,2K", formatCompactNumber(3500000) → "3,5M"
 *
 * @param {number} num - The number to compact.
 * @returns {string} Compact number string.
 */
export function formatCompactNumber(num) {
  if (num === null || num === undefined || Number.isNaN(Number(num))) {
    return '0';
  }

  const numericValue = Number(num);

  if (numericValue === 0) return '0';

  const absoluteValue = Math.abs(numericValue);
  const sign = numericValue < 0 ? '-' : '';

  if (absoluteValue >= 1_000_000_000_000) {
    return `${sign}${(absoluteValue / 1_000_000_000_000).toFixed(1).replace(/\.0$/, '')}T`;
  }
  if (absoluteValue >= 1_000_000_000) {
    return `${sign}${(absoluteValue / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (absoluteValue >= 1_000_000) {
    return `${sign}${(absoluteValue / 1_000_000).toFixed(1).replace(/\.0$/, '')}Jt`;
  }
  if (absoluteValue >= 1_000) {
    return `${sign}${(absoluteValue / 1_000).toFixed(1).replace(/\.0$/, '')}Rb`;
  }

  return `${sign}${absoluteValue}`;
}

// ---------------------------------------------------------------------------
// Text formatting
// ---------------------------------------------------------------------------

/**
 * Truncate text to maxLength and append ellipsis.
 *
 * @param {string} text      - The text to truncate.
 * @param {number} maxLength - Maximum character length (default 100).
 * @returns {string} Truncated text with ellipsis or original text.
 */
export function truncateText(text, maxLength = 100) {
  if (!text || typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;

  return `${text.slice(0, maxLength)}…`;
}

/**
 * Convert text to a URL-friendly slug.
 * Example: slugify("Kopi Arabika Gayo") → "kopi-arabika-gayo"
 *
 * @param {string} text - The text to slugify.
 * @returns {string} URL-friendly slug.
 */
export function slugify(text) {
  if (!text || typeof text !== 'string') return '';

  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    .replace(/[ð]/g, 'd')
    .replace(/[þ]/g, 'th')
    .replace(/[ß]/g, 'ss')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ---------------------------------------------------------------------------
// Location & Type formatting
// ---------------------------------------------------------------------------

/**
 * Format city and province as "Kota, Provinsi".
 *
 * @param {string} city     - City name.
 * @param {string} province - Province name.
 * @returns {string} Formatted location string.
 */
export function formatLocation(city, province) {
  const cityStr = (city || '').toString().trim();
  const provinceStr = (province || '').toString().trim();

  if (!cityStr && !provinceStr) return '-';
  if (!cityStr) return provinceStr;
  if (!provinceStr) return cityStr;

  return `${cityStr}, ${provinceStr}`;
}

/**
 * Map English commodity type keys to Indonesian labels.
 *
 * @param {string} type - Commodity type key.
 * @returns {string} Indonesian label or the original key.
 */
export function formatCommodityType(type) {
  if (!type) return '-';
  return COMMODITY_TYPE_MAP[type] || type;
}

/**
 * Map English property type keys to Indonesian labels.
 *
 * @param {string} type - Property type key.
 * @returns {string} Indonesian label or the original key.
 */
export function formatPropertyType(type) {
  if (!type) return '-';
  return PROPERTY_TYPE_MAP[type] || type;
}

/**
 * Map English status keys to Indonesian labels.
 *
 * @param {string} status - Status key.
 * @returns {string} Indonesian label or the original status.
 */
export function formatStatus(status) {
  if (!status) return '-';
  return STATUS_MAP[status] || status;
}

// ---------------------------------------------------------------------------
// Rating & Masking
// ---------------------------------------------------------------------------

/**
 * Format a numeric rating (1-5) as a star display string.
 * Example: formatRating(4) → "★★★★☆"
 *
 * @param {number} rating - Rating value (1-5).
 * @returns {string} Star display string.
 */
export function formatRating(rating) {
  if (rating === null || rating === undefined || Number.isNaN(Number(rating))) {
    return '☆☆☆☆☆';
  }

  const numericRating = Math.min(5, Math.max(0, Math.round(Number(rating))));
  const filled = '★'.repeat(numericRating);
  const empty = '☆'.repeat(5 - numericRating);

  return `${filled}${empty}`;
}

/**
 * Mask an NPWP number for privacy, showing only the last 4 digits.
 * Example: maskNPWP("123456789012345") → "***********2345"
 *
 * @param {string} npwp - NPWP number string.
 * @returns {string} Masked NPWP string.
 */
export function maskNPWP(npwp) {
  if (!npwp || typeof npwp !== 'string') return '***************';

  const cleanNpwp = npwp.replace(/[\s.-]/g, '');

  if (cleanNpwp.length < 4) return '***************';

  const visibleDigits = cleanNpwp.slice(-4);
  const maskedPart = '*'.repeat(cleanNpwp.length - 4);

  return `${maskedPart}${visibleDigits}`;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Parse various date input types into a Date object.
 *
 * @param {Date|string|number} date - Date input.
 * @returns {Date|null} Parsed Date object or null if invalid.
 */
function parseDate(date) {
  if (!date) return null;

  if (date instanceof Date) {
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
