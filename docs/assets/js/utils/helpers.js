export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function throttle(fn, limit = 100) {
  let inThrottle = false;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => { inThrottle = false; }, limit);
    }
  };
}

export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Baru saja';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} menit lalu`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam lalu`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)} hari lalu`;
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} bulan lalu`;
  return `${Math.floor(seconds / 31536000)} tahun lalu`;
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function truncate(str, len = 50) {
  if (!str || str.length <= len) return str || '';
  return str.substring(0, len) + '...';
}

export function parseHashRoute(hash) {
  const path = hash.replace('#', '') || '/';
  const parts = path.split('/').filter(Boolean);
  return { path, parts };
}

export function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateSparklineData(points = 20, base = 100, volatility = 5) {
  const data = [base];
  for (let i = 1; i < points; i++) {
    const change = (Math.random() - 0.48) * volatility;
    data.push(Math.max(base * 0.8, data[i - 1] + change));
  }
  return data;
}

export function generateMockCommodities() {
  const types = [
    { key: 'sawit', label: 'Sawit', icon: '🌴', price: 12500, vol: 15000 },
    { key: 'kopi', label: 'Kopi', icon: '☕', price: 85000, vol: 5200 },
    { key: 'kakao', label: 'Kakao', icon: '🫘', price: 42000, vol: 3800 },
    { key: 'karet', label: 'Karet', icon: '🌳', price: 15800, vol: 8900 },
    { key: 'pinang', label: 'Pinang', icon: '🥥', price: 22000, vol: 2100 },
    { key: 'kelapa', label: 'Kelapa', icon: '🥥', price: 8500, vol: 6400 },
    { key: 'sagu', label: 'Sagu', icon: '🌾', price: 11500, vol: 1200 },
    { key: 'rumputLaut', label: 'Rumput Laut', icon: '🌿', price: 18500, vol: 950 },
  ];

  return types.map(t => ({
    id: t.key,
    name: t.label,
    icon: t.icon,
    type: t.key,
    price: t.price + getRandomInt(-500, 500),
    change: parseFloat(((Math.random() - 0.4) * 8).toFixed(2)),
    volume: t.vol + getRandomInt(-500, 500),
    sparkline: generateSparklineData(20, t.price, t.price * 0.03),
    location: 'Jakarta',
    unit: 'kg',
  }));
}

export function generateMockRequests() {
  const commodities = ['sawit', 'kopi', 'kakao', 'karet', 'pinang'];
  const statuses = ['open', 'in_progress', 'fulfilled', 'closed'];
  const locations = ['Jakarta', 'Medan', 'Surabaya', 'Makassar'];

  return Array.from({ length: 8 }, (_, i) => ({
    id: `req-${i + 1}`,
    commodityType: commodities[i % commodities.length],
    volume: getRandomInt(100, 5000),
    targetPrice: getRandomInt(10000, 80000),
    status: statuses[i % statuses.length],
    offers: getRandomInt(0, 12),
    location: locations[i % locations.length],
    createdAt: new Date(Date.now() - getRandomInt(1, 72) * 3600000).toISOString(),
    description: 'Mencari supplier terpercaya dengan kualitas premium',
  }));
}
