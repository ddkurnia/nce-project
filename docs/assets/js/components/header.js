/* ============================================================================
 * NCE — Header Component
 * ============================================================================ */

import { escapeHtml, createIcon } from '../utils/helpers.js';
import Auth from '../auth.js';

const Header = {
  /**
   * Render header
   */
  render() {
    return `
      <header class="app-header header" role="banner">
        <div class="header-logo">
          <img src="./assets/images/nce-icon.svg" alt="NCE" width="28" height="28">
          <span>NCE</span>
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
  }
};

export default Header;
