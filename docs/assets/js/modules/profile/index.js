/**
 * Profile Page Module - NCE Nusantara Commodity Exchange
 * Entry point: profile.html
 *
 * Initializes and manages the user profile page: company info display,
 * verification badges, listed commodities table, edit profile form with
 * validation, profile update submission, sidebar toggle, and logout.
 */

import { getProfile, updateProfile, logout, isAuthenticated } from '../../services/userService.js';
import { renderSkeleton, renderErrorState } from '../../components/cards.js';
import { showNotification } from '../../components/modal.js';
import {
  formatCurrency,
  formatNumber,
  formatVolume,
  formatCommodityType,
  formatStatus,
  formatDate,
  formatRating,
  maskNPWP,
} from '../../utils/formatter.js';
import { escapeHtml, debounce } from '../../utils/helpers.js';
import {
  validateRequired,
  validateEmail,
  validatePhone,
  validateMinLength,
  validateForm,
} from '../../utils/validator.js';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const state = {
  profile: null,
  isEditing: false,
  isLoading: false,
  originalFormData: {},
};

// ---------------------------------------------------------------------------
// DOM References
// ---------------------------------------------------------------------------

let els = {};

function getEls() {
  if (Object.keys(els).length > 0) return els;

  els = {
    sidebar: document.getElementById('sidebar'),
    sidebarOverlay: document.getElementById('sidebar-overlay'),
    openSidebarBtn: document.getElementById('open-sidebar-btn'),
    closeSidebarBtn: document.getElementById('close-sidebar-btn'),
    profileContainer: document.getElementById('profile-container'),
    companyInfo: document.getElementById('company-info'),
    verificationBadges: document.getElementById('verification-badges'),
    commoditiesTable: document.getElementById('commodities-table'),
    editForm: document.getElementById('edit-profile-form'),
    editBtn: document.getElementById('edit-profile-btn'),
    cancelBtn: document.getElementById('cancel-profile-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    sidebarLinks: document.querySelectorAll('.sidebar-link'),
  };

  return els;
}

// ---------------------------------------------------------------------------
// Sidebar Toggle
// ---------------------------------------------------------------------------

function openSidebar() {
  const { sidebar, sidebarOverlay } = getEls();
  if (sidebar && sidebarOverlay) {
    sidebar.classList.remove('-translate-x-full');
    sidebarOverlay.classList.remove('hidden');
  }
}

function closeSidebar() {
  const { sidebar, sidebarOverlay } = getEls();
  if (sidebar && sidebarOverlay) {
    sidebar.classList.add('-translate-x-full');
    sidebarOverlay.classList.add('hidden');
  }
}

function initSidebarToggle() {
  const { openSidebarBtn, closeSidebarBtn, sidebarOverlay } = getEls();
  if (openSidebarBtn) openSidebarBtn.addEventListener('click', openSidebar);
  if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
  if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);
}

// ---------------------------------------------------------------------------
// Sidebar Navigation Active State
// ---------------------------------------------------------------------------

function initSidebarNavigation() {
  const { sidebarLinks } = getEls();
  sidebarLinks.forEach(link => {
    link.addEventListener('click', function () {
      sidebarLinks.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
    });
  });
}

// ---------------------------------------------------------------------------
// Company Info Rendering
// ---------------------------------------------------------------------------

