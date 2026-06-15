// Notification service — manages notification state and data
import { setState, getState, subscribe } from './state.js';
import { getRandomInt } from './helpers.js';

const NOTIFICATION_TYPES = {
  offer: { icon: '💰', color: 'var(--gold)' },
  match: { icon: '🤝', color: 'var(--info)' },
  price: { icon: '📈', color: 'var(--success)' },
  system: { icon: '🔔', color: 'var(--text-secondary)' },
  alert: { icon: '⚠️', color: 'var(--warning)' },
};

function generateMockNotifications() {
  return [
    { id: 'n1', type: 'offer', title: 'Penawaran Baru', body: 'PT Sawit Jaya mengajukan penawaran untuk RFQ Sawit Anda', read: false, createdAt: new Date(Date.now() - 300000).toISOString() },
    { id: 'n2', type: 'match', title: 'Business Match', body: '3 supplier baru cocok dengan kebutuhan Kopi Anda', read: false, createdAt: new Date(Date.now() - 1800000).toISOString() },
    { id: 'n3', type: 'price', title: 'Harga Sawit Naik', body: 'Sawit CPO naik 3.2% dalam 1 jam terakhir', read: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 'n4', type: 'system', title: 'Verifikasi Berhasil', body: 'Akun Anda telah diverifikasi. Selamat trading!', read: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: 'n5', type: 'alert', title: 'RFQ Expired', body: 'RFQ Kakao #req-3 akan berakhir dalam 24 jam', read: true, createdAt: new Date(Date.now() - 172800000).toISOString() },
    { id: 'n6', type: 'offer', title: 'Penawaran Diterima', body: 'Penawaran Anda untuk RFQ Karet telah diterima oleh pembeli', read: true, createdAt: new Date(Date.now() - 259200000).toISOString() },
  ];
}

let notifications = [];

export function initNotifications() {
  notifications = generateMockNotifications();
  updateState();
}

function updateState() {
  const unread = notifications.filter(n => !n.read).length;
  setState('notifications', notifications);
  setState('unreadCount', unread);
}

export function getNotifications() {
  return [...notifications];
}

export function getUnreadCount() {
  return notifications.filter(n => !n.read).length;
}

export function markAsRead(id) {
  const notif = notifications.find(n => n.id === id);
  if (notif) {
    notif.read = true;
    updateState();
  }
}

export function markAllRead() {
  notifications.forEach(n => { n.read = true; });
  updateState();
}

export function addNotification(notif) {
  notifications.unshift({
    id: `n${Date.now()}`,
    read: false,
    createdAt: new Date().toISOString(),
    ...notif,
  });
  updateState();
}

export function getNotifTypeInfo(type) {
  return NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.system;
}

export function getNotifIcon(type) {
  return (NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.system).icon;
}
