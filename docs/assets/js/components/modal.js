/**
 * Nusantara Commodity Exchange (NCE) - Modal Component
 * Full modal system with forms, confirmations, loading, success, and error states
 */

// ── State ──────────────────────────────────────────────────────────────────
let currentModal = null;
let escapeHandler = null;

// ── SVG Icons ──────────────────────────────────────────────────────────────
const icons = {
  close: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,

  success: `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="8 12 11 15 16 9"/></svg>`,

  error: `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,

  upload: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,

  spinner: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="rgba(16, 185, 129, 0.15)" stroke-width="3"/>
    <path d="M12 2a10 10 0 0 1 10 10" stroke="#10B981" stroke-width="3" stroke-linecap="round">
      <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/>
    </path>
  </svg>`,

  eye: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,

  eyeOff: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
};

// ── Inject Styles ──────────────────────────────────────────────────────────
let modalStylesInjected = false;

function injectModalStyles() {
  if (modalStylesInjected) return;
  modalStylesInjected = true;

  const style = document.createElement('style');
  style.id = 'nce-modal-styles';
  style.textContent = `
    .nce-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      padding: 24px;
      opacity: 0;
      transition: opacity 0.25s ease;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    .nce-modal-overlay.visible {
      opacity: 1;
    }

    .nce-modal-overlay.closing {
      opacity: 0;
    }

    .nce-modal {
      background: linear-gradient(135deg, #111827 0%, #0F172A 100%);
      border: 1px solid rgba(16, 185, 129, 0.12);
      border-radius: 20px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(16, 185, 129, 0.05);
      transform: translateY(20px) scale(0.97);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .nce-modal-overlay.visible .nce-modal {
      transform: translateY(0) scale(1);
    }

    .nce-modal-overlay.closing .nce-modal {
      transform: translateY(20px) scale(0.97);
    }

    .nce-modal-sm { max-width: 400px; }
    .nce-modal-md { max-width: 520px; }
    .nce-modal-lg { max-width: 680px; }
    .nce-modal-xl { max-width: 860px; }

    .nce-modal::-webkit-scrollbar {
      width: 6px;
    }

    .nce-modal::-webkit-scrollbar-track {
      background: transparent;
    }

    .nce-modal::-webkit-scrollbar-thumb {
      background: rgba(16, 185, 129, 0.2);
      border-radius: 3px;
    }

    .nce-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24px 28px 0;
    }

    .nce-modal-title {
      font-size: 20px;
      font-weight: 700;
      color: #F1F5F9;
      margin: 0;
    }

    .nce-modal-close {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      color: #94A3B8;
      cursor: pointer;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .nce-modal-close:hover {
      background: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.3);
      color: #EF4444;
    }

    .nce-modal-body {
      padding: 24px 28px;
      color: #CBD5E1;
      font-size: 14px;
      line-height: 1.6;
    }

    .nce-modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      padding: 0 28px 24px;
    }

    .nce-btn-modal-cancel {
      padding: 10px 24px;
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      color: #94A3B8;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
    }

    .nce-btn-modal-cancel:hover {
      border-color: rgba(255, 255, 255, 0.2);
      color: #E2E8F0;
      background: rgba(255, 255, 255, 0.03);
    }

    .nce-btn-modal-confirm {
      padding: 10px 24px;
      background: linear-gradient(135deg, #10B981, #059669);
      border: none;
      border-radius: 10px;
      color: white;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
    }

    .nce-btn-modal-confirm:hover {
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
    }

    .nce-btn-modal-confirm.danger {
      background: linear-gradient(135deg, #EF4444, #DC2626);
    }

    .nce-btn-modal-confirm.danger:hover {
      box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
    }

    /* Form styles */
    .nce-form-group {
      margin-bottom: 20px;
    }

    .nce-form-label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #94A3B8;
      margin-bottom: 8px;
      letter-spacing: 0.3px;
    }

    .nce-form-label .nce-required {
      color: #EF4444;
      margin-left: 2px;
    }

    .nce-form-input,
    .nce-form-select,
    .nce-form-textarea {
      width: 100%;
      padding: 12px 16px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      color: #F1F5F9;
      font-size: 14px;
      font-family: inherit;
      transition: all 0.2s ease;
      outline: none;
      box-sizing: border-box;
    }

    .nce-form-input::placeholder,
    .nce-form-textarea::placeholder {
      color: #4B5563;
    }

    .nce-form-input:focus,
    .nce-form-select:focus,
    .nce-form-textarea:focus {
      border-color: rgba(16, 185, 129, 0.5);
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
    }

    .nce-form-input.error,
    .nce-form-select.error,
    .nce-form-textarea.error {
      border-color: rgba(239, 68, 68, 0.5);
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }

    .nce-form-select {
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2394A3B8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 14px center;
      padding-right: 36px;
    }

    .nce-form-select option {
      background: #1E293B;
      color: #F1F5F9;
    }

    .nce-form-textarea {
      min-height: 100px;
      resize: vertical;
    }

    .nce-form-error {
      font-size: 12px;
      color: #EF4444;
      margin-top: 6px;
      display: none;
    }

    .nce-form-error.visible {
      display: block;
    }

    .nce-form-row {
      display: flex;
      gap: 16px;
    }

    .nce-form-row .nce-form-group {
      flex: 1;
    }

    .nce-form-input-wrapper {
      position: relative;
    }

    .nce-form-input-wrapper .nce-input-icon {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #64748B;
      cursor: pointer;
      transition: color 0.2s;
    }

    .nce-form-input-wrapper .nce-input-icon:hover {
      color: #94A3B8;
    }

    .nce-form-input-wrapper .nce-form-input {
      padding-right: 40px;
    }

    /* Loading state */
    .nce-modal-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 28px;
    }

    /* Success / Error animations */
    .nce-modal-icon {
      display: flex;
      justify-content: center;
      margin-bottom: 20px;
    }

    .nce-modal-icon svg {
      filter: drop-shadow(0 0 20px currentColor);
    }

    @keyframes nceCheckDraw {
      from { stroke-dashoffset: 24; }
      to { stroke-dashoffset: 0; }
    }

    @keyframes nceCircleDraw {
      from { stroke-dashoffset: 63; }
      to { stroke-dashoffset: 0; }
    }

    .nce-success-circle {
      stroke-dasharray: 63;
      stroke-dashoffset: 63;
      animation: nceCircleDraw 0.4s ease forwards;
    }

    .nce-success-check {
      stroke-dasharray: 24;
      stroke-dashoffset: 24;
      animation: nceCheckDraw 0.3s ease forwards 0.3s;
    }

    .nce-error-circle {
      stroke-dasharray: 63;
      stroke-dashoffset: 63;
      animation: nceCircleDraw 0.4s ease forwards;
    }

    .nce-error-x1 {
      stroke-dasharray: 16;
      stroke-dashoffset: 16;
      animation: nceCheckDraw 0.2s ease forwards 0.3s;
    }

    .nce-error-x2 {
      stroke-dasharray: 16;
      stroke-dashoffset: 16;
      animation: nceCheckDraw 0.2s ease forwards 0.4s;
    }

    .nce-modal-message {
      text-align: center;
      font-size: 16px;
      color: #E2E8F0;
      font-weight: 500;
      margin: 0;
    }

    /* Upload area */
    .nce-upload-area {
      border: 2px dashed rgba(16, 185, 129, 0.2);
      border-radius: 16px;
      padding: 40px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s ease;
      background: rgba(16, 185, 129, 0.02);
    }

    .nce-upload-area:hover {
      border-color: rgba(16, 185, 129, 0.4);
      background: rgba(16, 185, 129, 0.05);
    }

    .nce-upload-area.dragging {
      border-color: #10B981;
      background: rgba(16, 185, 129, 0.1);
    }

    .nce-upload-text {
      font-size: 14px;
      color: #94A3B8;
      margin-top: 12px;
    }

    .nce-upload-hint {
      font-size: 12px;
      color: #4B5563;
      margin-top: 4px;
    }

    .nce-upload-preview {
      margin-top: 16px;
      display: flex;
      justify-content: center;
    }

    .nce-upload-preview img {
      max-width: 200px;
      max-height: 200px;
      border-radius: 12px;
      border: 2px solid rgba(16, 185, 129, 0.2);
    }

    @media (max-width: 640px) {
      .nce-modal-overlay {
        padding: 12px;
        align-items: flex-end;
      }

      .nce-modal {
        border-radius: 20px 20px 0 0;
        max-height: 85vh;
      }

      .nce-modal-sm,
      .nce-modal-md,
      .nce-modal-lg,
      .nce-modal-xl {
        max-width: 100%;
      }

      .nce-form-row {
        flex-direction: column;
        gap: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

// ── Core: Show Modal ───────────────────────────────────────────────────────
export function showModal(options = {}) {
  injectModalStyles();

  // Close any existing modal first
  if (currentModal) {
    _removeModal();
  }

  const {
    title = '',
    content = '',
    size = 'md',
    showFooter = true,
    onConfirm = null,
    onCancel = null,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmDanger = false,
    closeOnOutsideClick = true,
    closeOnEscape = true
  } = options;

  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'nce-modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  if (title) overlay.setAttribute('aria-label', title);

  // Build modal
  overlay.innerHTML = `
    <div class="nce-modal nce-modal-${size}">
      ${title ? `
        <div class="nce-modal-header">
          <h2 class="nce-modal-title">${title}</h2>
          <button class="nce-modal-close" id="nce-modal-close-btn" aria-label="Close modal">
            ${icons.close}
          </button>
        </div>
      ` : ''}
      <div class="nce-modal-body">
        ${content}
      </div>
      ${showFooter ? `
        <div class="nce-modal-footer">
          <button class="nce-btn-modal-cancel" id="nce-modal-cancel-btn">${cancelText}</button>
          <button class="nce-btn-modal-confirm${confirmDanger ? ' danger' : ''}" id="nce-modal-confirm-btn">${confirmText}</button>
        </div>
      ` : ''}
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  // Animate in
  requestAnimationFrame(() => {
    overlay.classList.add('visible');
  });

  // Close button
  const closeBtn = overlay.querySelector('#nce-modal-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      if (onCancel) onCancel();
      closeModal();
    });
  }

  // Cancel button
  const cancelBtn = overlay.querySelector('#nce-modal-cancel-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      if (onCancel) onCancel();
      closeModal();
    });
  }

  // Confirm button
  const confirmBtn = overlay.querySelector('#nce-modal-confirm-btn');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      if (onConfirm) onConfirm();
    });
  }

  // Click outside to close
  if (closeOnOutsideClick) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        if (onCancel) onCancel();
        closeModal();
      }
    });
  }

  // Escape to close
  if (closeOnEscape) {
    escapeHandler = (e) => {
      if (e.key === 'Escape') {
        if (onCancel) onCancel();
        closeModal();
      }
    };
    document.addEventListener('keydown', escapeHandler);
  }

  currentModal = overlay;

  // Focus the first input if exists
  setTimeout(() => {
    const firstInput = overlay.querySelector('input, select, textarea');
    if (firstInput) firstInput.focus();
  }, 300);

  return overlay;
}

