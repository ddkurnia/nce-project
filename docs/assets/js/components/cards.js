/* ============================================================================
 * NCE — Card Components
 * ============================================================================ */

import { escapeHtml } from '../utils/helpers.js';
import Formatter from '../utils/formatter.js';

const Cards = {
  /**
   * Commodity card (horizontal scroll item)
   */
  commodity(item) {
    const changeClass = Formatter.changeClass(item.change);
    const arrow = Formatter.changeArrow(item.change);
    const price = item.currentPrice || item.price;

    return `
      <div class="card card--commodity">
        <div class="card__subtitle truncate">${escapeHtml(item.name)}</div>
        <div class="card__price">${Formatter.currency(price, true)}</div>
        <div class="card__change ${changeClass}">
          ${arrow} ${Formatter.percentChange(item.change)}
        </div>
      </div>
    `;
  },

  /**
   * RFQ card
   */
  rfq(item) {
    const status = item.status || 'open';
    const badgeClass = status === 'open' ? 'badge--open' :
                       status === 'in_progress' ? 'badge--in_progress' :
                       'badge--completed';
    const statusText = status === 'in_progress' ? 'In Progress' :
                       status.charAt(0).toUpperCase() + status.slice(1);
    const offers = item.offers || item._count?.offers || 0;
    const targetPrice = item.targetPrice || item.budget || item.price;
    const quantity = item.quantity || item.amount;
    const destination = item.destination || item.location || '-';
    const deadline = item.deadline || item.expiryDate;
    const commodity = item.commodity?.name || item.commodityName || item.title || 'N/A';

    return `
      <div class="card card--rfq" data-status="${escapeHtml(status)}" data-id="${escapeHtml(item.id)}">
        <div class="rfq-card__header">
          <div class="rfq-card__commodity">${escapeHtml(commodity)}</div>
          <span class="badge ${badgeClass}">${statusText}</span>
        </div>
        <div class="rfq-card__details">
          <div class="rfq-card__detail">
            <span class="rfq-card__detail-label">Quantity</span>
            <span class="rfq-card__detail-value">${escapeHtml(Formatter.quantity(quantity))}</span>
          </div>
          <div class="rfq-card__detail">
            <span class="rfq-card__detail-label">Target Price</span>
            <span class="rfq-card__detail-value mono">${Formatter.currency(targetPrice)}</span>
          </div>
          <div class="rfq-card__detail">
            <span class="rfq-card__detail-label">Destination</span>
            <span class="rfq-card__detail-value">${escapeHtml(destination)}</span>
          </div>
          <div class="rfq-card__detail">
            <span class="rfq-card__detail-label">Deadline</span>
            <span class="rfq-card__detail-value">${Formatter.date(deadline, 'relative')}</span>
          </div>
        </div>
        <div class="rfq-card__offers">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          ${offers} offer${offers !== 1 ? 's' : ''}
        </div>
      </div>
    `;
  },

  /**
   * Company card (horizontal scroll)
   */
  company(item) {
    const trustScore = item.trust || 85;
    const verifiedBadge = item.verified ?
      '<span class="badge badge--verified" style="font-size:9px;">✓ Verified</span>' : '';

    return `
      <div class="card card--company">
        <div style="width:40px;height:40px;border-radius:50%;background:var(--gold-glow);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <span style="font-weight:700;color:var(--gold);font-size:14px;">${escapeHtml(item.name.charAt(0))}</span>
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:600;font-size:13px;" class="truncate">${escapeHtml(item.name)}</div>
          <div style="font-size:11px;color:var(--text-faint);">${escapeHtml(item.location)}</div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:4px;">
            <span style="font-family:var(--font-mono);font-size:12px;color:var(--gold);font-weight:600;">${trustScore}/100</span>
            ${verifiedBadge}
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Market mover card
   */
  marketMover(item) {
    const changeClass = Formatter.changeClass(item.change);
    const arrow = Formatter.changeArrow(item.change);
    const price = item.currentPrice || item.price;

    return `
      <div class="card" style="display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="font-weight:600;font-size:13px;">${escapeHtml(item.name)}</div>
          <div style="font-family:var(--font-mono);font-size:12px;color:var(--text-muted);">${Formatter.currency(price)}</div>
        </div>
        <div class="card__change ${changeClass}" style="font-size:14px;font-weight:600;">
          ${arrow} ${Formatter.percentChange(item.change)}
        </div>
      </div>
    `;
  },

  /**
   * Property/opportunity card
   */
  opportunity(item) {
    const title = item.title || item.name || 'Property';
    const location = item.location || item.address || '-';
    const price = item.price || item.value;

    return `
      <div class="card card--company" style="min-width:180px;">
        <div style="width:40px;height:40px;border-radius:var(--radius-md);background:var(--gold-glow);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/></svg>
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:600;font-size:13px;" class="truncate">${escapeHtml(title)}</div>
          <div style="font-size:11px;color:var(--text-faint);">${escapeHtml(location)}</div>
          ${price ? `<div style="font-family:var(--font-mono);font-size:12px;color:var(--gold);font-weight:600;margin-top:2px;">${Formatter.currency(price, true)}</div>` : ''}
        </div>
      </div>
    `;
  }
};

export default Cards;
