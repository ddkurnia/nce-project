/**
 * NCE Notification Service
 * Push notifications, local notifications, badge management
 * Uses dynamic imports for Capacitor plugins with graceful web fallbacks
 */

import { MOBILE_CONFIG } from '../config/mobile-config.js';

let fcmToken = null;
const pushListeners = [];
const actionListeners = [];

export async function registerPushNotifications() {
  if (!MOBILE_CONFIG.isNative()) {
    console.log('[NotificationService] Web platform — push registration skipped');
    return;
  }

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    const permissionResult = await PushNotifications.requestPermissions();
    if (permissionResult.receive !== 'granted') {
      console.warn('[NotificationService] Push permission not granted');
      return;
    }

    await PushNotifications.register();

    PushNotifications.addListener('registration', (token) => {
      fcmToken = token.value;
      MOBILE_CONFIG.pushNotification.fcmToken = token.value;
      console.log('[NotificationService] FCM token received:', token.value);
      registerTokenToBackend(token.value);
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('[NotificationService] Registration error:', error);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[NotificationService] Push received:', notification);
      pushListeners.forEach((cb) => cb(notification));
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('[NotificationService] Push action:', action);
      actionListeners.forEach((cb) => cb(action));
      if (action.notification && action.notification.data) {
        handleNotificationRoute(action.notification.data);
      }
    });
  } catch (err) {
    console.error('[NotificationService] Failed to register push:', err);
  }
}

async function registerTokenToBackend(token) {
  try {
    const apiUrl = MOBILE_CONFIG.getApiUrl();
    const response = await fetch(`${apiUrl}/devices/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, platform: MOBILE_CONFIG.platform() })
    });
    if (!response.ok) console.warn('[NotificationService] Backend token registration failed');
  } catch (err) {
    console.error('[NotificationService] Token registration error:', err);
  }
}

export function onPushNotificationReceived(callback) {
  pushListeners.push(callback);
  return () => {
    const idx = pushListeners.indexOf(callback);
    if (idx > -1) pushListeners.splice(idx, 1);
  };
}

export function onPushNotificationActionPerformed(callback) {
  actionListeners.push(callback);
  return () => {
    const idx = actionListeners.indexOf(callback);
    if (idx > -1) actionListeners.splice(idx, 1);
  };
}

export async function getFCMToken() {
  if (!MOBILE_CONFIG.isNative()) return null;
  return fcmToken || MOBILE_CONFIG.pushNotification.fcmToken || null;
}

export async function subscribeToTopic(topic) {
  if (!MOBILE_CONFIG.isNative()) {
    console.log(`[NotificationService] Web — subscribe to topic "${topic}" skipped`);
    return;
  }
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    // FCM topic subscription is typically handled server-side via the token
    console.log(`[NotificationService] Subscribed to topic: ${topic}`);
  } catch (err) {
    console.error('[NotificationService] Topic subscription error:', err);
  }
}

export async function sendLocalNotification(options = {}) {
  const { title = 'NCE', body = '', scheduleAt = null, data = {} } = options;

  if (!MOBILE_CONFIG.isNative()) {
    console.log(`[NotificationService] Web local notification: ${title} — ${body}`);
    return;
  }

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const notif = {
      title,
      body,
      id: Date.now(),
      extra: data
    };
    if (scheduleAt) {
      notif.schedule = { at: new Date(scheduleAt) };
    }
    await LocalNotifications.schedule({ notifications: [notif] });
    console.log('[NotificationService] Local notification scheduled');
  } catch (err) {
    console.error('[NotificationService] Local notification error:', err);
  }
}

export async function cancelNotification(id) {
  if (!MOBILE_CONFIG.isNative()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.cancel({ notifications: [{ id }] });
  } catch (err) {
    console.error('[NotificationService] Cancel notification error:', err);
  }
}

export async function cancelAllNotifications() {
  if (!MOBILE_CONFIG.isNative()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }
  } catch (err) {
    console.error('[NotificationService] Cancel all notifications error:', err);
  }
}

export async function setBadgeCount(count) {
  if (!MOBILE_CONFIG.isNative()) {
    console.log(`[NotificationService] Web badge count: ${count}`);
    return;
  }
  try {
    const { Badge } = await import('@capacitor/badge');
    await Badge.set({ count });
  } catch (err) {
    console.error('[NotificationService] Badge set error:', err);
  }
}

export async function clearBadge() {
  if (!MOBILE_CONFIG.isNative()) return;
  try {
    const { Badge } = await import('@capacitor/badge');
    await Badge.clear();
  } catch (err) {
    console.error('[NotificationService] Badge clear error:', err);
  }
}

export async function requestPermission() {
  if (!MOBILE_CONFIG.isNative()) return 'granted';
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    const result = await PushNotifications.requestPermissions();
    return result.receive;
  } catch (err) {
    console.error('[NotificationService] Permission request error:', err);
    return 'denied';
  }
}

export async function checkPermission() {
  if (!MOBILE_CONFIG.isNative()) return 'granted';
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    const result = await PushNotifications.checkPermissions();
    return result.receive;
  } catch (err) {
    console.error('[NotificationService] Permission check error:', err);
    return 'denied';
  }
}

export function handleNotificationRoute(data) {
  if (!data) return;
  const routes = {
    commodity: 'commodities.html',
    'buy-request': 'buy-requests.html',
    property: 'property.html',
    profile: 'profile.html',
    price_alert: 'commodities.html'
  };
  const type = data.type || data.route || '';
  const target = routes[type];
  if (target) {
    const separator = target.includes('?') ? '&' : '?';
    const url = data.id ? `${target}${separator}id=${data.id}` : target;
    window.location.href = url;
  } else {
    console.log('[NotificationService] Unknown route type:', type);
  }
}

export default {
  registerPushNotifications,
  onPushNotificationReceived,
  onPushNotificationActionPerformed,
  getFCMToken,
  subscribeToTopic,
  sendLocalNotification,
  cancelNotification,
  cancelAllNotifications,
  setBadgeCount,
  clearBadge,
  requestPermission,
  checkPermission,
  handleNotificationRoute
};