// ── Core: Close Modal ──────────────────────────────────────────────────────
export function closeModal() {
  if (!currentModal) return;

  const overlay = currentModal;
  overlay.classList.remove('visible');
  overlay.classList.add('closing');

  // Remove escape handler
  if (escapeHandler) {
    document.removeEventListener('keydown', escapeHandler);
    escapeHandler = null;
  }

  setTimeout(() => {
    if (overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
    document.body.style.overflow = '';
  }, 250);

  currentModal = null;
}

// ── Internal: Force Remove ─────────────────────────────────────────────────
function _removeModal() {
  if (currentModal && currentModal.parentNode) {
    currentModal.parentNode.removeChild(currentModal);
    document.body.style.overflow = '';
  }
  if (escapeHandler) {
    document.removeEventListener('keydown', escapeHandler);
    escapeHandler = null;
  }
  currentModal = null;
}

// ── Internal: Form Validation ──────────────────────────────────────────────
function _validateField(input) {
  const value = input.value.trim();
  const required = input.hasAttribute('data-required');
  const type = input.getAttribute('data-type') || input.type;
  let errorEl = input.parentNode.querySelector('.nce-form-error');

  if (!errorEl) {
    errorEl = input.closest('.nce-form-group')?.querySelector('.nce-form-error');
  }

  let isValid = true;
  let errorMsg = '';

  if (required && !value) {
    isValid = false;
    errorMsg = 'Field ini wajib diisi';
  } else if (value) {
    switch (type) {
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          isValid = false;
          errorMsg = 'Format email tidak valid';
        }
        break;
      case 'phone':
        if (!/^[\d\s\-+()]{8,15}$/.test(value)) {
          isValid = false;
          errorMsg = 'Nomor telepon tidak valid';
        }
        break;
      case 'number':
        if (isNaN(Number(value)) || Number(value) <= 0) {
          isValid = false;
          errorMsg = 'Masukkan angka yang valid';
        }
        break;
      case 'password':
        if (value.length < 8) {
          isValid = false;
          errorMsg = 'Password minimal 8 karakter';
        }
        break;
    }
  }

  input.classList.toggle('error', !isValid);
  if (errorEl) {
    errorEl.textContent = errorMsg;
    errorEl.classList.toggle('visible', !isValid);
  }

  return isValid;
}

