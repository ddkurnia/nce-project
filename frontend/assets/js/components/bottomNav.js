import { getState, subscribe } from '../state.js';

const NAV_ITEMS = [
  {
    key: 'home',
    label: 'Home',
    route: '/',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  },
  {
    key: 'market',
    label: 'Market',
    route: '/market',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>`,
  },
  {
    key: 'rfq',
    label: 'RFQ',
    route: '/rfq',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>`,
  },
  {
    key: 'messages',
    label: 'Pesan',
    route: '/messages',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  },
  {
    key: 'profile',
    label: 'Profil',
    route: '/profile',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  },
];

export function initBottomNav() {
  const nav = document.getElementById('bottom-nav');
  if (!nav) return;

  nav.innerHTML = NAV_ITEMS.map(item => `
    <a class="nav-item" data-route="${item.route}" href="#${item.route}">
      ${item.icon}
      <span class="nav-label">${item.label}</span>
    </a>
  `).join('');

  // Click handler
  nav.addEventListener('click', (e) => {
    const item = e.target.closest('.nav-item');
    if (!item) return;
    // Hash navigation handled by href
  });

  // Set initial active state
  updateActiveNav('/');
}

export function updateActiveNav(route) {
  const nav = document.getElementById('bottom-nav');
  if (!nav) return;

  const items = nav.querySelectorAll('.nav-item');
  items.forEach(item => {
    const itemRoute = item.dataset.route;
    const isActive = route === itemRoute ||
      (itemRoute !== '/' && route.startsWith(itemRoute));
    item.classList.toggle('active', isActive);
  });
}
