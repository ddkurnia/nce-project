// Trust Score component — user reputation and verification display
import { formatNumber } from '../utils/formatter.js';

const TRUST_LEVELS = [
  { key: 'new', label: 'Baru', minScore: 0, maxScore: 20, badge: 'badge-muted', icon: '🌱' },
  { key: 'bronze', label: 'Bronze', minScore: 21, maxScore: 40, badge: 'badge-warning', icon: '🥉' },
  { key: 'silver', label: 'Silver', minScore: 41, maxScore: 60, badge: 'badge-info', icon: '🥈' },
  { key: 'gold', label: 'Gold', minScore: 61, maxScore: 80, badge: 'badge-gold', icon: '🥇' },
  { key: 'platinum', label: 'Platinum', minScore: 81, maxScore: 100, badge: 'badge-success', icon: '💎' },
];

const VERIFICATION_STEPS = [
  { key: 'email', label: 'Email', icon: '📧', done: true },
  { key: 'phone', label: 'Telepon', icon: '📱', done: true },
  { key: 'identity', label: 'KTP', icon: '🪪', done: false },
  { key: 'business', label: 'NIB/SIUP', icon: '🏢', done: false },
];

export function getTrustLevel(score) {
  return TRUST_LEVELS.find(l => score >= l.minScore && score <= l.maxScore) || TRUST_LEVELS[0];
}

export function renderTrustBadge(score) {
  const level = getTrustLevel(score);
  return `
    <div class="trust-badge ${level.badge}">
      <span class="trust-icon">${level.icon}</span>
      <span class="trust-level">${level.label}</span>
      <span class="trust-score">${score}</span>
    </div>
  `;
}

export function renderTrustMeter(score, compact = false) {
  const level = getTrustLevel(score);
  const pct = Math.min(100, Math.max(0, score));

  if (compact) {
    return `
      <div class="trust-meter compact">
        <div class="trust-meter-bar">
          <div class="trust-meter-fill" style="width:${pct}%;background:${getScoreColor(score)};"></div>
        </div>
        <span class="trust-meter-label">${level.icon} ${level.label} (${score})</span>
      </div>
    `;
  }

  return `
    <div class="trust-meter">
      <div class="trust-meter-header">
        <span class="trust-meter-title">Trust Score</span>
        <span class="trust-meter-value" style="color:${getScoreColor(score)};">${score}/100</span>
      </div>
      <div class="trust-meter-bar">
        <div class="trust-meter-fill" style="width:${pct}%;background:${getScoreColor(score)};"></div>
      </div>
      <div class="trust-meter-labels">
        ${TRUST_LEVELS.map(l => `
          <span class="trust-meter-label ${l.key === level.key ? 'active' : ''}">${l.icon} ${l.label}</span>
        `).join('')}
      </div>
    </div>
  `;
}

export function renderVerificationProgress(steps = VERIFICATION_STEPS) {
  const completed = steps.filter(s => s.done).length;
  const pct = Math.round((completed / steps.length) * 100);

  return `
    <div class="verification-progress">
      <div class="verification-header">
        <span class="verification-title">Verifikasi Akun</span>
        <span class="verification-pct">${pct}%</span>
      </div>
      <div class="verification-bar">
        <div class="verification-fill" style="width:${pct}%;"></div>
      </div>
      <div class="verification-steps">
        ${steps.map(s => `
          <div class="verification-step ${s.done ? 'done' : ''}">
            <span class="vstep-icon">${s.done ? '✅' : s.icon}</span>
            <span class="vstep-label">${s.label}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function getScoreColor(score) {
  if (score >= 81) return 'var(--success)';
  if (score >= 61) return 'var(--gold)';
  if (score >= 41) return 'var(--info)';
  if (score >= 21) return 'var(--warning)';
  return 'var(--text-muted)';
}

export { TRUST_LEVELS, VERIFICATION_STEPS };
