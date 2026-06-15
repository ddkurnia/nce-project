/**
 * NCE Mobile Drawer Component
 * Slide-out drawer with user info, navigation links, settings, and swipe-to-close
 */

import { MOBILE_CONFIG } from '../config/mobile-config.js';

let drawerOpen = false;
let drawerUser = { name: 'Pengguna', email: '', role: 'Member', avatar: '' };
let touchStartX = 0;
let touchCurrentX = 0;
let isDragging = false;

const DRAWER_LINKS = [
  { id: 'home', label: 'Beranda', icon: 'home', href: 'index.html' },
  { id: 'commodities', label: 'Komoditas', icon: 'package', href: 'commodities.html' },
  { id: 'requests', label: 'Permintaan Beli', icon: 'file-text', href: 'buy-requests.html' },
  { id: 'property', label: 'Properti', icon: 'building', href: 'property.html' },
  { id: 'dashboard', label: 'Dashboard', icon: 'grid', href: 'dashboard.html' }
];

const DRAWER_FOOTER_LINKS = [
  { id: 'settings', label: 'Pengaturan', icon: 'settings', href: '#' },
  { id: 'help', label: 'Bantuan', icon: 'help-circle', href: '#' },
  { id: 'logout', label: 'Keluar', icon: 'log-out', href: '#', danger: true }
];

function iconSvg(name) {
  const icons = {
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    package: '<line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
    'file-text': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    building: '<rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>',
    grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    'help-circle': '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    'log-out': '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>'
  };
  const path = icons[name] || '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

function injectStyles() {
  if (document.getElementById('nce-drawer-styles')) return;
  const style = document.createElement('style');
  style.id = 'nce-drawer-styles';
  style.textContent = `
    .nce-drawer-overlay { position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,0.6);opacity:0;visibility:hidden;transition:opacity .3s,visibility .3s; }
    .nce-drawer-overlay.open { opacity:1;visibility:visible; }
    .nce-drawer { position:fixed;top:0;left:0;bottom:0;z-index:2001;width:280px;max-width:80vw;background:#111827;transform:translateX(-100%);transition:transform .3s ease;display:flex;flex-direction:column;padding-top:var(--safe-area-top,0px); }
    .nce-drawer.open { transform:translateX(0); }
    .nce-drawer__header { padding:24px 20px 16px;border-bottom:1px solid rgba(255,255,255,0.08); }
    .nce-drawer__avatar { width:56px;height:56px;border-radius:50%;background:#10b981;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#0a0e27;margin-bottom:12px;overflow:hidden; }
    .nce-drawer__avatar img { width:100%;height:100%;object-fit:cover; }
    .nce-drawer__name { color:#e2e8f0;font-size:16px;font-weight:600; }
    .nce-drawer__role { color:#94a3b8;font-size:12px;margin-top:2px; }
    .nce-drawer__nav { flex:1;overflow-y:auto;padding:8px 0; }
    .nce-drawer__link { display:flex;align-items:center;gap:14px;padding:14px 20px;color:#e2e8f0;text-decoration:none;font-size:14px;min-height:48px;transition:background .2s,color .2s; }
    .nce-drawer__link:active { background:rgba(16,185,129,0.1); }
    .nce-drawer__link--danger { color:#ef4444; }
    .nce-drawer__divider { height:1px;background:rgba(255,255,255,0.08);margin:8px 20px; }
    .nce-drawer__footer { padding:8px 0 16px;padding-bottom:calc(16px + var(--safe-area-bottom,0px)); }
  `;
  document.head.appendChild(style);
}

export function renderMobileDrawer(containerSelector) {
  injectStyles();

  const existing = document.getElementById('nce-drawer-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'nce-drawer-overlay';
  overlay.className = 'nce-drawer-overlay';
  overlay.addEventListener('click', () => closeDrawer());

  const drawer = document.createElement('div');
  drawer.id = 'nce-drawer';
  drawer.className = 'nce-drawer';

  const initials = drawerUser.name ? drawerUser.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'U';
  const avatarContent = drawerUser.avatar
    ? `<img src="${drawerUser.avatar}" alt="${drawerUser.name}">`
    : initials;

  drawer.innerHTML = `
    <div class="nce-drawer__header">
      <div class="nce-drawer__avatar">${avatarContent}</div>
      <div class="nce-drawer__name">${drawerUser.name}</div>
      <div class="nce-drawer__role">${drawerUser.role}</div>
    </div>
    <div class="nce-drawer__nav">
      ${DRAWER_LINKS.map(l => `<a href="${l.href}" class="nce-drawer__link">${iconSvg(l.icon)}<span>${l.label}</span></a>`).join('')}
      <div class="nce-drawer__divider"></div>
    </div>
    <div class="nce-drawer__footer">
      ${DRAWER_FOOTER_LINKS.map(l => `<a href="${l.href}" class="nce-drawer__link${l.danger ? ' nce-drawer__link--danger' : ''}" data-action="${l.id}">${iconSvg(l.icon)}<span>${l.label}</span></a>`).join('')}
    </div>
  `;

  drawer.addEventListener('click', (e) => {
    const link = e.target.closest('[data-action="logout"]');
    if (link) {
      e.preventDefault();
      if (typeof window.handleLogout === 'function') window.handleLogout();
    }
  });

  drawer.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    isDragging = true;
  }, { passive: true });

  drawer.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    touchCurrentX = e.touches[0].clientX;
    const diff = touchStartX - touchCurrentX;
    if (diff > 0) {
      const el = document.getElementById('nce-drawer');
      if (el) el.style.transform = `translateX(${-diff}px)`;
    }
  }, { passive: true });

  drawer.addEventListener('touchend', () => {
    if (!isDragging) return;
    isDragging = false;
    const diff = touchStartX - touchCurrentX;
    if (diff > 60) {
      closeDrawer();
    } else {
      const el = document.getElementById('nce-drawer');
      if (el) el.style.transform = '';
    }
    touchStartX = 0;
    touchCurrentX = 0;
  });

  overlay.appendChild(drawer);
  document.body.appendChild(overlay);

  return drawer;
}

export function openDrawer() {
  drawerOpen = true;
  const overlay = document.getElementById('nce-drawer-overlay');
  const drawer = document.getElementById('nce-drawer');
  if (overlay) overlay.classList.add('open');
  if (drawer) { drawer.style.transform = ''; drawer.classList.add('open'); }
  document.body.style.overflow = 'hidden';
}

export function closeDrawer() {
  drawerOpen = false;
  const overlay = document.getElementById('nce-drawer-overlay');
  const drawer = document.getElementById('nce-drawer');
  if (overlay) overlay.classList.remove('open');
  if (drawer) { drawer.style.transform = ''; drawer.classList.remove('open'); }
  document.body.style.overflow = '';
}

export function toggleDrawer() {
  if (drawerOpen) closeDrawer();
  else openDrawer();
}

export function updateDrawerUser(user) {
  drawerUser = { ...drawerUser, ...user };
  const nameEl = document.querySelector('.nce-drawer__name');
  const roleEl = document.querySelector('.nce-drawer__role');
  const avatarEl = document.querySelector('.nce-drawer__avatar');
  if (nameEl) nameEl.textContent = drawerUser.name;
  if (roleEl) roleEl.textContent = drawerUser.role;
  if (avatarEl) {
    const initials = drawerUser.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    avatarEl.innerHTML = drawerUser.avatar ? `<img src="${drawerUser.avatar}" alt="${drawerUser.name}">` : initials;
  }
}

export default { renderMobileDrawer, openDrawer, closeDrawer, toggleDrawer, updateDrawerUser };