function renderCompanyInfo(profile) {
  const { companyInfo } = getEls();
  if (!companyInfo) return;

  const ratingStars = formatRating(profile.rating);
  const memberSince = formatDate(profile.memberSince);

  companyInfo.innerHTML = `
    <div class="bg-navy-800 border border-slate-700/50 rounded-xl p-6">
      <div class="flex items-start gap-4 mb-6">
        <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
          ${profile.companyName ? profile.companyName.split(' ').map(w => w[0]).slice(0, 2).join('') : 'N/A'}
        </div>
        <div class="flex-1 min-w-0">
          <h2 class="text-xl font-bold text-white mb-1">${escapeHtml(profile.companyName)}</h2>
          <p class="text-sm text-slate-400 flex items-center gap-2">
            <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            ${escapeHtml(profile.email)}
          </p>
          <p class="text-sm text-slate-400 flex items-center gap-2 mt-1">
            <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            ${escapeHtml(profile.phone)}
          </p>
          <div class="flex items-center gap-3 mt-2">
            <span class="text-sm" title="Rating: ${profile.rating}/5">${ratingStars}</span>
            <span class="text-xs text-slate-500">${profile.totalTransactions} transaksi</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="bg-navy-900/50 rounded-lg p-3">
          <p class="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Alamat</p>
          <p class="text-sm text-white">${escapeHtml(profile.address)}</p>
          <p class="text-xs text-slate-400">${escapeHtml(profile.city)}, ${escapeHtml(profile.province)} ${escapeHtml(profile.postalCode || '')}</p>
        </div>
        <div class="bg-navy-900/50 rounded-lg p-3">
          <p class="text-[10px] text-slate-500 uppercase tracking-wider mb-1">NPWP</p>
          <p class="text-sm text-white font-mono">${maskNPWP(profile.npwp)}</p>
        </div>
        <div class="bg-navy-900/50 rounded-lg p-3">
          <p class="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Tipe Bisnis</p>
          <p class="text-sm text-white capitalize">${escapeHtml(profile.businessType || '-')}</p>
        </div>
        <div class="bg-navy-900/50 rounded-lg p-3">
          <p class="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Bergabung Sejak</p>
          <p class="text-sm text-white">${memberSince}</p>
        </div>
      </div>

      ${profile.description ? `
      <div class="mt-4">
        <p class="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Deskripsi</p>
        <p class="text-sm text-slate-300 leading-relaxed">${escapeHtml(profile.description)}</p>
      </div>` : ''}
    </div>`;
}

// ---------------------------------------------------------------------------
// Verification Badges
// ---------------------------------------------------------------------------

function renderVerificationBadges(profile) {
  const { verificationBadges } = getEls();
  if (!verificationBadges) return;

  const badges = [];

  if (profile.verificationStatus === 'verified') {
    badges.push({
      label: 'Terverifikasi',
      color: 'emerald',
      icon: '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>',
    });
  }

  if (profile.npwp) {
    badges.push({
      label: 'NPWP Tercantum',
      color: 'cyan',
      icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>',
    });
  }

  if (profile.totalTransactions >= 50) {
    badges.push({
      label: 'Trader Berpengalaman',
      color: 'amber',
      icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>',
    });
  }

  if (profile.rating >= 4.5) {
    badges.push({
      label: 'Rating Tinggi',
      color: 'emerald',
      icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    });
  }

  if (badges.length === 0) {
    verificationBadges.innerHTML = '';
    return;
  }

  verificationBadges.innerHTML = `
    <div class="bg-navy-800 border border-slate-700/50 rounded-xl p-5">
      <h3 class="text-sm font-semibold text-white mb-3">Badges & Verifikasi</h3>
      <div class="flex flex-wrap gap-2">
        ${badges.map(badge => `
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-${badge.color}-500/10 border border-${badge.color}-500/20 rounded-lg text-${badge.color}-400 text-xs font-medium">
            ${badge.icon}
            ${badge.label}
          </span>
        `).join('')}
      </div>
    </div>`;
}

// ---------------------------------------------------------------------------
// Commodities Table
// ---------------------------------------------------------------------------

