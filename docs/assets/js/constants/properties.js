export const PROPERTY_TYPES = [
  { key: 'rumah', label: 'Rumah', icon: '🏠' },
  { key: 'tanah', label: 'Tanah', icon: '🏗️' },
  { key: 'ruko', label: 'Ruko', icon: '🏢' },
  { key: 'gudang', label: 'Gudang', icon: '🏭' },
];

export function getPropertyLabel(key) {
  const item = PROPERTY_TYPES.find(p => p.key === key);
  return item ? item.label : key;
}

export function getPropertyIcon(key) {
  const item = PROPERTY_TYPES.find(p => p.key === key);
  return item ? item.icon : '🏠';
}
