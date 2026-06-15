/* ============================================================================
 * NCE — Header Component
 * Enhanced with market status indicator
 * ============================================================================ */

import { escapeHtml, createIcon } from '../utils/helpers.js';
import Auth from '../auth.js';

const Header = {
  /**
   * Render header
   */
  render() {
    const isOpen = this._isMarketOpen();
    const statusClass = isOpen ? 'market-status--open' : 'market-status--closed';
    const statusText = isOpen ? 'Open' : 'Closed';

    return `
      <header class="app-header header" role="banner">
        <div class="header-logo">
          <img src="./assets/images/nce-icon.svg" alt="NCE" width="28" height="28">
          <span>NCE</span>
        </div>
        <div class="header-market-status ${statusClass}">
          <div class="header-market-status__dot" style="${isOpen ? '' : 'background:var(--danger);animation:none;'}"></div>
          ${statusText}
        </div>
        <div class="header-actions">
          <button class="header-btn" id="header-notification" aria-label="Notifications">
          </button>
          <button class="header-btn" id="header-profile" aria-label="Profile">
          </button>
        </div>
      </header>
    `;
  },

  /**
   * Initialize header after render
   */
  init() {
    const notifBtn = document.getElementById('header-notification');
    const profileBtn = document.getElementById('header-profile');

    if (notifBtn) {
      notifBtn.appendChild(createIcon('bell', 20));

      // Add notification badge if logged in
      if (Auth.isLoggedIn()) {
        const badge = document.createElement('span');
        badge.className = 'header-btn__badge';
        notifBtn.appendChild(badge);
      }

      notifBtn.addEventListener('click', () => {
        // TODO: Show notifications panel
      });
    }

    if (profileBtn) {
      profileBtn.appendChild(createIcon('user', 20));
      profileBtn.addEventListener('click', () => {
        window.location.hash = '#/profile';
      });
    }
  },

  /**
   * Check if market is "open" (simulated: Mon-Fri 09:00-17:00 WIB)
   */
  _isMarketOpen() {
    const now = new Date();
    const wibOffset = 7 * 60; // UTC+7
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const wib = new Date(utc + wibOffset * 60000);
    const day = wib.getDay();
    const hour = wib.getHours();

    // Market open Mon-Fri 09:00-17:00 WIB
    return day >= 1 && day <= 5 && hour >= 9 && hour < 17;
  }
};

export default Header;