function _validateForm(formEl) {
  const inputs = formEl.querySelectorAll('input, select, textarea');
  let allValid = true;

  inputs.forEach(input => {
    if (!_validateField(input)) {
      allValid = false;
    }
  });

  return allValid;
}

// ── Confirm Dialog ─────────────────────────────────────────────────────────
export function showConfirmDialog(message, onConfirm) {
  return showModal({
    title: 'Konfirmasi',
    content: `<p style="margin:0;color:#CBD5E1;font-size:15px;line-height:1.6;">${message}</p>`,
    size: 'sm',
    confirmText: 'Ya, Lanjutkan',
    cancelText: 'Batal',
    confirmDanger: true,
    onConfirm: () => {
      closeModal();
      if (onConfirm) onConfirm();
    },
    onCancel: () => {
      closeModal();
    }
  });
}

// ── Login Form ─────────────────────────────────────────────────────────────
export function showLoginForm() {
  const content = `
    <form id="nce-login-form" novalidate>
      <div class="nce-form-group">
        <label class="nce-form-label">Email <span class="nce-required">*</span></label>
        <input type="email" class="nce-form-input" id="nce-login-email" placeholder="nama@email.com" data-required="true" data-type="email" autocomplete="email">
        <div class="nce-form-error"></div>
      </div>
      <div class="nce-form-group">
        <label class="nce-form-label">Password <span class="nce-required">*</span></label>
        <div class="nce-form-input-wrapper">
          <input type="password" class="nce-form-input" id="nce-login-password" placeholder="Masukkan password" data-required="true" data-type="password" autocomplete="current-password">
          <span class="nce-input-icon" id="nce-login-toggle-pw">${icons.eye}</span>
        </div>
        <div class="nce-form-error"></div>
      </div>
      <div style="display:flex;justify-content:flex-end;margin-bottom:4px;">
        <a href="#" style="font-size:13px;color:#10B981;text-decoration:none;">Lupa password?</a>
      </div>
    </form>
  `;

  const modal = showModal({
    title: 'Masuk ke NCE',
    content,
    size: 'sm',
    confirmText: 'Masuk',
    cancelText: 'Batal',
    onConfirm: () => {
      const form = document.getElementById('nce-login-form');
      if (form && _validateForm(form)) {
        const email = document.getElementById('nce-login-email').value.trim();
        const password = document.getElementById('nce-login-password').value;
        closeModal();
        // Dispatch custom event with login data
        document.dispatchEvent(new CustomEvent('nce:login', { detail: { email, password } }));
      }
    }
  });

  // Password toggle
  setTimeout(() => {
    const togglePw = document.getElementById('nce-login-toggle-pw');
    const pwInput = document.getElementById('nce-login-password');
    if (togglePw && pwInput) {
      togglePw.addEventListener('click', () => {
        const isPassword = pwInput.type === 'password';
        pwInput.type = isPassword ? 'text' : 'password';
        togglePw.innerHTML = isPassword ? icons.eyeOff : icons.eye;
      });
    }

    // Real-time validation
    const emailInput = document.getElementById('nce-login-email');
    const passwordInput = document.getElementById('nce-login-password');
    if (emailInput) emailInput.addEventListener('blur', () => _validateField(emailInput));
    if (passwordInput) passwordInput.addEventListener('blur', () => _validateField(passwordInput));

    // Submit on enter
    const form = document.getElementById('nce-login-form');
    if (form) {
      form.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const confirmBtn = document.getElementById('nce-modal-confirm-btn');
          if (confirmBtn) confirmBtn.click();
        }
      });
    }
  }, 100);

  return modal;
}

