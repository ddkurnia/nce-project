/**
 * Nusantara Commodity Exchange (NCE) - Sidebar Component
 * Dark gradient sidebar with collapsible mobile support
 */

// ── State ──────────────────────────────────────────────────────────────────
let sidebarOpen = false;
let activeItem = 'dashboard';
let sidebarUser = null;

// ── SVG Icons ──────────────────────────────────────────────────────────────
const icons = {
  dashboard: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,

  commodities: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`,

  buyRequests: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`,

  properties: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,

  profile: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,

  admin: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,

  nceLogo: `<svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="url(#nce-sb-grad)"/>
    <defs><linearGradient id="nce-sb-grad" x1="0" y1="0" x2="32" y2="32"><stop stop-color="#10B981"/><stop offset="1" stop-color="#06B6D4"/></linearGradient></defs>
    <path d="M8 22L13 10H16L11 22H8Z" fill="white"/>
    <path d="M14 22L19 10H22L17 22H14Z" fill="white" opacity="0.7"/>
    <path d="M20 22L25 10H28L23 22H20Z" fill="white" opacity="0.4"/>
  </svg>`,

  close: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,

  hamburger: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`
};

// ── Sidebar Items Configuration ────────────────────────────────────────────
function getSidebarItems(role) {
  const items = [
    { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: icons.dashboard, badge: null },
    { id: 'commodities', label: 'Commodities', href: '/commodities', icon: icons.commodities, badge: null },
    { id: 'buy-requests', label: 'Buy Requests', href: '/buy-requests', icon: icons.buyRequests, badge: 3 },
    { id: 'properties', label: 'Properties', href: '/properties', icon: icons.properties, badge: null },
    { id: 'profile', label: 'Profile', href: '/profile', icon: icons.profile, badge: null }
  ];

  if (role === 'admin') {
    items.push({
      id: 'admin',
      label: 'Admin Panel',
      href: '/admin',
      icon: icons.admin,
      badge: null
    });
  }

  return items;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function getInitials(name) {
  if (!name) return 'U';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function generateAvatarColor(name) {
  const colors = ['#10B981', '#06B6D4', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// ── Render ─────────────────────────────────────────────────────────────────
export function renderSidebar(containerSelector, initialActiveItem = 'dashboard') {
  const container = document.querySelector(containerSelector);
  if (!container) {
    console.error(`Sidebar container "${containerSelector}" not found`);
    return;
  }

  activeItem = initialActiveItem;

  // Inject sidebar styles once
  if (!document.getElementById('nce-sidebar-styles')) {
    const style = document.createElement('style');
    style.id = 'nce-sidebar-styles';
    style.textContent = `
      .nce-sidebar-wrapper {
        position: relative;
      }

      .nce-sidebar-toggle {
        display: none;
        position: fixed;
        top: 72px;
        left: 12px;
        z-index: 1001;
        width: 40px;
        height: 40px;
        align-items: center;
        justify-content: center;
        background: rgba(10, 15, 30, 0.9);
        border: 1px solid rgba(16, 185, 129, 0.2);
        border-radius: 10px;
        color: #10B981;
        cursor: pointer;
        backdrop-filter: blur(10px);
        transition: all 0.2s ease;
      }

      .nce-sidebar-toggle:hover {
        background: rgba(16, 185, 129, 0.15);
        border-color: #10B981;
      }

      .nce-sidebar {
        width: 260px;
        min-height: calc(100vh - 64px);
        background: linear-gradient(180deg, #0A0F1E 0%, #0D1321 50%, #0A1020 100%);
        border-right: 1px solid rgba(16, 185, 129, 0.1);
        display: flex;
        flex-direction: column;
        padding: 0;
        position: sticky;
        top: 64px;
        height: calc(100vh - 64px);
        overflow-y: auto;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }

      .nce-sidebar::-webkit-scrollbar {
        width: 4px;
      }

      .nce-sidebar::-webkit-scrollbar-track {
        background: transparent;
      }

      .nce-sidebar::-webkit-scrollbar-thumb {
        background: rgba(16, 185, 129, 0.2);
        border-radius: 2px;
      }

      .nce-sidebar-logo {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 24px 20px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }

      .nce-sidebar-logo-text {
        font-size: 18px;
        font-weight: 700;
        background: linear-gradient(135deg, #10B981, #06B6D4);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .nce-sidebar-nav {
        flex: 1;
        padding: 16px 12px;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .nce-sidebar-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        color: #64748B;
        text-decoration: none;
        font-size: 14px;
        font-weight: 500;
        border-radius: 10px;
        transition: all 0.2s ease;
        position: relative;
        cursor: pointer;
        border: none;
        background: none;
        width: 100%;
        text-align: left;
        font-family: inherit;
      }

      .nce-sidebar-item::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 0;
        background: #10B981;
        border-radius: 0 2px 2px 0;
        transition: height 0.2s ease;
      }

      .nce-sidebar-item:hover {
        color: #CBD5E1;
        background: rgba(16, 185, 129, 0.06);
      }

      .nce-sidebar-item.active {
        color: #10B981;
        background: rgba(16, 185, 129, 0.1);
      }

      .nce-sidebar-item.active::before {
        height: 24px;
      }

      .nce-sidebar-item-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .nce-sidebar-item.active .nce-sidebar-item-icon {
        filter: drop-shadow(0 0 6px rgba(16, 185, 129, 0.4));
      }

      .nce-sidebar-item-label {
        flex: 1;
      }

      .nce-sidebar-badge {
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 11px;
        font-weight: 600;
        background: rgba(16, 185, 129, 0.15);
        color: #10B981;
        min-width: 20px;
        text-align: center;
      }

      .nce-sidebar-user {
        padding: 16px;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .nce-sidebar-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 700;
        color: white;
        flex-shrink: 0;
      }

      .nce-sidebar-user-info {
        flex: 1;
        min-width: 0;
      }

      .nce-sidebar-user-name {
        font-size: 14px;
        font-weight: 600;
        color: #E2E8F0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .nce-sidebar-user-role {
        font-size: 12px;
        color: #64748B;
        text-transform: capitalize;
      }

      .nce-sidebar-overlay {
        display: none;
        position: fixed;
        top: 64px;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 998;
      }

      .nce-sidebar-overlay.visible {
        display: block;
      }

      @media (max-width: 768px) {
        .nce-sidebar-toggle {
          display: flex;
        }

        .nce-sidebar {
          position: fixed;
          top: 64px;
          left: -280px;
          z-index: 999;
          transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: none;
        }

        .nce-sidebar.open {
          left: 0;
          box-shadow: 4px 0 30px rgba(0, 0, 0, 0.5);
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Build sidebar HTML
  const role = sidebarUser ? sidebarUser.role : 'guest';
  const items = getSidebarItems(role);

  container.innerHTML = `
    <div class="nce-sidebar-wrapper">
      <button class="nce-sidebar-toggle" id="nce-sidebar-toggle" aria-label="Toggle sidebar">
        ${icons.hamburger}
      </button>

      <div class="nce-sidebar-overlay" id="nce-sidebar-overlay"></div>

      <aside class="nce-sidebar" id="nce-sidebar" role="navigation" aria-label="Sidebar navigation">
        <div class="nce-sidebar-logo">
          ${icons.nceLogo}
          <span class="nce-sidebar-logo-text">NCE</span>
        </div>

        <nav class="nce-sidebar-nav" id="nce-sidebar-nav">
          ${items.map(item => `
            <a href="${item.href}" class="nce-sidebar-item${item.id === activeItem ? ' active' : ''}" data-item="${item.id}" role="menuitem">
              <span class="nce-sidebar-item-icon">${item.icon}</span>
              <span class="nce-sidebar-item-label">${item.label}</span>
              ${item.badge ? `<span class="nce-sidebar-badge">${item.badge}</span>` : ''}
            </a>
          `).join('')}
        </nav>

        <div class="nce-sidebar-user" id="nce-sidebar-user-section">
          ${_renderUserInfo()}
        </div>
      </aside>
    </div>
  `;

  // Attach events
  _attachSidebarEvents();
}

// ── Internal: Render User Info ─────────────────────────────────────────────
function _renderUserInfo() {
  if (sidebarUser) {
    const color = generateAvatarColor(sidebarUser.name);
    const initials = getInitials(sidebarUser.name);
    return `
      <div class="nce-sidebar-avatar" style="background: ${color};">${initials}</div>
      <div class="nce-sidebar-user-info">
        <div class="nce-sidebar-user-name">${sidebarUser.name || 'User'}</div>
        <div class="nce-sidebar-user-role">${sidebarUser.role || 'member'}</div>
      </div>
    `;
  }
  return `
    <div class="nce-sidebar-avatar" style="background: #374151;">?</div>
    <div class="nce-sidebar-user-info">
      <div class="nce-sidebar-user-name">Guest</div>
      <div class="nce-sidebar-user-role">Not logged in</div>
    </div>
  `;
}

// ── Internal: Attach Events ────────────────────────────────────────────────
function _attachSidebarEvents() {
  // Toggle button
  const toggleBtn = document.getElementById('nce-sidebar-toggle');
  const sidebar = document.getElementById('nce-sidebar');
  const overlay = document.getElementById('nce-sidebar-overlay');

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      toggleSidebar();
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      toggleSidebar();
    });
  }

  // Nav item clicks
  const navItems = document.querySelectorAll('.nce-sidebar-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const itemId = item.getAttribute('data-item');
      setActiveItem(itemId);

      // Close on mobile after click
      if (window.innerWidth <= 768) {
        toggleSidebar();
      }
    });
  });
}

