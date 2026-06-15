/**
 * Messaging Service — FCM Push Notifications
 * Handles permission, token management, foreground messages
 */
import { firebaseConfig, FIREBASE_CDN, FCM_VAPID_KEY } from '../config.js';
import { setState, getState } from '../state.js';
import { post } from '../api.js';

let messaging = null;
let messagingModule = null;

/**
 * Initialize Firebase Messaging and register listeners
 */
export async function initMessaging() {
  try {
    const firebaseApp = (await import('../auth.js')).getFirebaseApp?.();
    if (!firebaseApp) return;

    messagingModule = await import(`${FIREBASE_CDN}/firebase-messaging.js`);
    messaging = messagingModule.getMessaging(firebaseApp);

    // Foreground message handler
    messagingModule.onMessage(messaging, (payload) => {
      handleForegroundMessage(payload);
    });

    // Register token refresh
    messagingModule.onTokenRefresh(messaging, async () => {
      const token = await messagingModule.getToken(messaging, { vapidKey: FCM_VAPID_KEY });
      await sendTokenToServer(token);
    });

    console.log('FCM Messaging initialized');
  } catch (err) {
    console.warn('FCM init skipped:', err.message);
  }
}

/**
 * Request notification permission and get FCM token
 * @returns {Promise<string|null>} FCM token or null
 */
export async function requestNotificationPermission() {
  if (!messaging) {
    console.warn('Messaging not initialized');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      setState('notificationPermission', 'denied');
      return null;
    }

    setState('notificationPermission', 'granted');

    const token = await messagingModule.getToken(messaging, {
      vapidKey: FCM_VAPID_KEY,
    });

    if (token) {
      await sendTokenToServer(token);
      setState('fcmToken', token);
    }

    return token;
  } catch (err) {
    console.error('FCM permission error:', err);
    return null;
  }
}

/**
 * Get current FCM token (without requesting permission)
 */
export async function getCurrentToken() {
  if (!messaging) return null;
  try {
    return await messagingModule.getToken(messaging, { vapidKey: FCM_VAPID_KEY });
  } catch {
    return null;
  }
}

/**
 * Send FCM token to backend for topic subscription
 */
async function sendTokenToServer(token) {
  try {
    await post('/notifications/register', { token, platform: 'web' });
  } catch (err) {
    console.warn('Failed to register FCM token:', err.message);
  }
}

/**
 * Remove FCM token from backend (on logout)
 */
export async function removeToken() {
  if (!messaging) return;
  try {
    const token = await getCurrentToken();
    if (token) {
      await messagingModule.deleteToken(messaging);
      await post('/notifications/unregister', { token }).catch(() => {});
    }
  } catch (err) {
    console.warn('Failed to remove FCM token:', err.message);
  }
}

/**
 * Handle foreground push messages
 */
function handleForegroundMessage(payload) {
  const { title, body, icon } = payload.notification || {};
  const data = payload.data || {};

  // Add to notification service
  import('./notificationService.js').then(ns => {
    ns.addNotification({
      type: data.type || 'system',
      title: title || 'NCE Notification',
      body: body || '',
      data,
    });
  });

  // Show in-app toast
  import('../components/toast.js').then(t => {
    t.showToast(body || title || 'New notification', 'info');
  });
}

/**
 * Subscribe to a topic (server-side via API)
 */
export async function subscribeToTopic(topic) {
  const token = await getCurrentToken();
  if (!token) return;
  try {
    await post('/notifications/subscribe', { token, topic });
  } catch (err) {
    console.warn('Topic subscribe failed:', err.message);
  }
}

/**
 * Unsubscribe from a topic
 */
export async function unsubscribeFromTopic(topic) {
  const token = await getCurrentToken();
  if (!token) return;
  try {
    await post('/notifications/unsubscribe', { token, topic });
  } catch (err) {
    console.warn('Topic unsubscribe failed:', err.message);
  }
}

/**
 * Check if notifications are supported and permission state
 */
export function getNotificationStatus() {
  if (!('Notification' in window)) return 'unsupported';
  if (!('serviceWorker' in navigator)) return 'no-sw';
  return Notification.permission; // 'granted', 'denied', 'default'
}