// ── Register Form ──────────────────────────────────────────────────────────
export function showRegisterForm() {
  const commodityTypes = [
    'Sawit (Kelapa Sawit)', 'Karet', 'Kopi', 'Tembakau', 'Teh',
    'Kakao', 'Kelapa', 'Padi/Beras', 'Jagung', 'Kedelai',
    'Cengkeh', 'Pala', 'Lada', 'Kayu', 'Rotan'
  ];

  const content = `
    <form id="nce-register-form" novalidate>
      <div class="nce-form-group">
        <label class="nce-form-label">Email <span class="nce-required">*</span></label>
        <input type="email" class="nce-form-input" id="nce-reg-email" placeholder="nama@email.com" data-required="true" data-type="email" autocomplete="email">
        <div class="nce-form-error"></div>
      </div>
      <div class="nce-form-group">
        <label class="nce-form-label">Password <span class="nce-required">*</span></label>
        <div class="nce-form-input-wrapper">
          <input type="password" class="nce-form-input" id="nce-reg-password" placeholder="Minimal 8 karakter" data-required="true" data-type="password" autocomplete="new-password">
          <span class="nce-input-icon" id="nce-reg-toggle-pw">${icons.eye}</span>
        </div>
        <div class="nce-form-error"></div>
      </div>
      <div class="nce-form-row">
        <div class="nce-form-group">
          <label class="nce-form-label">Nama Perusahaan <span class="nce-required">*</span></label>
          <input type="text" class="nce-form-input" id="nce-reg-company" placeholder="PT. Contoh" data-required="true">
          <div class="nce-form-error"></div>
        </div>
        <div class="nce-form-group">
          <label class="nce-form-label">No. Telepon <span class="nce-required">*</span></label>
          <input type="tel" class="nce-form-input" id="nce-reg-phone" placeholder="+62 xxx" data-required="true" data-type="phone">
          <div class="nce-form-error"></div>
        </div>
      </div>
      <div class="nce-form-group">
        <label class="nce-form-label">Peran <span class="nce-required">*</span></label>
        <select class="nce-form-select" id="nce-reg-role" data-required="true">
          <option value="">Pilih peran Anda</option>
          <option value="buyer">Pembeli (Buyer)</option>
          <option value="seller">Penjual (Seller)</option>
          <option value="both">Pembeli & Penjual</option>
        </select>
        <div class="nce-form-error"></div>
      </div>
      <div class="nce-form-group">
        <label class="nce-form-label">Komoditas Utama</label>
        <select class="nce-form-select" id="nce-reg-commodity">
          <option value="">Pilih komoditas utama</option>
          ${commodityTypes.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
      </div>
    </form>
  `;

  const modal = showModal({
    title: 'Daftar Akun NCE',
    content,
    size: 'md',
    confirmText: 'Daftar',
    cancelText: 'Batal',
    onConfirm: () => {
      const form = document.getElementById('nce-register-form');
      if (form && _validateForm(form)) {
        const data = {
          email: document.getElementById('nce-reg-email').value.trim(),
          password: document.getElementById('nce-reg-password').value,
          company: document.getElementById('nce-reg-company').value.trim(),
          phone: document.getElementById('nce-reg-phone').value.trim(),
          role: document.getElementById('nce-reg-role').value,
          commodity: document.getElementById('nce-reg-commodity').value
        };
        closeModal();
        document.dispatchEvent(new CustomEvent('nce:register', { detail: data }));
      }
    }
  });

  setTimeout(() => {
    // Password toggle
    const togglePw = document.getElementById('nce-reg-toggle-pw');
    const pwInput = document.getElementById('nce-reg-password');
    if (togglePw && pwInput) {
      togglePw.addEventListener('click', () => {
        const isPassword = pwInput.type === 'password';
        pwInput.type = isPassword ? 'text' : 'password';
        togglePw.innerHTML = isPassword ? icons.eyeOff : icons.eye;
      });
    }

    // Real-time validation
    ['nce-reg-email', 'nce-reg-password', 'nce-reg-company', 'nce-reg-phone', 'nce-reg-role'].forEach(id => {
      const input = document.getElementById(id);
      if (input) input.addEventListener('blur', () => _validateField(input));
    });

    // Submit on enter
    const form = document.getElementById('nce-register-form');
    if (form) {
      form.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const confirmBtn = document.getElementById('nce-modal-confirm-btn');
          if (confirmBtn) confirmBtn.click();
        }
      });
    }
  }, 100);

  return modal;
}

