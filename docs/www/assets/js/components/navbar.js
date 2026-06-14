/**
 * Nusantara Commodity Exchange (NCE) - Navbar Component
 * Dark fintech navigation bar with responsive hamburger menu
 */

// ── State ──────────────────────────────────────────────────────────────────
let currentUser = null;
let currentPath = '/';
let mobileMenuOpen = false;
let userDropdownOpen = false;

// ── SVG Icons ──────────────────────────────────────────────────────────────
const icons = {
  nceLogo: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="url(#nce-grad)"/>
    <defs><linearGradient id="nce-grad" x1="0" y1="0" x2="32" y2="32"><stop stop-color="#10B981"/><stop offset="1" stop-color="#06B6D4"/></linearGradient></defs>
    <path d="M8 22L13 10H16L11 22H8Z" fill="white"/>
    <path d="M14 22L19 10H22L17 22H14Z" fill="white" opacity="0.7"/>
    <path d="M20 22L25 10H28L23 22H20Z" fill="white" opacity="0.4"/>
  </svg>`,

  dashboard: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,

  commodities: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`,

  buyRequests: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`,

  properties: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,

  hamburger: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,

  close: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,

  chevronDown: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,

  user: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,

  logout: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,

  settings: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,

  profile: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
};

// ── Navigation Links ───────────────────────────────────────────────────────
const navLinks = [
  { label: 'Dashboard', href: '/dashboard', icon: icons.dashboard },
  { label: 'Commodities', href: '/commodities', icon: icons.commodities },
  { label: 'Buy Requests', href: '/buy-requests', icon: icons.buyRequests },
  { label: 'Properties', href: '/properties', icon: icons.properties }
];

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
export function renderNavbar(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) {
    console.error(`Navbar container "${containerSelector}" not found`);
    return;
  }

  // Inject navbar styles once
  if (!document.getElementById('nce-navbar-styles')) {
    const style = document.createElement('style');
    style.id = 'nce-navbar-styles';
    style.textContent = `
      .nce-navbar {
        position: sticky;
        top: 0;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 24px;
        height: 64px;
        background: rgba(10, 15, 30, 0.85);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-bottom: 1px solid rgba(16, 185, 129, 0.15);
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4);
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }

      .nce-navbar-logo {
        display: flex;
        align-items: center;
        gap: 10px;
        text-decoration: none;
        flex-shrink: 0;
      }

      .nce-navbar-logo-text {
        font-size: 20px;
        font-weight: 700;
        background: linear-gradient(135deg, #10B981, #06B6D4);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        letter-spacing: 0.5px;
      }

      .nce-navbar-links {
        display: flex;
        align-items: center;
        gap: 4px;
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .nce-navbar-link {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        color: #94A3B8;
        text-decoration: none;
        font-size: 14px;
        font-weight: 500;
        border-radius: 8px;
        transition: all 0.2s ease;
        position: relative;
        white-space: nowrap;
      }

      .nce-navbar-link:hover {
        color: #E2E8F0;
        background: rgba(16, 185, 129, 0.08);
      }

      .nce-navbar-link.active {
        color: #10B981;
        background: rgba(16, 185, 129, 0.12);
      }

      .nce-navbar-link.active::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 50%;
        transform: translateX(-50%);
        width: 24px;
        height: 2px;
        background: #10B981;
        border-radius: 1px;
      }

      .nce-navbar-auth {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }

      .nce-btn-login {
        padding: 8px 20px;
        color: #10B981;
        background: transparent;
        border: 1px solid rgba(16, 185, 129, 0.4);
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: inherit;
      }

      .nce-btn-login:hover {
        background: rgba(16, 185, 129, 0.1);
        border-color: #10B981;
      }

      .nce-btn-register {
        padding: 8px 20px;
        color: #0A0F1E;
        background: linear-gradient(135deg, #10B981, #06B6D4);
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: inherit;
      }

      .nce-btn-register:hover {
        opacity: 0.9;
        box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
      }

      .nce-navbar-user {
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        padding: 6px 12px;
        border-radius: 10px;
        transition: background 0.2s ease;
        position: relative;
      }

      .nce-navbar-user:hover {
        background: rgba(16, 185, 129, 0.08);
      }

      .nce-navbar-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 700;
        color: white;
        flex-shrink: 0;
      }

      .nce-navbar-username {
        color: #E2E8F0;
        font-size: 14px;
        font-weight: 500;
        max-width: 120px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .nce-navbar-chevron {
        color: #64748B;
        transition: transform 0.2s ease;
      }

      .nce-navbar-chevron.open {
        transform: rotate(180deg);
      }

      .nce-user-dropdown {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        min-width: 200px;
        background: #111827;
        border: 1px solid rgba(16, 185, 129, 0.15);
        border-radius: 12px;
        padding: 8px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        opacity: 0;
        visibility: hidden;
        transform: translateY(-8px);
        transition: all 0.2s ease;
        z-index: 1100;
      }

      .nce-user-dropdown.visible {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }

      .nce-dropdown-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 14px;
        color: #CBD5E1;
        text-decoration: none;
        font-size: 14px;
        border-radius: 8px;
        transition: all 0.15s ease;
        cursor: pointer;
        border: none;
        background: none;
        width: 100%;
        text-align: left;
        font-family: inherit;
      }

      .nce-dropdown-item:hover {
        background: rgba(16, 185, 129, 0.1);
        color: #10B981;
      }

      .nce-dropdown-item.danger:hover {
        background: rgba(239, 68, 68, 0.1);
        color: #EF4444;
      }

      .nce-dropdown-divider {
        height: 1px;
        background: rgba(255, 255, 255, 0.06);
        margin: 4px 0;
      }

      .nce-hamburger {
        display: none;
        background: none;
        border: none;
        color: #E2E8F0;
        cursor: pointer;
        padding: 4px;
        border-radius: 6px;
        transition: background 0.2s ease;
      }

      .nce-hamburger:hover {
        background: rgba(16, 185, 129, 0.1);
      }

      .nce-mobile-menu {
        display: none;
        position: fixed;
        top: 64px;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(10, 15, 30, 0.97);
        backdrop-filter: blur(20px);
        z-index: 999;
        padding: 24px;
        flex-direction: column;
        gap: 8px;
        animation: nceSlideDown 0.3s ease;
      }

      .nce-mobile-menu.open {
        display: flex;
      }

      .nce-mobile-link {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 16px;
        color: #94A3B8;
        text-decoration: none;
        font-size: 16px;
        font-weight: 500;
        border-radius: 10px;
        transition: all 0.2s ease;
      }

      .nce-mobile-link:hover,
      .nce-mobile-link.active {
        color: #10B981;
        background: rgba(16, 185, 129, 0.1);
      }

      .nce-mobile-auth {
        margin-top: auto;
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding-top: 24px;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
      }

      .nce-mobile-auth .nce-btn-login,
      .nce-mobile-auth .nce-btn-register {
        width: 100%;
        padding: 14px;
        font-size: 16px;
        text-align: center;
      }

      @keyframes nceSlideDown {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @media (max-width: 768px) {
        .nce-navbar-links {
          display: none;
        }
        .nce-navbar-auth {
          display: none;
        }
        .nce-navbar-user {
          display: none;
        }
        .nce-hamburger {
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Build the navbar HTML
  container.innerHTML = `
    <nav class="nce-navbar" role="navigation" aria-label="Main navigation">
      <a href="/" class="nce-navbar-logo" aria-label="NCE Home">
        ${icons.nceLogo}
        <span class="nce-navbar-logo-text">NCE</span>
      </a>

      <ul class="nce-navbar-links" role="menubar">
        ${navLinks.map(link => `
          <li role="none">
            <a href="${link.href}" class="nce-navbar-link" role="menuitem" data-path="${link.href}">
              ${link.icon}
              ${link.label}
            </a>
          </li>
        `).join('')}
      </ul>

      <div class="nce-navbar-auth" id="nce-auth-buttons"></div>
      <div id="nce-user-section" style="display:none;"></div>

      <button class="nce-hamburger" id="nce-hamburger-btn" aria-label="Toggle menu" aria-expanded="false">
        ${icons.hamburger}
      </button>
    </nav>

    <div class="nce-mobile-menu" id="nce-mobile-menu" role="menu">
      ${navLinks.map(link => `
        <a href="${link.href}" class="nce-mobile-link" role="menuitem" data-path="${link.href}">
          ${link.icon}
          ${link.label}
        </a>
      `).join('')}
      <div class="nce-mobile-auth" id="nce-mobile-auth"></div>
    </div>
  `;

  // Render initial auth state
  _renderAuthSection();

  // Set up event listeners
  _attachEventListeners();

  // Set active link based on current path
  setActiveLink(window.location.pathname);
}

// ── Internal: Render Auth Section ──────────────────────────────────────────
function _renderAuthSection() {
  const authButtons = document.getElementById('nce-auth-buttons');
  const userSection = document.getElementById('nce-user-section');
  const mobileAuth = document.getElementById('nce-mobile-auth');

  if (!authButtons || !userSection) return;

  if (currentUser) {
    // Logged-in state
    authButtons.style.display = 'none';

    const avatarColor = generateAvatarColor(currentUser.name);
    const initials = getInitials(currentUser.name);

    userSection.style.display = 'block';
    userSection.innerHTML = `
      <div class="nce-navbar-user" id="nce-user-trigger" tabindex="0" role="button" aria-haspopup="true" aria-expanded="false">
        <div class="nce-navbar-avatar" style="background: ${avatarColor};">${initials}</div>
        <span class="nce-navbar-username">${currentUser.name || 'User'}</span>
        <span class="nce-navbar-chevron" id="nce-chevron">${icons.chevronDown}</span>
        <div class="nce-user-dropdown" id="nce-user-dropdown" role="menu">
          <a href="/profile" class="nce-dropdown-item" role="menuitem">${icons.profile} Profile</a>
          <a href="/settings" class="nce-dropdown-item" role="menuitem">${icons.settings} Settings</a>
          <div class="nce-dropdown-divider"></div>
          <button class="nce-dropdown-item danger" id="nce-logout-btn" role="menuitem">${icons.logout} Logout</button>
        </div>
      </div>
    `;

    // Mobile auth for logged-in user
    if (mobileAuth) {
      mobileAuth.innerHTML = `
        <a href="/profile" class="nce-mobile-link">${icons.profile} Profile</a>
        <a href="/settings" class="nce-mobile-link">${icons.settings} Settings</a>
        <button class="nce-btn-login" id="nce-mobile-logout" style="border-color: #EF4444; color: #EF4444;">Logout</button>
      `;
      const mobileLogout = document.getElementById('nce-mobile-logout');
      if (mobileLogout) {
        mobileLogout.addEventListener('click', () => {
          updateAuthState(null);
          window.location.href = '/';
        });
      }
    }

    // Dropdown toggle
    const trigger = document.getElementById('nce-user-trigger');
    const dropdown = document.getElementById('nce-user-dropdown');
    const chevron = document.getElementById('nce-chevron');

    if (trigger && dropdown) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdownOpen = !userDropdownOpen;
        dropdown.classList.toggle('visible', userDropdownOpen);
        if (chevron) chevron.classList.toggle('open', userDropdownOpen);
        trigger.setAttribute('aria-expanded', userDropdownOpen.toString());
      });

      trigger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          trigger.click();
        }
      });
    }

    // Logout
    const logoutBtn = document.getElementById('nce-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        updateAuthState(null);
        window.location.href = '/';
      });
    }

  } else {
    // Logged-out state
    userSection.style.display = 'none';
    authButtons.style.display = 'flex';
    authButtons.innerHTML = `
      <button class="nce-btn-login" id="nce-login-btn">Login</button>
      <button class="nce-btn-register" id="nce-register-btn">Register</button>
    `;

    // Mobile auth for logged-out user
    if (mobileAuth) {
      mobileAuth.innerHTML = `
        <button class="nce-btn-login" id="nce-mobile-login">Login</button>
        <button class="nce-btn-register" id="nce-mobile-register">Register</button>
      `;
      const mobileLogin = document.getElementById('nce-mobile-login');
      const mobileRegister = document.getElementById('nce-mobile-register');
      if (mobileLogin) mobileLogin.addEventListener('click', () => { window.location.href = '/login'; });
      if (mobileRegister) mobileRegister.addEventListener('click', () => { window.location.href = '/register'; });
    }

    const loginBtn = document.getElementById('nce-login-btn');
    const registerBtn = document.getElementById('nce-register-btn');
    if (loginBtn) loginBtn.addEventListener('click', () => { window.location.href = '/login'; });
    if (registerBtn) registerBtn.addEventListener('click', () => { window.location.href = '/register'; });
  }
}

