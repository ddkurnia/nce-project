/* ============================================================================
 * NCE — Bottom Navigation Component
 * ============================================================================ */

import { createIcon } from '../utils/helpers.js';
import Config from '../config.js';

const BottomNav = {
  /**
   * Navigation items
   */
  items: [
    { id: Config.ROUTES.HOME, label: 'Home', icon: 'home' },
    { id: Config.ROUTES.MARKET, label: 'Market', icon: 'trending-up' },
    { id: Config.ROUTES.RFQ, label: 'RFQ', icon: 'file-text', prominent: true },
    { id: Config.ROUTES.MESSAGES, label: 'Chat', icon: 'message-circle' },
    { id: Config.ROUTES.PROFILE, label: 'Profile', icon: 'user' },
  ],

  /**
   * Render bottom nav
   */
  render(activeRoute) {
    const navItems = this.items.map(item => {
      const isActive = item.id === activeRoute;
      const cls = [
        'nav-item',
        isActive ? 'active' : '',
        item.prominent ? 'nav-item--rfq' : ''
      ].filter(Boolean).join(' ');

      return `
        <button class="${cls}" data-route="${item.id}" aria-label="${item.label}" aria-current="${isActive ? 'page' : 'false'}">
          <svg width="${item.prominent ? 24 : 22}" height="${item.prominent ? 24 : 22}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            ${this._getIconPath(item.icon)}
          </svg>
          <span>${item.label}</span>
        </button>
      `;
    }).join('');

    return `
      <nav class="app-bottom-nav bottom-nav" role="navigation" aria-label="Main navigation">
        ${navItems}
      </nav>
    `;
  },

  /**
   * Initialize bottom nav
   */
  init() {
    const nav = document.querySelector('.bottom-nav');
    if (!nav) return;

    nav.addEventListener('click', (e) => {
      const btn = e.target.closest('.nav-item');
      if (!btn) return;

      const route = btn.dataset.route;
      if (route) {
        window.location.hash = `#/${route}`;
      }
    });
  },

  /**
   * Update active state
   */
  setActive(route) {
    const nav = document.querySelector('.bottom-nav');
    if (!nav) return;

    nav.querySelectorAll('.nav-item').forEach(btn => {
      const isActive = btn.dataset.route === route;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
  },

  /**
   * Get SVG path data for icon name
   */
  _getIconPath(name) {
    const paths = {
      home: '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
      'trending-up': '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
      'file-text': '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
      'message-circle': '<path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>',
      user: '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>'
    };
    return paths[name] || '';
  }
};

export default BottomNav;