// ── Create Buy Request Form ────────────────────────────────────────────────
export function showCreateBuyRequestForm() {
  const commodityTypes = [
    'Sawit (Kelapa Sawit)', 'Karet', 'Kopi', 'Tembakau', 'Teh',
    'Kakao', 'Kelapa', 'Padi/Beras', 'Jagung', 'Kedelai',
    'Cengkeh', 'Pala', 'Lada', 'Kayu', 'Rotan'
  ];

  const locations = [
    'Jakarta', 'Surabaya', 'Medan', 'Bandung', 'Semarang',
    'Makassar', 'Palembang', 'Balikpapan', 'Manado', 'Denpasar',
    'Pontianak', 'Banjarmasin', 'Pekanbaru', 'Padang', 'Yogyakarta'
  ];

  const content = `
    <form id="nce-buyreq-form" novalidate>
      <div class="nce-form-group">
        <label class="nce-form-label">Jenis Komoditas <span class="nce-required">*</span></label>
        <select class="nce-form-select" id="nce-buyreq-commodity" data-required="true">
          <option value="">Pilih komoditas</option>
          ${commodityTypes.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
        <div class="nce-form-error"></div>
      </div>
      <div class="nce-form-row">
        <div class="nce-form-group">
          <label class="nce-form-label">Volume Dibutuhkan <span class="nce-required">*</span></label>
          <input type="number" class="nce-form-input" id="nce-buyreq-volume" placeholder="contoh: 1000" data-required="true" data-type="number" min="1">
          <div class="nce-form-error"></div>
        </div>
        <div class="nce-form-group">
          <label class="nce-form-label">Satuan <span class="nce-required">*</span></label>
          <select class="nce-form-select" id="nce-buyreq-unit" data-required="true">
            <option value="kg">Kilogram (kg)</option>
            <option value="ton">Ton</option>
            <option value="liter">Liter</option>
            <option value="m3">Meter Kubik (m³)</option>
            <option value="lembar">Lembar</option>
          </select>
        </div>
      </div>
      <div class="nce-form-group">
        <label class="nce-form-label">Harga Target (Rp) <span class="nce-required">*</span></label>
        <input type="number" class="nce-form-input" id="nce-buyreq-price" placeholder="contoh: 15000" data-required="true" data-type="number" min="1">
        <div class="nce-form-error"></div>
      </div>
      <div class="nce-form-group">
        <label class="nce-form-label">Lokasi Pengiriman <span class="nce-required">*</span></label>
        <select class="nce-form-select" id="nce-buyreq-location" data-required="true">
          <option value="">Pilih lokasi</option>
          ${locations.map(l => `<option value="${l}">${l}</option>`).join('')}
        </select>
        <div class="nce-form-error"></div>
      </div>
      <div class="nce-form-group">
        <label class="nce-form-label">Catatan Tambahan</label>
        <textarea class="nce-form-textarea" id="nce-buyreq-notes" placeholder="Spesifikasi tambahan, persyaratan kualitas, dll." rows="3"></textarea>
      </div>
    </form>
  `;

  const modal = showModal({
    title: 'Buat Permintaan Beli',
    content,
    size: 'md',
    confirmText: 'Buat Permintaan',
    cancelText: 'Batal',
    onConfirm: () => {
      const form = document.getElementById('nce-buyreq-form');
      if (form && _validateForm(form)) {
        const data = {
          commodityType: document.getElementById('nce-buyreq-commodity').value,
          volume: Number(document.getElementById('nce-buyreq-volume').value),
          unit: document.getElementById('nce-buyreq-unit').value,
          targetPrice: Number(document.getElementById('nce-buyreq-price').value),
          deliveryLocation: document.getElementById('nce-buyreq-location').value,
          notes: document.getElementById('nce-buyreq-notes').value.trim()
        };
        closeModal();
        document.dispatchEvent(new CustomEvent('nce:createBuyRequest', { detail: data }));
      }
    }
  });

  setTimeout(() => {
    ['nce-buyreq-commodity', 'nce-buyreq-volume', 'nce-buyreq-price', 'nce-buyreq-location'].forEach(id => {
      const input = document.getElementById(id);
      if (input) input.addEventListener('blur', () => _validateField(input));
    });
  }, 100);

  return modal;
}

