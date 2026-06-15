export const REQUEST_STATUSES = [
  { key: 'open', label: 'Terbuka', color: '#22C55E', badgeClass: 'badge-success' },
  { key: 'in_progress', label: 'Diproses', color: '#D4AF37', badgeClass: 'badge-gold' },
  { key: 'fulfilled', label: 'Terpenuhi', color: '#3B82F6', badgeClass: 'badge-info' },
  { key: 'closed', label: 'Ditutup', color: '#64748B', badgeClass: 'badge-muted' },
  { key: 'cancelled', label: 'Dibatalkan', color: '#EF4444', badgeClass: 'badge-danger' },
];

export function getStatusLabel(key) {
  const status = REQUEST_STATUSES.find(s => s.key === key);
  return status ? status.label : key;
}

export function getStatusBadgeClass(key) {
  const status = REQUEST_STATUSES.find(s => s.key === key);
  return status ? status.badgeClass : 'badge-muted';
}

export function getStatusColor(key) {
  const status = REQUEST_STATUSES.find(s => s.key === key);
  return status ? status.color : '#64748B';
}
