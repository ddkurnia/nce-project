import { getState, setState, subscribe } from '../state.js';

const HEADER_ICONS = {
  search: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
  bell: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`,
};

export function initHeader() {
  const header = document.getElementById('main-header');
  if (!header) return;

  header.innerHTML = `
    <div class="header-left">
      <div class="header-logo" data-navigate="/">
        <img src="assets/images/nce-icon.svg" alt="NCE" width="28" height="28">
        <span class="logo-text">NCE</span>
      </div>
    </div>
    <div class="header-center">
      <div class="header-search" id="header-search">
        <span class="search-icon">${HEADER_ICONS.search}</span>
        <input type="text" id="header-search-input" placeholder="Cari komoditas..." autocomplete="off">
      </div>
    </div>
    <div class="header-right">
      <button class="header-btn" id="header-notif-btn" aria-label="Notifikasi">
        ${HEADER_ICONS.bell}
        <span class="notification-dot" id="notif-dot" style="display:none;"></span>
      </button>
    </div>
  `;

  // Logo click navigates home
  header.querySelector('[data-navigate]')?.addEventListener('click', () => {
    window.location.hash = '#/';
  });

  // Search functionality
  const searchInput = document.getElementById('header-search-input');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        setState('searchQuery', e.target.value);
      }, 300);
    });
  }
}

export function showSearch(show) {
  const searchEl = document.getElementById('header-search');
  if (searchEl) {
    searchEl.classList.toggle('visible', show);
  }
}

export function updateNotificationBadge(count) {
  const dot = document.getElementById('notif-dot');
  if (dot) {
    dot.style.display = count > 0 ? 'block' : 'none';
  }
}