// ── Offer Form ─────────────────────────────────────────────────────────────
export function showOfferForm(requestId) {
  const content = `
    <form id="nce-offer-form" novalidate>
      <input type="hidden" id="nce-offer-request-id" value="${requestId}">
      <div class="nce-form-row">
        <div class="nce-form-group">
          <label class="nce-form-label">Harga per Unit (Rp) <span class="nce-required">*</span></label>
          <input type="number" class="nce-form-input" id="nce-offer-price" placeholder="contoh: 14500" data-required="true" data-type="number" min="1">
          <div class="nce-form-error"></div>
        </div>
        <div class="nce-form-group">
          <label class="nce-form-label">Volume Tersedia <span class="nce-required">*</span></label>
          <input type="number" class="nce-form-input" id="nce-offer-volume" placeholder="contoh: 500" data-required="true" data-type="number" min="1">
          <div class="nce-form-error"></div>
        </div>
      </div>
      <div class="nce-form-group">
        <label class="nce-form-label">Satuan</label>
        <select class="nce-form-select" id="nce-offer-unit">
          <option value="kg">Kilogram (kg)</option>
          <option value="ton">Ton</option>
          <option value="liter">Liter</option>
          <option value="m3">Meter Kubik (m³)</option>
        </select>
      </div>
      <div class="nce-form-group">
        <label class="nce-form-label">Waktu Pengiriman <span class="nce-required">*</span></label>
        <input type="text" class="nce-form-input" id="nce-offer-delivery" placeholder="contoh: 3-5 hari kerja" data-required="true">
        <div class="nce-form-error"></div>
      </div>
      <div class="nce-form-group">
        <label class="nce-form-label">Catatan</label>
        <textarea class="nce-form-textarea" id="nce-offer-notes" placeholder="Informasi tambahan tentang penawaran Anda" rows="3"></textarea>
      </div>
    </form>
  `;

  const modal = showModal({
    title: 'Buat Penawaran',
    content,
    size: 'md',
    confirmText: 'Kirim Penawaran',
    cancelText: 'Batal',
    onConfirm: () => {
      const form = document.getElementById('nce-offer-form');
      if (form && _validateForm(form)) {
        const data = {
          requestId: document.getElementById('nce-offer-request-id').value,
          price: Number(document.getElementById('nce-offer-price').value),
          volume: Number(document.getElementById('nce-offer-volume').value),
          unit: document.getElementById('nce-offer-unit').value,
          deliveryTime: document.getElementById('nce-offer-delivery').value.trim(),
          notes: document.getElementById('nce-offer-notes').value.trim()
        };
        closeModal();
        document.dispatchEvent(new CustomEvent('nce:createOffer', { detail: data }));
      }
    }
  });

  setTimeout(() => {
    ['nce-offer-price', 'nce-offer-volume', 'nce-offer-delivery'].forEach(id => {
      const input = document.getElementById(id);
      if (input) input.addEventListener('blur', () => _validateField(input));
    });
  }, 100);

  return modal;
}

