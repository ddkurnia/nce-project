// Notification Panel — dropdown panel from header bell icon
import { getState, subscribe } from '../state.js';
import { getNotifications, markAsRead, markAllRead, getNotifIcon, getNotifTypeInfo } from '../services/notificationService.js';
import { timeAgo } from '../utils/helpers.js';

let panelOpen = false;
let panelEl = null;

export function initNotificationPanel() {
  const bellBtn = document.getElementById('header-notif-btn');
  if (!bellBtn) return;

  bellBtn.addEventListener('click', togglePanel);

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (panelOpen && panelEl && !panelEl.contains(e.target) && !bellBtn.contains(e.target)) {
      closePanel();
    }
  });

  // Update badge from state
  subscribe('unreadCount', (count) => {
    const dot = document.getElementById('notif-dot');
    if (dot) {
      dot.style.display = count > 0 ? 'block' : 'none';
    }
  });
}

function togglePanel() {
  panelOpen ? closePanel() : openPanel();
}

function openPanel() {
  panelOpen = true;
  renderPanel();
}

function closePanel() {
  panelOpen = false;
  if (panelEl) {
    panelEl.remove();
    panelEl = null;
  }
}

function renderPanel() {
  if (panelEl) panelEl.remove();

  const notifs = getNotifications();
  const unread = notifs.filter(n => !n.read);
  const read = notifs.filter(n => n.read);

  panelEl = document.createElement('div');
  panelEl.className = 'notif-panel';
  panelEl.innerHTML = `
    <div class="notif-panel-header">
      <h4>Notifikasi</h4>
      ${unread.length > 0 ? `
        <button class="notif-mark-all" id="notif-mark-all">Tandai dibaca</button>
      ` : ''}
    </div>
    <div class="notif-panel-body">
      ${notifs.length === 0 ? `
        <div class="notif-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--text-muted);opacity:0.4;"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
          <p>Belum ada notifikasi</p>
        </div>
      ` : ''}
      ${unread.length > 0 ? `
        <div class="notif-section-label">Baru (${unread.length})</div>
        ${unread.map(n => renderNotifItem(n)).join('')}
      ` : ''}
      ${read.length > 0 ? `
        <div class="notif-section-label">Sebelumnya</div>
        ${read.slice(0, 5).map(n => renderNotifItem(n)).join('')}
      ` : ''}
    </div>
    <div class="notif-panel-footer">
      <a href="#/notifications" class="notif-view-all">Lihat Semua Notifikasi</a>
    </div>
  `;

  document.getElementById('main-header').appendChild(panelEl);

  // Event listeners
  panelEl.querySelectorAll('[data-notif-id]').forEach(el => {
    el.addEventListener('click', () => {
      markAsRead(el.dataset.notifId);
      renderPanel(); // Re-render to update read state
    });
  });

  const markAllBtn = document.getElementById('notif-mark-all');
  if (markAllBtn) {
    markAllBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      markAllRead();
      renderPanel();
    });
  }
}

function renderNotifItem(notif) {
  const info = getNotifTypeInfo(notif.type);
  return `
    <div class="notif-item ${notif.read ? '' : 'unread'}" data-notif-id="${notif.id}">
      <div class="notif-icon" style="background:${info.color}20;color:${info.color};">${getNotifIcon(notif.type)}</div>
      <div class="notif-content">
        <div class="notif-title">${notif.title}</div>
        <div class="notif-body">${notif.body}</div>
        <div class="notif-time">${timeAgo(notif.createdAt)}</div>
      </div>
      ${!notif.read ? '<div class="notif-unread-dot"></div>' : ''}
    </div>
  `;
}
