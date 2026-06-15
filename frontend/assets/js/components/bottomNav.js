/**
 * NCE Bottom Navigation Component
 * Fixed bottom nav bar for mobile with SVG icons, active states, safe area padding
 */

import { MOBILE_CONFIG } from '../config/mobile-config.js';

const NAV_ICONS = {
  home: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
  package: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`,
  'file-text': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
  building: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>`,
  user: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`
};

let isVisible = true;
let currentActiveId = null;

function injectStyles() {
  if (document.getElementById('nce-bottom-nav-styles')) return;
  const style = document.createElement('style');
  style.id = 'nce-bottom-nav-styles';
  style.textContent = `
    .nce-bottom-nav {
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 1000;
      display: flex; justify-content: space-around; align-items: center;
      background: rgba(17, 24, 39, 0.92);
      backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
      border-top: 1px solid rgba(255,255,255,0.08);
      padding-bottom: var(--safe-area-bottom, 0px);
      padding-top: 6px; padding-left: 4px; padding-right: 4px;
      transition: transform 0.3s ease;
    }
    .nce-bottom-nav.hidden { transform: translateY(100%); }
    .nce-bottom-nav__item {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      min-width: 48px; min-height: 48px; padding: 6px 8px;
      color: #94a3b8; text-decoration: none; border-radius: 12px;
      transition: color 0.2s, background 0.2s; cursor: pointer;
      flex: 1; gap: 2px;
    }
    .nce-bottom-nav__item:active { background: rgba(16, 185, 129, 0.1); }
    .nce-bottom-nav__item.active { color: #10b981; }
    .nce-bottom-nav__icon { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; }
    .nce-bottom-nav__label { font-size: 10px; font-weight: 500; white-space: nowrap; line-height: 1.2; }
    @media (min-width: 1024px) { .nce-bottom-nav { display: none; } }
  `;
  document.head.appendChild(style);
}

export function renderBottomNav(activeId) {
  injectStyles();
  currentActiveId = activeId;

  let existing = document.getElementById('nce-bottom-nav');
  if (existing) existing.remove();

  const nav = document.createElement('nav');
  nav.id = 'nce-bottom-nav';
  nav.className = 'nce-bottom-nav';
  if (!isVisible) nav.classList.add('hidden');

  nav.innerHTML = MOBILE_CONFIG.bottomNav.items.map((item) => {
    const isActive = item.id === activeId;
    return `
      <a href="${item.href}" class="nce-bottom-nav__item${isActive ? ' active' : ''}" data-nav-id="${item.id}">
        <span class="nce-bottom-nav__icon">${NAV_ICONS[item.icon] || ''}</span>
        <span class="nce-bottom-nav__label">${item.label}</span>
      </a>
    `;
  }).join('');

  nav.addEventListener('click', (e) => {
    const navItem = e.target.closest('.nce-bottom-nav__item');
    if (!navItem) return;
    const id = navItem.dataset.navId;
    if (id === currentActiveId) return;
    setActiveNavItem(id);
  });

  document.body.appendChild(nav);

  const mainContent = document.querySelector('main') || document.querySelector('.main-content');
  if (mainContent) {
    mainContent.style.paddingBottom = '72px';
  }

  return nav;
}

export function setActiveNavItem(activeId) {
  currentActiveId = activeId;
  const nav = document.getElementById('nce-bottom-nav');
  if (!nav) return;
  nav.querySelectorAll('.nce-bottom-nav__item').forEach((el) => {
    const id = el.dataset.navId;
    if (id === activeId) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });
}

export function showBottomNav() {
  isVisible = true;
  const nav = document.getElementById('nce-bottom-nav');
  if (nav) nav.classList.remove('hidden');
}

export function hideBottomNav() {
  isVisible = false;
  const nav = document.getElementById('nce-bottom-nav');
  if (nav) nav.classList.add('hidden');
}

export default { renderBottomNav, setActiveNavItem, showBottomNav, hideBottomNav };