// ── Image Upload ───────────────────────────────────────────────────────────
export function showImageUpload(currentImage, onUpload) {
  let previewHTML = '';
  if (currentImage) {
    previewHTML = `<div class="nce-upload-preview"><img src="${currentImage}" alt="Preview" id="nce-upload-preview-img"/></div>`;
  }

  const content = `
    <div class="nce-upload-area" id="nce-upload-area">
      ${icons.upload}
      <div class="nce-upload-text">Klik atau seret gambar ke sini</div>
      <div class="nce-upload-hint">JPG, PNG, atau WebP. Maks 5MB.</div>
      <input type="file" id="nce-upload-input" accept="image/jpeg,image/png,image/webp" style="display:none;">
    </div>
    ${previewHTML}
  `;

  const modal = showModal({
    title: 'Unggah Gambar',
    content,
    size: 'sm',
    confirmText: 'Unggah',
    cancelText: 'Batal',
    onConfirm: () => {
      const fileInput = document.getElementById('nce-upload-input');
      const previewImg = document.getElementById('nce-upload-preview-img');
      if (fileInput && fileInput.files && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        if (onUpload) onUpload(file);
        closeModal();
      } else if (previewImg && previewImg.src) {
        // Use existing image
        if (onUpload) onUpload(previewImg.src);
        closeModal();
      } else {
        const uploadArea = document.getElementById('nce-upload-area');
        if (uploadArea) {
          uploadArea.style.borderColor = 'rgba(239, 68, 68, 0.5)';
          setTimeout(() => { uploadArea.style.borderColor = ''; }, 2000);
        }
      }
    }
  });

  setTimeout(() => {
    const uploadArea = document.getElementById('nce-upload-area');
    const fileInput = document.getElementById('nce-upload-input');

    if (uploadArea && fileInput) {
      // Click to browse
      uploadArea.addEventListener('click', () => {
        fileInput.click();
      });

      // Drag & drop
      uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragging');
      });

      uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragging');
      });

      uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragging');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          fileInput.files = e.dataTransfer.files;
          _previewImage(e.dataTransfer.files[0]);
        }
      });

      // File selected
      fileInput.addEventListener('change', () => {
        if (fileInput.files && fileInput.files.length > 0) {
          _previewImage(fileInput.files[0]);
        }
      });
    }
  }, 100);

  function _previewImage(file) {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      const uploadArea = document.getElementById('nce-upload-area');
      if (uploadArea) {
        uploadArea.querySelector('.nce-upload-text').textContent = 'Format file tidak didukung';
        uploadArea.querySelector('.nce-upload-text').style.color = '#EF4444';
      }
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      const uploadArea = document.getElementById('nce-upload-area');
      if (uploadArea) {
        uploadArea.querySelector('.nce-upload-text').textContent = 'Ukuran file melebihi 5MB';
        uploadArea.querySelector('.nce-upload-text').style.color = '#EF4444';
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      let previewContainer = document.querySelector('.nce-upload-preview');
      if (!previewContainer) {
        previewContainer = document.createElement('div');
        previewContainer.className = 'nce-upload-preview';
        const uploadArea = document.getElementById('nce-upload-area');
        if (uploadArea) {
          uploadArea.parentNode.insertBefore(previewContainer, uploadArea.nextSibling);
        }
      }
      previewContainer.innerHTML = `<img src="${e.target.result}" alt="Preview" id="nce-upload-preview-img"/>`;

      // Update upload area text
      const uploadArea = document.getElementById('nce-upload-area');
      if (uploadArea) {
        uploadArea.querySelector('.nce-upload-text').textContent = file.name;
        uploadArea.querySelector('.nce-upload-text').style.color = '#10B981';
      }
    };
    reader.readAsDataURL(file);
  }

  return modal;
}