function renderCommoditiesTable(commodities) {
  const { commoditiesTable } = getEls();
  if (!commoditiesTable) return;

  if (!commodities || commodities.length === 0) {
    commoditiesTable.innerHTML = `
      <div class="bg-navy-800 border border-slate-700/50 rounded-xl p-5">
        <h3 class="text-sm font-semibold text-white mb-4">Komoditas Anda</h3>
        <p class="text-sm text-slate-400 text-center py-8">Belum ada komoditas yang terdaftar</p>
      </div>`;
    return;
  }

  commoditiesTable.innerHTML = `
    <div class="bg-navy-800 border border-slate-700/50 rounded-xl p-5">
      <div class="flex items-center justify-between mb-5">
        <h3 class="text-sm font-semibold text-white">Komoditas Anda</h3>
        <span class="text-xs text-slate-400">${commodities.length} listing</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full min-w-[600px]">
          <thead>
            <tr class="border-b border-slate-700/50">
              <th class="text-left text-[10px] text-slate-500 uppercase tracking-wider font-semibold pb-3 pr-4">Nama</th>
              <th class="text-left text-[10px] text-slate-500 uppercase tracking-wider font-semibold pb-3 pr-4">Jenis</th>
              <th class="text-left text-[10px] text-slate-500 uppercase tracking-wider font-semibold pb-3 pr-4">Harga</th>
              <th class="text-left text-[10px] text-slate-500 uppercase tracking-wider font-semibold pb-3 pr-4">Volume</th>
              <th class="text-left text-[10px] text-slate-500 uppercase tracking-wider font-semibold pb-3 pr-4">Status</th>
              <th class="text-right text-[10px] text-slate-500 uppercase tracking-wider font-semibold pb-3">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-700/30">
            ${commodities.map(commodity => {
              const statusColor = getStatusColor(commodity.status);
              const statusLabel = formatStatus(commodity.status);
              return `
              <tr class="hover:bg-slate-800/30 transition-colors">
                <td class="py-3.5 pr-4 text-sm text-white font-medium">${escapeHtml(commodity.name)}</td>
                <td class="py-3.5 pr-4 text-sm text-slate-300">${formatCommodityType(commodity.type)}</td>
                <td class="py-3.5 pr-4 text-sm text-emerald-400 font-medium">${formatCurrency(commodity.price)}/${commodity.unit}</td>
                <td class="py-3.5 pr-4 text-sm text-slate-300">${formatVolume(commodity.volume, commodity.unit)}</td>
                <td class="py-3.5 pr-4">
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium" style="background: ${statusColor}15; color: ${statusColor}">
                    <span class="w-1.5 h-1.5 rounded-full" style="background: ${statusColor}"></span>
                    ${statusLabel}
                  </span>
                </td>
                <td class="py-3.5 text-right">
                  <button class="p-1.5 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-700/50 transition-colors edit-listing-btn" data-commodity-id="${commodity.id}" title="Edit">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  </button>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;

  commoditiesTable.querySelectorAll('.edit-listing-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const commodityId = btn.dataset.commodityId;
      showNotification('Fitur edit listing akan segera tersedia!', 'success');
    });
  });
}

function getStatusColor(status) {
  const colorMap = {
    active: '#10b981',
    verified: '#10b981',
    completed: '#10b981',
    pending: '#f59e0b',
    rejected: '#ef4444',
    cancelled: '#ef4444',
    inactive: '#6b7280',
  };
  return colorMap[status] || '#6b7280';
}

// ---------------------------------------------------------------------------
// Edit Profile Form
// ---------------------------------------------------------------------------

function populateEditForm(profile) {
  const { editForm } = getEls();
  if (!editForm) return;

  const fields = {
    companyName: profile.companyName || '',
    email: profile.email || '',
    phone: profile.phone || '',
    address: profile.address || '',
    city: profile.city || '',
    province: profile.province || '',
    postalCode: profile.postalCode || '',
    description: profile.description || '',
  };

  state.originalFormData = { ...fields };

  for (const [name, value] of Object.entries(fields)) {
    const input = editForm.querySelector(`[name="${name}"]`);
    if (input) {
      input.value = value;
    }
  }
}