// ── Internal: Attach Event Listeners ───────────────────────────────────────
function _attachEventListeners() {
  // Hamburger menu
  const hamburgerBtn = document.getElementById('nce-hamburger-btn');
  const mobileMenu = document.getElementById('nce-mobile-menu');

  if (hamburgerBtn && mobileMenu) {
    hamburgerBtn.addEventListener('click', () => {
      mobileMenuOpen = !mobileMenuOpen;
      mobileMenu.classList.toggle('open', mobileMenuOpen);
      hamburgerBtn.setAttribute('aria-expanded', mobileMenuOpen.toString());
      hamburgerBtn.innerHTML = mobileMenuOpen ? icons.close : icons.hamburger;
    });
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('nce-user-dropdown');
    const trigger = document.getElementById('nce-user-trigger');
    if (dropdown && trigger && !trigger.contains(e.target)) {
      userDropdownOpen = false;
      dropdown.classList.remove('visible');
      const chevron = document.getElementById('nce-chevron');
      if (chevron) chevron.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    }
  });

  // Close mobile menu on resize
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && mobileMenuOpen) {
      mobileMenuOpen = false;
      const mobileMenuEl = document.getElementById('nce-mobile-menu');
      if (mobileMenuEl) mobileMenuEl.classList.remove('open');
      const hamburgerBtn = document.getElementById('nce-hamburger-btn');
      if (hamburgerBtn) {
        hamburgerBtn.innerHTML = icons.hamburger;
        hamburgerBtn.setAttribute('aria-expanded', 'false');
      }
    }
  });
}

// ── Public: Update Auth State ──────────────────────────────────────────────
export function updateAuthState(user) {
  currentUser = user;
  _renderAuthSection();
}

// ── Public: Set Active Link ────────────────────────────────────────────────
export function setActiveLink(path) {
  currentPath = path;

  // Desktop links
  const desktopLinks = document.querySelectorAll('.nce-navbar-link');
  desktopLinks.forEach(link => {
    const linkPath = link.getAttribute('data-path');
    link.classList.toggle('active', linkPath === path);
  });

  // Mobile links
  const mobileLinks = document.querySelectorAll('.nce-mobile-link');
  mobileLinks.forEach(link => {
    const linkPath = link.getAttribute('data-path');
    link.classList.toggle('active', linkPath === path);
  });
}
