/**
 * Notification Service — Real-time notifications with Firestore + FCM
 * Falls back to mock data when offline or unauthenticated
 */
import { setState, getState, subscribe } from '../state.js';
import { isAuthenticated, getStoredUser } from '../auth.js';
import { get } from '../api.js';
import { FIREBASE_CDN } from '../config.js';

const NOTIF_TYPES = {
  offer: { icon: '💰', color: 'var(--gold)' },
  match: { icon: '🤝', color: 'var(--info)' },
  price: { icon: '📈', color: 'var(--success)' },
  system: { icon: '🔔', color: 'var(--text-secondary)' },
  alert: { icon: '⚠️', color: 'var(--warning)' },
};

let notifications = [];
let unsubscribeFirestore = null;
let pollInterval = null;

/**
 * Initialize notifications — try real data, fallback to mock
 */
export async function initNotifications() {
  if (isAuthenticated()) {
    try {
      await loadFromAPI();
      startPolling();
      listenFirestore();
    } catch {
      notifications = generateMockNotifications();
    }
  } else {
    notifications = generateMockNotifications();
  }
  updateState();
}

/**
 * Load notifications from REST API
 */
async function loadFromAPI() {
  try {
    const res = await get('/notifications?limit=50');
    notifications = (res.data || res || []).map(normalizeNotif);
  } catch {
    // Keep existing notifications
  }
}

/**
 * Listen to Firestore notifications collection for real-time updates
 */
async function listenFirestore() {
  try {
    const app = (await import('../auth.js')).getFirebaseApp?.();
    if (!app) return;

    const firestoreMod = await import(`${FIREBASE_CDN}/firebase-firestore.js`);
    const db = firestoreMod.getFirestore(app);
    const user = getStoredUser();
    if (!user?.uid) return;

    const q = firestoreMod.query(
      firestoreMod.collection(db, 'notifications'),
      firestoreMod.where('userId', '==', user.uid),
      firestoreMod.orderBy('createdAt', 'desc'),
      firestoreMod.limit(30)
    );

    unsubscribeFirestore = firestoreMod.onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const notif = normalizeNotif({ id: change.doc.id, ...change.doc.data() });
          // Avoid duplicates
          if (!notifications.find(n => n.id === notif.id)) {
            notifications.unshift(notif);
          }
        }
        if (change.type === 'modified') {
          const idx = notifications.findIndex(n => n.id === change.doc.id);
          if (idx > -1) notifications[idx] = normalizeNotif({ id: change.doc.id, ...change.doc.data() });
        }
        if (change.type === 'removed') {
          notifications = notifications.filter(n => n.id !== change.doc.id);
        }
      });
      updateState();
    }, (err) => {
      console.warn('Firestore notification listener error:', err.message);
    });
  } catch (err) {
    console.warn('Firestore notifications not available:', err.message);
  }
}

/**
 * Start polling for notifications (fallback for real-time)
 */
function startPolling() {
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = setInterval(loadFromAPI, 30000); // Every 30 seconds
}

/**
 * Stop all real-time listeners
 */
export function stopNotifications() {
  if (unsubscribeFirestore) {
    unsubscribeFirestore();
    unsubscribeFirestore = null;
  }
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

function updateState() {
  const unread = notifications.filter(n => !n.read).length;
  setState('notifications', notifications);
  setState('unreadCount', unread);
}

function normalizeNotif(raw) {
  return {
    id: raw.id || `n${Date.now()}`,
    type: raw.type || 'system',
    title: raw.title || '',
    body: raw.body || '',
    read: !!raw.read,
    createdAt: raw.createdAt || new Date().toISOString(),
    data: raw.data || {},
  };
}

export function getNotifications() {
  return [...notifications];
}

export function getUnreadCount() {
  return notifications.filter(n => !n.read).length;
}

export async function markAsRead(id) {
  const notif = notifications.find(n => n.id === id);
  if (notif) {
    notif.read = true;
    updateState();
    try {
      const { put } = await import('../api.js');
      await put(`/notifications/${id}/read`);
    } catch { /* offline */ }
  }
}

export async function markAllRead() {
  notifications.forEach(n => { n.read = true; });
  updateState();
  try {
    const { put } = await import('../api.js');
    await put('/notifications/read-all');
  } catch { /* offline */ }
}

export function addNotification(notif) {
  const normalized = normalizeNotif(notif);
  if (notifications.find(n => n.id === normalized.id)) return;
  notifications.unshift(normalized);
  updateState();
}

export function getNotifTypeInfo(type) {
  return NOTIF_TYPES[type] || NOTIF_TYPES.system;
}

export function getNotifIcon(type) {
  return (NOTIF_TYPES[type] || NOTIF_TYPES.system).icon;
}

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
