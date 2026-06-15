// Business Matching — smart suggestions between buyers and sellers
import { formatRupiah, formatWeight, formatPercent } from '../utils/formatter.js';
import { getCommodityIcon, getCommodityLabel } from '../constants/commodities.js';
import { getRandomInt } from '../utils/helpers.js';

function generateMockMatches() {
  const matches = [
    { id: 'm1', type: 'seller', name: 'PT Sawit Jaya Mandiri', commodity: 'sawit', volume: 5000, price: 12200, location: 'Medan', rating: 4.8, matchScore: 95, trustLevel: 'gold', verified: true, responseTime: '< 1 jam' },
    { id: 'm2', type: 'seller', name: 'CV Kopi Nusantara', commodity: 'kopi', volume: 2000, price: 82000, location: 'Bandung', rating: 4.5, matchScore: 88, trustLevel: 'silver', verified: true, responseTime: '< 3 jam' },
    { id: 'm3', type: 'buyer', name: 'PT Karet Indo Global', commodity: 'karet', volume: 3000, price: 16200, location: 'Palembang', rating: 4.6, matchScore: 82, trustLevel: 'silver', verified: true, responseTime: '< 2 jam' },
    { id: 'm4', type: 'seller', name: 'UD Pinang Sejahtera', commodity: 'pinang', volume: 1500, price: 21500, location: 'Makassar', rating: 4.2, matchScore: 76, trustLevel: 'bronze', verified: false, responseTime: '< 6 jam' },
    { id: 'm5', type: 'buyer', name: 'PT Kakao Sulawesi', commodity: 'kakao', volume: 4000, price: 43500, location: 'Manado', rating: 4.9, matchScore: 91, trustLevel: 'gold', verified: true, responseTime: '< 30 menit' },
  ];
  return matches;
}

export function renderMatchCard(match) {
  const icon = getCommodityIcon(match.commodity);
  const label = getCommodityLabel(match.commodity);
  const scoreColor = match.matchScore >= 85 ? 'var(--success)' : match.matchScore >= 70 ? 'var(--gold)' : 'var(--text-secondary)';

  return `
    <div class="match-card" data-id="${match.id}">
      <div class="match-header">
        <div class="match-info">
          <span class="match-type-badge badge ${match.type === 'seller' ? 'badge-success' : 'badge-info'}">${match.type === 'seller' ? 'Penjual' : 'Pembeli'}</span>
          <span class="match-name">${match.name}</span>
          ${match.verified ? '<span class="match-verified" title="Terverifikasi">✓</span>' : ''}
        </div>
        <div class="match-score" style="border-color:${scoreColor};">
          <span class="score-value" style="color:${scoreColor};">${match.matchScore}%</span>
          <span class="score-label">Match</span>
        </div>
      </div>
      <div class="match-body">
        <div class="match-field">
          <span class="label">Komoditas</span>
          <span class="value">${icon} ${label}</span>
        </div>
        <div class="match-field">
          <span class="label">Harga</span>
          <span class="value font-mono">${formatRupiah(match.price)}/kg</span>
        </div>
        <div class="match-field">
          <span class="label">Volume</span>
          <span class="value font-mono">${formatWeight(match.volume)}</span>
        </div>
        <div class="match-field">
          <span class="label">Lokasi</span>
          <span class="value">${match.location}</span>
        </div>
      </div>
      <div class="match-footer">
        <div class="match-meta">
          <span class="match-rating">⭐ ${match.rating}</span>
          <span class="match-response">⚡ ${match.responseTime}</span>
        </div>
        <button class="btn btn-sm btn-outline match-contact-btn" data-id="${match.id}">Hubungi</button>
      </div>
    </div>
  `;
}

export function renderMatchList(matches) {
  if (!matches || !matches.length) {
    return `
      <div class="empty-state">
        <p>Belum ada kecocokan bisnis ditemukan</p>
      </div>
    `;
  }

  const sorted = [...matches].sort((a, b) => b.matchScore - a.matchScore);
  return sorted.map(m => renderMatchCard(m)).join('');
}

export function renderMatchSummary(matches) {
  const total = matches.length;
  const highMatch = matches.filter(m => m.matchScore >= 85).length;
  const sellers = matches.filter(m => m.type === 'seller').length;
  const buyers = matches.filter(m => m.type === 'buyer').length;

  return `
    <div class="match-summary">
      <div class="match-summary-stat">
        <span class="match-summary-val">${total}</span>
        <span class="match-summary-lbl">Kecocokan</span>
      </div>
      <div class="match-summary-stat">
        <span class="match-summary-val text-success">${highMatch}</span>
        <span class="match-summary-lbl">High Match</span>
      </div>
      <div class="match-summary-stat">
        <span class="match-summary-val">${sellers}</span>
        <span class="match-summary-lbl">Penjual</span>
      </div>
      <div class="match-summary-stat">
        <span class="match-summary-val">${buyers}</span>
        <span class="match-summary-lbl">Pembeli</span>
      </div>
    </div>
  `;
}

export { generateMockMatches };
