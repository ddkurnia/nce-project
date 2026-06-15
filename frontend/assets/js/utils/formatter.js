export function formatRupiah(amount) {
  if (amount == null || isNaN(amount)) return 'Rp 0';
  const num = Math.round(Number(amount));
  return 'Rp ' + num.toLocaleString('id-ID');
}

export function formatNumber(num) {
  if (num == null || isNaN(num)) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString('id-ID');
}

export function formatPercent(value) {
  if (value == null || isNaN(value)) return '0.00%';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${parseFloat(value).toFixed(2)}%`;
}

export function formatVolume(vol) {
  if (!vol) return '0';
  return formatNumber(vol);
}

export function formatChange(change) {
  if (change == null || isNaN(change)) return '0.00';
  const sign = change >= 0 ? '+' : '';
  return `${sign}${parseFloat(change).toFixed(2)}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatWeight(kg) {
  if (!kg) return '0 kg';
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)} ton`;
  return `${kg.toLocaleString('id-ID')} kg`;
}