function initEditProfile() {
  const { editBtn, editForm, cancelBtn } = getEls();

  if (editBtn) {
    editBtn.addEventListener('click', () => {
      state.isEditing = true;
      toggleEditMode(true);
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      state.isEditing = false;
      populateEditForm(state.profile);
      clearValidationErrors();
      toggleEditMode(false);
    });
  }

  if (editForm) {
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleProfileSubmit();
    });
  }
}

function toggleEditMode(editing) {
  const { editForm, editBtn, cancelBtn, companyInfo, verificationBadges } = getEls();

  if (editForm) {
    const inputs = editForm.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      input.disabled = !editing;
      if (editing) {
        input.classList.remove('bg-navy-900/30', 'cursor-not-allowed');
        input.classList.add('bg-navy-900', 'focus:border-emerald-500/50', 'focus:ring-1', 'focus:ring-emerald-500/20');
      } else {
        input.classList.add('bg-navy-900/30', 'cursor-not-allowed');
        input.classList.remove('bg-navy-900', 'focus:border-emerald-500/50', 'focus:ring-1', 'focus:ring-emerald-500/20');
      }
    });
  }

  if (editBtn) {
    if (editing) {
      editBtn.textContent = 'Simpan Perubahan';
      editBtn.type = 'submit';
      editBtn.classList.remove('bg-emerald-500/10', 'border-emerald-500/20', 'text-emerald-400');
      editBtn.classList.add('bg-gradient-to-r', 'from-emerald-500', 'to-cyan-500', 'text-white');
    } else {
      editBtn.textContent = 'Edit Profil';
      editBtn.type = 'button';
      editBtn.classList.add('bg-emerald-500/10', 'border-emerald-500/20', 'text-emerald-400');
      editBtn.classList.remove('bg-gradient-to-r', 'from-emerald-500', 'to-cyan-500', 'text-white');
    }
  }

  if (cancelBtn) {
    cancelBtn.style.display = editing ? 'inline-flex' : 'none';
  }
}

function clearValidationErrors() {
  document.querySelectorAll('.validation-error').forEach(el => el.remove());
  document.querySelectorAll('.border-red-500/50').forEach(el => {
    el.classList.remove('border-red-500/50');
  });
}

function showValidationErrors(errors) {
  clearValidationErrors();

  for (const [fieldName, message] of Object.entries(errors)) {
    const input = document.querySelector(`[name="${fieldName}"]`);
    if (input) {
      input.classList.add('border-red-500/50');
      const errorEl = document.createElement('p');
      errorEl.className = 'validation-error text-red-400 text-[10px] mt-1';
      errorEl.textContent = message;
      input.parentNode.appendChild(errorEl);
    }
  }
}

