/**
 * Dashboard Page Module - NCE Nusantara Commodity Exchange
 * Entry point: dashboard.html
 *
 * Initializes and manages the dashboard page: stat cards, price/volume charts,
 * recent activity table, sidebar toggle, period toggle, auto-refresh, and quick actions.
 */

import { getDashboardStats, getRecentActivity, getStoredUser } from '../../services/userService.js';
import { getPriceChartData, getVolumeChartData } from '../../services/commodityService.js';
import { renderStatCard, renderSkeleton, renderErrorState } from '../../components/cards.js';
import { renderPriceChart, renderVolumeChart, updatePeriodToggle } from '../../components/charts.js';
import { showNotification } from '../../components/modal.js';
import {
  formatCurrency,
  formatNumber,
  formatCompactNumber,
  formatVolume,
  formatRelativeTime,
  formatStatus,
} from '../../utils/formatter.js';
import { escapeHtml, getStatusColor, debounce } from '../../utils/helpers.js';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const state = {
  stats: null,
  currentPeriod: '1W',
  refreshInterval: null,
  isLoading: false,
};

// ---------------------------------------------------------------------------
// DOM References (lazily initialized)
// ---------------------------------------------------------------------------

let els = {};

function getEls() {
  if (Object.keys(els).length > 0) return els;

  els = {
    sidebar: document.getElementById('sidebar'),
    sidebarOverlay: document.getElementById('sidebar-overlay'),
    openSidebarBtn: document.getElementById('open-sidebar-btn'),
    closeSidebarBtn: document.getElementById('close-sidebar-btn'),
    statsGrid: document.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4'),
    chartContainer: document.querySelector('.lg\\:col-span-2 .relative.h-56'),
    chartParent: document.querySelector('.lg\\:col-span-2'),
    activityTableBody: document.querySelector('tbody.divide-y'),
    periodButtons: document.querySelectorAll('.flex.items-center.gap-2 button'),
    sidebarLinks: document.querySelectorAll('.sidebar-link'),
    notifBtn: document.querySelector('button.relative'),
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
// Notification Button
// ---------------------------------------------------------------------------

function initNotificationButton() {
  const { notifBtn } = getEls();
  if (notifBtn) {
    notifBtn.addEventListener('click', () => {
      showNotification('Tidak ada notifikasi baru', 'success');
    });
  }
}

// ---------------------------------------------------------------------------
// Stat Cards
// ---------------------------------------------------------------------------

function renderStatCards(stats) {
  const { statsGrid } = getEls();
  if (!statsGrid) return;

  const statDefinitions = [
    {
      label: 'Total Listing Aktif',
      value: String(stats.totalListings),
      change: stats.listingChange,
      color: 'emerald',
      icon: '<svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>',
    },
    {
      label: 'Pembeli Aktif',
      value: String(stats.activeBuyers),
      change: stats.buyerChange,
      color: 'cyan',
      icon: '<svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>',
    },
    {
      label: 'Penjual Aktif',
      value: String(stats.activeSellers),
      change: stats.sellerChange,
      color: 'amber',
      icon: '<svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/></svg>',
    },
    {
      label: 'Total Transaksi Bulan Ini',
      value: formatCompactNumber(stats.totalTransactions),
      change: stats.transactionChange,
      color: 'emerald',
      icon: '<svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    },
  ];

  statsGrid.innerHTML = statDefinitions.map(stat => renderStatCard(stat)).join('');
}

function showStatCardsLoading() {
  const { statsGrid } = getEls();
  if (!statsGrid) return;
  statsGrid.innerHTML = Array(4).fill(renderSkeleton('stat')).join('');
}

function showStatCardsError(message) {
  const { statsGrid } = getEls();
  if (!statsGrid) return;
  statsGrid.innerHTML = `<div class="col-span-full">${renderErrorState(message, 'retry-stats-btn')}</div>`;
  const retryBtn = statsGrid.querySelector('.retry-stats-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => loadDashboardStats());
  }
}

// ---------------------------------------------------------------------------
// Charts
// ---------------------------------------------------------------------------

async function renderCharts(period) {
  const { chartContainer, chartParent } = getEls();
  if (!chartContainer || !chartParent) return;

  try {
    const chartData = await getPriceChartData(period);
    renderPriceChart(chartContainer, chartData);
  } catch (error) {
    console.error('Failed to render charts:', error);
  }
}

function initPeriodToggle() {
  const { periodButtons } = getEls();
  if (!periodButtons || periodButtons.length === 0) return;

  periodButtons.forEach(btn => {
    btn.addEventListener('click', async function () {
      const text = this.textContent.trim();
      const periodMap = { '7H': '1W', '1B': '1M', '3B': '3M', '1T': '1Y' };
      const period = periodMap[text];
      if (!period) return;

      state.currentPeriod = period;
      updatePeriodToggle(period, periodButtons);
      await renderCharts(period);
    });
  });
}

// ---------------------------------------------------------------------------
// Recent Activity Table
// ---------------------------------------------------------------------------

function renderActivityTable(activities) {
  const { activityTableBody } = getEls();
  if (!activityTableBody) return;

  if (!activities || activities.length === 0) {
    activityTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="py-8 text-center text-slate-500 text-sm">Belum ada aktivitas terkini</td>
      </tr>`;
    return;
  }

  activityTableBody.innerHTML = activities.map(activity => {
    const typeMap = {
      sale: { label: 'Penjualan', color: 'emerald' },
      purchase: { label: 'Pembelian', color: 'cyan' },
      request: { label: 'Permintaan', color: 'violet' },
    };
    const typeInfo = typeMap[activity.type] || { label: activity.type, color: 'slate' };
    const statusColor = getStatusColor(activity.status);
    const statusLabel = formatStatus(activity.status);
    const isPulse = activity.status === 'active' ? 'animate-pulse' : '';

    return `
      <tr class="hover:bg-slate-800/30 transition-colors">
        <td class="py-3.5 pr-4">
          <span class="inline-flex items-center px-2 py-0.5 bg-${typeInfo.color}-500/10 border border-${typeInfo.color}-500/20 rounded text-${typeInfo.color}-400 text-[10px] font-medium">${typeInfo.label}</span>
        </td>
        <td class="py-3.5 pr-4 text-sm text-white font-medium">${escapeHtml(activity.commodity)}</td>
        <td class="py-3.5 pr-4 text-sm text-slate-300">${formatVolume(activity.volume, activity.unit)}</td>
        <td class="py-3.5 pr-4 text-sm text-${typeInfo.color}-400 font-medium">${formatCurrency(activity.price)}/${activity.unit}</td>
        <td class="py-3.5 pr-4 text-sm text-slate-300">${escapeHtml(activity.partner)}</td>
        <td class="py-3.5 pr-4">
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium" style="background: ${statusColor}15; color: ${statusColor}">
            <span class="w-1.5 h-1.5 rounded-full ${isPulse}" style="background: ${statusColor}"></span>
            ${statusLabel}
          </span>
        </td>
        <td class="py-3.5 text-sm text-slate-400 text-right">${formatRelativeTime(activity.date)}</td>
      </tr>`;
  }).join('');
}

function showActivityLoading() {
  const { activityTableBody } = getEls();
  if (!activityTableBody) return;

  const shimmer = 'animate-pulse bg-slate-700/30 rounded';
  activityTableBody.innerHTML = Array(3).fill(`
    <tr>
      <td class="py-3.5 pr-4"><div class="w-16 h-4 ${shimmer}"></div></td>
      <td class="py-3.5 pr-4"><div class="w-32 h-4 ${shimmer}"></div></td>
      <td class="py-3.5 pr-4"><div class="w-16 h-4 ${shimmer}"></div></td>
      <td class="py-3.5 pr-4"><div class="w-20 h-4 ${shimmer}"></div></td>
      <td class="py-3.5 pr-4"><div class="w-24 h-4 ${shimmer}"></div></td>
      <td class="py-3.5 pr-4"><div class="w-14 h-4 ${shimmer}"></div></td>
      <td class="py-3.5"><div class="w-16 h-4 ${shimmer}"></div></td>
    </tr>`).join('');
}

// ---------------------------------------------------------------------------
// Quick Action Buttons
// ---------------------------------------------------------------------------

function initQuickActions() {
  document.addEventListener('click', (e) => {
    const target = e.target.closest('a');
    if (!target) return;

    const href = target.getAttribute('href');
    const text = target.textContent.trim();

    if (text.includes('Tambah Listing') || text.includes('Create Listing')) {
      e.preventDefault();
      window.location.href = 'commodities.html';
    } else if (text.includes('Buat Permintaan Beli') || text.includes('Create Buy Request')) {
      e.preventDefault();
      window.location.href = 'buy-requests.html';
    } else if (text.includes('Lihat Semua Komoditas') || text.includes('View All Commodities')) {
      e.preventDefault();
      window.location.href = 'commodities.html';
    }
  });
}

// ---------------------------------------------------------------------------
// Data Loading
// ---------------------------------------------------------------------------

async function loadDashboardStats() {
  showStatCardsLoading();

  try {
    const stats = await getDashboardStats();
    state.stats = stats;
    renderStatCards(stats);
  } catch (error) {
    console.error('Failed to load dashboard stats:', error);
    showStatCardsError('Gagal memuat statistik dashboard');
  }
}

async function loadRecentActivity() {
  showActivityLoading();

  try {
    const activities = await getRecentActivity(10);
    renderActivityTable(activities);
  } catch (error) {
    console.error('Failed to load recent activity:', error);
    const { activityTableBody } = getEls();
    if (activityTableBody) {
      activityTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="py-8 text-center">
            <p class="text-slate-500 text-sm mb-2">Gagal memuat aktivitas terkini</p>
            <button class="retry-activity-btn px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors">Coba Lagi</button>
          </td>
        </tr>`;
      const retryBtn = activityTableBody.querySelector('.retry-activity-btn');
      if (retryBtn) retryBtn.addEventListener('click', loadRecentActivity);
    }
  }
}

async function loadDashboard() {
  state.isLoading = true;

  await Promise.allSettled([
    loadDashboardStats(),
    loadRecentActivity(),
    renderCharts(state.currentPeriod),
  ]);

  state.isLoading = false;
}

// ---------------------------------------------------------------------------
// Auto-Refresh
// ---------------------------------------------------------------------------

function startAutoRefresh() {
  if (state.refreshInterval) clearInterval(state.refreshInterval);

  state.refreshInterval = setInterval(async () => {
    try {
      const stats = await getDashboardStats();
      state.stats = stats;

      const { statsGrid } = getEls();
      if (statsGrid) {
        const statCards = statsGrid.querySelectorAll('.text-2xl.font-bold.text-white');
        statCards.forEach(card => {
          card.style.transition = 'opacity 0.3s ease';
          card.style.opacity = '0.6';
          setTimeout(() => { card.style.opacity = '1'; }, 300);
        });

        const newCards = renderStatCard({
          label: 'Total Listing Aktif',
          value: String(stats.totalListings),
          change: stats.listingChange,
          color: 'emerald',
          icon: '<svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>',
        });
      }

      const activities = await getRecentActivity(10);
      renderActivityTable(activities);
    } catch (error) {
      console.warn('Auto-refresh failed:', error);
    }
  }, 60000);
}

function stopAutoRefresh() {
  if (state.refreshInterval) {
    clearInterval(state.refreshInterval);
    state.refreshInterval = null;
  }
}

// ---------------------------------------------------------------------------
// Initialize
// ---------------------------------------------------------------------------

/**
 * Main initialization function for the Dashboard page.
 * Called when the page loads.
 */
export async function initDashboard() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    await onReady();
  }
}

async function onReady() {
  console.log('NCE Dashboard module initializing...');

  initSidebarToggle();
  initSidebarNavigation();
  initNotificationButton();
  initPeriodToggle();
  initQuickActions();

  await loadDashboard();

  startAutoRefresh();

  window.addEventListener('beforeunload', stopAutoRefresh);

  console.log('NCE Dashboard module loaded');
}

// ---------------------------------------------------------------------------
// Auto-initialize when loaded as ES module
// ---------------------------------------------------------------------------

initDashboard();
