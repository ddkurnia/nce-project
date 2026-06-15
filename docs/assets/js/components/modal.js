import { loginWithEmail, registerWithEmail } from '../auth.js';
import { showToast } from './toast.js';
import { COMMODITY_TYPES, LOCATIONS } from '../constants/commodities.js';

let activeModal = null;

export function showModal(options = {}) {
  const {
    title = '',
    content = '',
    onClose = null,
    size = 'default',
  } = options;

  closeModal();

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.id = 'modal-backdrop';

  backdrop.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>${title}</h3>
        <button class="modal-close" id="modal-close-btn" aria-label="Tutup">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="modal-body">${content}</div>
    </div>
  `;

  document.body.appendChild(backdrop);
  activeModal = { element: backdrop, onClose };

  backdrop.querySelector('#modal-close-btn').addEventListener('click', closeModal);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });

  document.addEventListener('keydown', handleEscape);

  return backdrop;
}

function handleEscape(e) {
  if (e.key === 'Escape') closeModal();
}

export function closeModal() {
  const backdrop = document.getElementById('modal-backdrop');
  if (backdrop) {
    backdrop.remove();
  }
  document.removeEventListener('keydown', handleEscape);
  if (activeModal?.onClose) activeModal.onClose();
  activeModal = null;
}

export function showLoginModal() {
  const content = `
    <form id="login-form">
      <div style="margin-bottom:14px;">
        <label style="font-size:0.8rem;color:var(--text-muted);display:block;margin-bottom:6px;">Email</label>
        <input type="email" id="login-email" placeholder="email@contoh.com" required autocomplete="email">
      </div>
      <div style="margin-bottom:14px;">
        <label style="font-size:0.8rem;color:var(--text-muted);display:block;margin-bottom:6px;">Kata Sandi</label>
        <input type="password" id="login-password" placeholder="Masukkan kata sandi" required autocomplete="current-password">
      </div>
      <button type="submit" class="btn btn-primary" style="width:100%;margin-top:8px;">Masuk</button>
      <p style="text-align:center;font-size:0.8rem;color:var(--text-muted);margin-top:12px;">
        Belum punya akun? <a href="#" id="switch-to-register" style="color:var(--gold);">Daftar</a>
      </p>
    </form>
  `;

  const modal = showModal({ title: 'Masuk ke NCE', content });

  modal.querySelector('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
      await loginWithEmail(email, password);
      closeModal();
      showToast('Berhasil masuk!', 'success');
    } catch (err) {
      showToast(err.message || 'Gagal masuk', 'danger');
    }
  });

  modal.querySelector('#switch-to-register').addEventListener('click', (e) => {
    e.preventDefault();
    closeModal();
    showRegisterModal();
  });
}

export function showRegisterModal() {
  const content = `
    <form id="register-form">
      <div style="margin-bottom:14px;">
        <label style="font-size:0.8rem;color:var(--text-muted);display:block;margin-bottom:6px;">Nama Lengkap</label>
        <input type="text" id="reg-name" placeholder="Nama lengkap" required>
      </div>
      <div style="margin-bottom:14px;">
        <label style="font-size:0.8rem;color:var(--text-muted);display:block;margin-bottom:6px;">Email</label>
        <input type="email" id="reg-email" placeholder="email@contoh.com" required autocomplete="email">
      </div>
      <div style="margin-bottom:14px;">
        <label style="font-size:0.8rem;color:var(--text-muted);display:block;margin-bottom:6px;">Kata Sandi</label>
        <input type="password" id="reg-password" placeholder="Min. 6 karakter" required minlength="6" autocomplete="new-password">
      </div>
      <button type="submit" class="btn btn-primary" style="width:100%;margin-top:8px;">Daftar</button>
      <p style="text-align:center;font-size:0.8rem;color:var(--text-muted);margin-top:12px;">
        Sudah punya akun? <a href="#" id="switch-to-login" style="color:var(--gold);">Masuk</a>
      </p>
    </form>
  `;

  const modal = showModal({ title: 'Daftar Akun NCE', content });

  modal.querySelector('#register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    try {
      await registerWithEmail(email, password, name);
      closeModal();
      showToast('Pendaftaran berhasil!', 'success');
    } catch (err) {
      showToast(err.message || 'Gagal mendaftar', 'danger');
    }
  });

  modal.querySelector('#switch-to-login').addEventListener('click', (e) => {
    e.preventDefault();
    closeModal();
    showLoginModal();
  });
}

export function showCreateRFQModal() {
  const commodityOptions = COMMODITY_TYPES.map(c =>
    `<option value="${c.key}">${c.icon} ${c.label}</option>`
  ).join('');

  const locationOptions = LOCATIONS.map(l =>
    `<option value="${l}">${l}</option>`
  ).join('');

  const content = `
    <form id="rfq-form">
      <div style="margin-bottom:14px;">
        <label style="font-size:0.8rem;color:var(--text-muted);display:block;margin-bottom:6px;">Jenis Komoditas</label>
        <select id="rfq-commodity" required>${commodityOptions}</select>
      </div>
      <div style="margin-bottom:14px;">
        <label style="font-size:0.8rem;color:var(--text-muted);display:block;margin-bottom:6px;">Volume (kg)</label>
        <input type="number" id="rfq-volume" placeholder="1000" required min="1">
      </div>
      <div style="margin-bottom:14px;">
        <label style="font-size:0.8rem;color:var(--text-muted);display:block;margin-bottom:6px;">Harga Target (Rp/kg)</label>
        <input type="number" id="rfq-price" placeholder="12500" required min="1">
      </div>
      <div style="margin-bottom:14px;">
        <label style="font-size:0.8rem;color:var(--text-muted);display:block;margin-bottom:6px;">Lokasi</label>
        <select id="rfq-location" required>${locationOptions}</select>
      </div>
      <div style="margin-bottom:14px;">
        <label style="font-size:0.8rem;color:var(--text-muted);display:block;margin-bottom:6px;">Deskripsi</label>
        <textarea id="rfq-desc" rows="3" placeholder="Deskripsi kebutuhan..." style="resize:vertical;"></textarea>
      </div>
      <button type="submit" class="btn btn-primary" style="width:100%;">Buat RFQ</button>
    </form>
  `;

  const modal = showModal({ title: 'Buat Permintaan (RFQ)', content });

  modal.querySelector('#rfq-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    showToast('RFQ berhasil dibuat!', 'success');
    closeModal();
  });
}