async function handleProfileSubmit() {
  const { editForm } = getEls();
  if (!editForm) return;

  const formData = new FormData(editForm);
  const data = Object.fromEntries(formData.entries());

  const rules = {
    companyName: [(v) => validateRequired(v, 'Nama perusahaan'), (v) => validateMinLength(v, 3, 'Nama perusahaan')],
    email: [validateEmail],
    phone: [validatePhone],
    address: [(v) => validateRequired(v, 'Alamat')],
    city: [(v) => validateRequired(v, 'Kota')],
    province: [(v) => validateRequired(v, 'Provinsi')],
  };

  const { isValid, errors } = validateForm(rules, data);

  if (!isValid) {
    showValidationErrors(errors);
    showNotification('Mohon periksa kembali data yang diisi', 'error');
    return;
  }

  clearValidationErrors();

  const submitBtn = editForm.querySelector('button[type="submit"], #edit-profile-btn');
  const originalText = submitBtn ? submitBtn.textContent : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Menyimpan...`;
  }

  try {
    const updatedProfile = await updateProfile(data);
    state.profile = updatedProfile;
    state.isEditing = false;

    renderCompanyInfo(updatedProfile);
    renderVerificationBadges(updatedProfile);
    toggleEditMode(false);

    showNotification('Profil berhasil disimpan!', 'success');
  } catch (error) {
    console.error('Failed to update profile:', error);
    showNotification('Gagal menyimpan profil: ' + error.message, 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }
}

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

function initLogout() {
  const { logoutBtn } = getEls();
  if (!logoutBtn) {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href="index.html"]');
      if (link && link.textContent.trim().includes('Keluar')) {
        e.preventDefault();
        if (confirm('Apakah Anda yakin ingin keluar?')) {
          logout();
        }
      }
    });
    return;
  }

  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('Apakah Anda yakin ingin keluar?')) {
      logout();
    }
  });
}

// ---------------------------------------------------------------------------
// Loading & Error States
// ---------------------------------------------------------------------------

function showProfileLoading() {
  const { profileContainer, companyInfo, commoditiesTable } = getEls();

  if (companyInfo) {
    companyInfo.innerHTML = `
      <div class="bg-navy-800 border border-slate-700/50 rounded-xl p-6">
        <div class="flex items-start gap-4 mb-6">
          <div class="w-16 h-16 rounded-xl animate-pulse bg-slate-700/50 flex-shrink-0"></div>
          <div class="flex-1 space-y-2">
            <div class="w-48 h-5 animate-pulse bg-slate-700/50 rounded"></div>
            <div class="w-36 h-4 animate-pulse bg-slate-700/50 rounded"></div>
            <div class="w-40 h-4 animate-pulse bg-slate-700/50 rounded"></div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          ${Array(4).fill('<div class="bg-navy-900/50 rounded-lg p-3"><div class="w-20 h-3 animate-pulse bg-slate-700/50 rounded mb-2"></div><div class="w-32 h-4 animate-pulse bg-slate-700/50 rounded"></div></div>').join('')}
        </div>
      </div>`;
  }

  if (commoditiesTable) {
    commoditiesTable.innerHTML = `
      <div class="bg-navy-800 border border-slate-700/50 rounded-xl p-5">
        <div class="w-28 h-4 animate-pulse bg-slate-700/50 rounded mb-4"></div>
        ${Array(3).fill('<div class="flex gap-4 py-3 border-b border-slate-700/30"><div class="w-32 h-4 animate-pulse bg-slate-700/50 rounded"></div><div class="w-16 h-4 animate-pulse bg-slate-700/50 rounded"></div><div class="w-24 h-4 animate-pulse bg-slate-700/50 rounded"></div></div>').join('')}
      </div>`;
  }
}

function showProfileError(message) {
  const { profileContainer } = getEls();
  if (profileContainer) {
    profileContainer.innerHTML = renderErrorState(message, 'retry-profile-btn');
    const retryBtn = profileContainer.querySelector('.retry-profile-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', loadProfile);
    }
  }
}

// ---------------------------------------------------------------------------
// Data Loading
// ---------------------------------------------------------------------------

async function loadProfile() {
  state.isLoading = true;
  showProfileLoading();

  try {
    const profile = await getProfile();
    state.profile = profile;

    renderCompanyInfo(profile);
    renderVerificationBadges(profile);
    renderCommoditiesTable(profile.commodities || []);
    populateEditForm(profile);
  } catch (error) {
    console.error('Failed to load profile:', error);
    showProfileError('Gagal memuat profil perusahaan');
  } finally {
    state.isLoading = false;
  }
}

// ---------------------------------------------------------------------------
// Initialize
// ---------------------------------------------------------------------------

/**
 * Main initialization function for the Profile page.
 * Called when the page loads.
 */
export async function initProfile() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    await onReady();
  }
}

async function onReady() {
  console.log('NCE Profile module initializing...');

  getEls();

  initSidebarToggle();
  initSidebarNavigation();
  initEditProfile();
  initLogout();

  await loadProfile();

  console.log('NCE Profile module loaded');
}

// ---------------------------------------------------------------------------
// Auto-initialize when loaded as ES module
// ---------------------------------------------------------------------------

initProfile();
