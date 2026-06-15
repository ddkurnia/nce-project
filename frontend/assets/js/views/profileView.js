import { getState, subscribe } from '../state.js';
import { isAuthenticated, logout, getStoredUser } from '../auth.js';
import { showSearch } from '../components/header.js';
import { showLoginModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

let container = null;

export async function mount(el) {
  container = el;
  showSearch(false);
  render();
}

function render() {
  if (!container) return;

  const user = getState('user') || getStoredUser();
  const loggedIn = isAuthenticated();

  if (loggedIn && user) {
    renderLoggedIn(user);
  } else {
    renderGuest();
  }
}

function renderLoggedIn(user) {
  const initial = (user.displayName || user.email || 'U')[0].toUpperCase();

  container.innerHTML = `
    <div class="profile-view">
      <div class="view-container">
        <div class="profile-header">
          <div class="avatar">${initial}</div>
          <div class="profile-name">${user.displayName || 'Trader'}</div>
          <div class="profile-email">${user.email || ''}</div>
          <span class="badge badge-gold" style="margin-top:8px;">✓ Terverifikasi</span>
        </div>

        <div class="profile-stats">
          <div class="stat">
            <div class="stat-val text-gold">12</div>
            <div class="stat-lbl">Listing</div>
          </div>
          <div class="stat">
            <div class="stat-val text-success">8</div>
            <div class="stat-lbl">Transaksi</div>
          </div>
          <div class="stat">
            <div class="stat-val" style="color:var(--gold);">4.8</div>
            <div class="stat-lbl">Rating</div>
          </div>
        </div>

        <div class="card" style="padding:0;overflow:hidden;margin-bottom:20px;">
          <ul class="menu-list">
            <li class="menu-item" data-action="edit-profile">
              <svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span class="menu-label">Edit Profil</span>
              <svg class="menu-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </li>
            <li class="menu-item" data-action="verify">
              <svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span class="menu-label">Verifikasi Akun</span>
              <svg class="menu-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </li>
            <li class="menu-item" data-action="settings">
              <svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              <span class="menu-label">Pengaturan</span>
              <svg class="menu-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </li>
            <li class="menu-item" data-action="help">
              <svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span class="menu-label">Bantuan</span>
              <svg class="menu-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </li>
            <li class="menu-item danger" data-action="logout">
              <svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              <span class="menu-label">Keluar</span>
              <svg class="menu-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </li>
          </ul>
        </div>

        <p style="text-align:center;font-size:0.7rem;color:var(--text-muted);">
          NCE v2.0 — Indonesia's Digital Trading Floor
        </p>
      </div>
    </div>
  `;

  attachAuthListeners();
}

function renderGuest() {
  container.innerHTML = `
    <div class="profile-view">
      <div class="view-container">
        <div class="profile-header">
          <div class="avatar" style="font-size:1.5rem;">🔐</div>
          <div class="profile-name">Masuk ke NCE</div>
          <div class="profile-email">Akses fitur lengkap trading floor</div>
        </div>

        <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:24px;">
          <button class="btn btn-primary" id="login-btn" style="width:100%;">Masuk</button>
          <button class="btn btn-outline" id="register-btn" style="width:100%;">Daftar Akun</button>
        </div>

        <div class="card" style="padding:0;overflow:hidden;margin-bottom:20px;">
          <ul class="menu-list">
            <li class="menu-item" data-action="help">
              <svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span class="menu-label">Bantuan</span>
              <svg class="menu-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </li>
          </ul>
        </div>

        <p style="text-align:center;font-size:0.7rem;color:var(--text-muted);">
          NCE v2.0 — Indonesia's Digital Trading Floor
        </p>
      </div>
    </div>
  `;

  const loginBtn = document.getElementById('login-btn');
  const registerBtn = document.getElementById('register-btn');

  if (loginBtn) {
    loginBtn.addEventListener('click', () => showLoginModal());
  }
  if (registerBtn) {
    registerBtn.addEventListener('click', () => {
      import('../components/modal.js').then(m => m.showRegisterModal());
    });
  }
}

function attachAuthListeners() {
  container.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => {
      const action = item.dataset.action;
      switch (action) {
        case 'logout':
          logout().then(() => {
            showToast('Berhasil keluar', 'success');
            render();
          }).catch(() => {
            showToast('Gagal keluar', 'danger');
          });
          break;
        case 'edit-profile':
          showToast('Fitur edit profil segera hadir', 'info');
          break;
        case 'verify':
          showToast('Fitur verifikasi segera hadir', 'info');
          break;
        case 'settings':
          showToast('Fitur pengaturan segera hadir', 'info');
          break;
        case 'help':
          showToast('Hubungi support@nce.id untuk bantuan', 'info');
          break;
      }
    });
  });
}

export function unmount() {
  container = null;
}
