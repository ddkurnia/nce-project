/* ============================================================================
 * NCE — Profile View
 * ============================================================================ */

import Auth from '../auth.js';
import UserService from '../services/userService.js';
import Modal from '../components/modal.js';
import Toast from '../components/toast.js';
import { escapeHtml, createIcon } from '../utils/helpers.js';

const ProfileView = {
  /**
   * Render profile view
   */
  render() {
    const user = Auth.getUser();
    const isLoggedIn = Auth.isLoggedIn();
    const trustScore = isLoggedIn ? UserService.getTrustScore(user) : 0;
    const circumference = 2 * Math.PI * 34;
    const offset = circumference - (trustScore / 100) * circumference;

    if (!isLoggedIn) {
      return `
        <div class="profile-view view">
          <div class="empty-state" style="padding:48px 24px;">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" stroke-width="1.5" style="margin:0 auto 16px;display:block;opacity:0.4;">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            <div class="empty-state__title">Sign In Required</div>
            <div class="empty-state__desc">Login to view your profile and trading activity</div>
            <button class="btn btn--gold" id="profile-login-btn" style="margin-top:20px;">Login / Register</button>
          </div>
        </div>
      `;
    }

    const name = user?.name || user?.displayName || 'Trader';
    const email = user?.email || '';
    const role = user?.role || 'buyer';
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return `
      <div class="profile-view view">
        <!-- Profile Header -->
        <div class="profile-header">
          <div class="profile-avatar">
            <span style="font-size:24px;font-weight:700;">${escapeHtml(initials)}</span>
          </div>
          <div class="profile-name">${escapeHtml(name)}</div>
          <div class="profile-role">${escapeHtml(role.charAt(0).toUpperCase() + role.slice(1))}</div>
          <div class="profile-badges">
            <span class="badge badge--gold">Trust Score</span>
            <span class="badge badge--verified">✓ Verified</span>
          </div>
        </div>

        <!-- Trust Score Section -->
        <div class="trust-section">
          <div class="trust-circle">
            <svg viewBox="0 0 80 80">
              <circle class="trust-circle__bg" cx="40" cy="40" r="34"/>
              <circle class="trust-circle__progress" cx="40" cy="40" r="34"
                stroke-dasharray="${circumference}"
                stroke-dashoffset="${offset}"/>
            </svg>
            <div class="trust-circle__value">${trustScore}</div>
          </div>
          <div class="trust-info">
            <div class="trust-info__label">Trust Score</div>
            <div class="trust-info__desc">
              Based on transaction history, verification status, and platform activity
            </div>
          </div>
        </div>

        <!-- Profile Info Card -->
        <div class="card" style="margin-bottom:16px;">
          <div style="font-size:13px;color:var(--text-muted);margin-bottom:4px;">Email</div>
          <div style="font-size:14px;font-weight:500;">${escapeHtml(email)}</div>
        </div>

        <!-- Menu -->
        <div class="profile-menu">
          <button class="profile-menu-item" data-action="my-listings">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            My Listings
            <span class="profile-menu-item__chevron">›</span>
          </button>
          <button class="profile-menu-item" data-action="my-rfqs">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            My RFQs
            <span class="profile-menu-item__chevron">›</span>
          </button>
          <button class="profile-menu-item" data-action="settings">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
            Settings
            <span class="profile-menu-item__chevron">›</span>
          </button>
          <button class="profile-menu-item profile-menu-item--danger" data-action="logout">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Logout
          </button>
        </div>
      </div>
    `;
  },

  /**
   * Initialize profile view
   */
  init() {
    const loginBtn = document.getElementById('profile-login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('nce:show-auth'));
      });
    }

    // Menu actions
    document.querySelectorAll('.profile-menu-item').forEach(item => {
      item.addEventListener('click', () => {
        const action = item.dataset.action;
        switch (action) {
          case 'my-listings':
            Toast.info('My Listings coming soon');
            break;
          case 'my-rfqs':
            window.location.hash = '#/rfq';
            break;
          case 'settings':
            Toast.info('Settings coming soon');
            break;
          case 'logout':
            this._handleLogout();
            break;
        }
      });
    });
  },

  async _handleLogout() {
    try {
      await Auth.logout();
      Toast.success('Logged out successfully');
      // Re-render profile view
      window.dispatchEvent(new CustomEvent('nce:navigate', { detail: 'profile' }));
    } catch {
      Toast.error('Failed to logout');
    }
  }
};

export default ProfileView;