// ── Loading Modal ──────────────────────────────────────────────────────────
export function showLoading() {
  const content = `
    <div class="nce-modal-loading">
      ${icons.spinner}
      <p style="margin-top:20px;color:#94A3B8;font-size:14px;">Memproses...</p>
    </div>
  `;

  return showModal({
    title: '',
    content,
    size: 'sm',
    showFooter: false,
    closeOnOutsideClick: false,
    closeOnEscape: false
  });
}

// ── Success Modal ──────────────────────────────────────────────────────────
export function showSuccess(message) {
  const successIcon = `
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="#10B981" stroke-width="2" class="nce-success-circle"/>
      <polyline points="8 12 11 15 16 9" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="nce-success-check"/>
    </svg>
  `;

  const content = `
    <div class="nce-modal-icon">${successIcon}</div>
    <p class="nce-modal-message">${message}</p>
  `;

  const modal = showModal({
    title: '',
    content,
    size: 'sm',
    showFooter: true,
    confirmText: 'OK',
    cancelText: '',
    onConfirm: () => {
      closeModal();
    }
  });

  // Hide cancel button since we only want OK
  setTimeout(() => {
    const cancelBtn = document.getElementById('nce-modal-cancel-btn');
    if (cancelBtn) cancelBtn.style.display = 'none';
  }, 50);

  // Auto-close after 3 seconds
  setTimeout(() => {
    if (currentModal) closeModal();
  }, 3000);

  return modal;
}

// ── Error Modal ────────────────────────────────────────────────────────────
export function showError(message) {
  const errorIcon = `
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="#EF4444" stroke-width="2" class="nce-error-circle"/>
      <line x1="15" y1="9" x2="9" y2="15" stroke="#EF4444" stroke-width="2" stroke-linecap="round" class="nce-error-x1"/>
      <line x1="9" y1="9" x2="15" y2="15" stroke="#EF4444" stroke-width="2" stroke-linecap="round" class="nce-error-x2"/>
    </svg>
  `;

  const content = `
    <div class="nce-modal-icon">${errorIcon}</div>
    <p class="nce-modal-message">${message}</p>
  `;

  const modal = showModal({
    title: '',
    content,
    size: 'sm',
    showFooter: true,
    confirmText: 'Tutup',
    cancelText: '',
    onConfirm: () => {
      closeModal();
    }
  });

  setTimeout(() => {
    const cancelBtn = document.getElementById('nce-modal-cancel-btn');
    if (cancelBtn) cancelBtn.style.display = 'none';
  }, 50);

  return modal;
}