// ── Public: Toggle Sidebar ─────────────────────────────────────────────────
export function toggleSidebar() {
  const sidebar = document.getElementById('nce-sidebar');
  const overlay = document.getElementById('nce-sidebar-overlay');
  const toggleBtn = document.getElementById('nce-sidebar-toggle');

  if (!sidebar) return;

  sidebarOpen = !sidebarOpen;
  sidebar.classList.toggle('open', sidebarOpen);

  if (overlay) {
    overlay.classList.toggle('visible', sidebarOpen);
  }

  if (toggleBtn) {
    toggleBtn.innerHTML = sidebarOpen ? icons.close : icons.hamburger;
  }
}

// ── Public: Set Active Item ────────────────────────────────────────────────
export function setActiveItem(item) {
  activeItem = item;

  const navItems = document.querySelectorAll('.nce-sidebar-item');
  navItems.forEach(el => {
    const elItem = el.getAttribute('data-item');
    el.classList.toggle('active', elItem === item);
  });
}

// ── Public: Update Sidebar User ────────────────────────────────────────────
export function updateSidebarUser(user) {
  sidebarUser = user;

  const userSection = document.getElementById('nce-sidebar-user-section');
  if (userSection) {
    userSection.innerHTML = _renderUserInfo();
  }

  // Re-render nav if role changed (admin items etc.)
  const navContainer = document.getElementById('nce-sidebar-nav');
  if (navContainer) {
    const role = user ? user.role : 'guest';
    const items = getSidebarItems(role);
    navContainer.innerHTML = items.map(item => `
      <a href="${item.href}" class="nce-sidebar-item${item.id === activeItem ? ' active' : ''}" data-item="${item.id}" role="menuitem">
        <span class="nce-sidebar-item-icon">${item.icon}</span>
        <span class="nce-sidebar-item-label">${item.label}</span>
        ${item.badge ? `<span class="nce-sidebar-badge">${item.badge}</span>` : ''}
      </a>
    `).join('');

    // Re-attach click events for new items
    navContainer.querySelectorAll('.nce-sidebar-item').forEach(item => {
      item.addEventListener('click', () => {
        const itemId = item.getAttribute('data-item');
        setActiveItem(itemId);
        if (window.innerWidth <= 768) {
          toggleSidebar();
        }
      });
    });
  }
}
