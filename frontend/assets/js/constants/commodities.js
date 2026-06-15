export const COMMODITY_TYPES = [
  { key: 'sawit', label: 'Sawit', icon: '🌴' },
  { key: 'kopi', label: 'Kopi', icon: '☕' },
  { key: 'kakao', label: 'Kakao', icon: '🫘' },
  { key: 'karet', label: 'Karet', icon: '🌳' },
  { key: 'pinang', label: 'Pinang', icon: '🥥' },
  { key: 'kelapa', label: 'Kelapa', icon: '🥥' },
  { key: 'sagu', label: 'Sagu', icon: '🌾' },
  { key: 'rumputLaut', label: 'Rumput Laut', icon: '🌿' },
];

export const LOCATIONS = [
  'Jakarta', 'Surabaya', 'Medan', 'Bandung', 'Makassar',
  'Palembang', 'Semarang', 'Manado', 'Pontianak', 'Banjarmasin',
  'Jayapura', 'Ambon', 'Kupang', 'Mataram', 'Denpasar',
];

export function getCommodityLabel(key) {
  const item = COMMODITY_TYPES.find(c => c.key === key);
  return item ? item.label : key;
}

export function getCommodityIcon(key) {
  const item = COMMODITY_TYPES.find(c => c.key === key);
  return item ? item.icon : '📦';
}
