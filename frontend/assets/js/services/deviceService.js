/**
 * NCE Device Service
 * Device info, network, haptics, camera, filesystem, status bar, splash, back button
 * Uses dynamic imports for Capacitor plugins with graceful web fallbacks
 */

import { MOBILE_CONFIG } from '../config/mobile-config.js';

export async function getDeviceInfo() {
  if (!MOBILE_CONFIG.isNative()) {
    return {
      platform: 'web',
      model: navigator.userAgent,
      osVersion: navigator.platform,
      appVersion: MOBILE_CONFIG.appVersion,
      deviceId: 'web-' + Math.random().toString(36).substring(2, 10)
    };
  }
  try {
    const { Device } = await import('@capacitor/device');
    const info = await Device.getInfo();
    return {
      platform: info.platform,
      model: info.model || 'Unknown',
      osVersion: info.osVersion || 'Unknown',
      appVersion: MOBILE_CONFIG.appVersion,
      deviceId: info.identifier || 'unknown'
    };
  } catch (err) {
    console.error('[DeviceService] getDeviceInfo error:', err);
    return { platform: 'unknown', model: 'unknown', osVersion: 'unknown', appVersion: MOBILE_CONFIG.appVersion, deviceId: 'unknown' };
  }
}

let networkStatus = { connected: true, connectionType: 'wifi' };

export async function getNetworkStatus() {
  if (!MOBILE_CONFIG.isNative()) {
    networkStatus = { connected: navigator.onLine, connectionType: navigator.onLine ? 'wifi' : 'none' };
    return networkStatus;
  }
  try {
    const { Network } = await import('@capacitor/network');
    const status = await Network.getStatus();
    networkStatus = { connected: status.connected, connectionType: status.connectionType };
    return networkStatus;
  } catch (err) {
    console.error('[DeviceService] getNetworkStatus error:', err);
    return networkStatus;
  }
}

export async function onNetworkChange(callback) {
  if (!MOBILE_CONFIG.isNative()) {
    const online = () => callback({ connected: true, connectionType: 'wifi' });
    const offline = () => callback({ connected: false, connectionType: 'none' });
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }
  try {
    const { Network } = await import('@capacitor/network');
    Network.addListener('networkStatusChange', (status) => {
      networkStatus = { connected: status.connected, connectionType: status.connectionType };
      callback(networkStatus);
    });
    return () => Network.removeAllListeners();
  } catch (err) {
    console.error('[DeviceService] onNetworkChange error:', err);
    return () => {};
  }
}

export function isOnline() {
  if (MOBILE_CONFIG.isNative()) return networkStatus.connected;
  return navigator.onLine;
}

export async function vibrate(duration = 100) {
  if (!MOBILE_CONFIG.isNative()) {
    if (navigator.vibrate) navigator.vibrate(duration);
    return;
  }
  try {
    const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics');
    if (duration >= 300) {
      await Haptics.notification({ type: NotificationType.Warning });
    } else if (duration >= 150) {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } else if (duration >= 50) {
      await Haptics.impact({ style: ImpactStyle.Light });
    } else {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    }
  } catch (err) {
    console.error('[DeviceService] vibrate error:', err);
  }
}

export async function takePhoto(options = {}) {
  const { quality = 80, allowEditing = false, resultType = 'uri' } = options;
  if (!MOBILE_CONFIG.isNative()) {
    console.log('[DeviceService] Camera not available on web');
    return null;
  }
  try {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
    const photo = await Camera.getPhoto({
      quality,
      allowEditing,
      resultType: resultType === 'base64' ? CameraResultType.Base64 : CameraResultType.Uri,
      source: CameraSource.Camera
    });
    return photo;
  } catch (err) {
    console.error('[DeviceService] takePhoto error:', err);
    return null;
  }
}

export async function pickImage(options = {}) {
  const { quality = 80, allowEditing = false, resultType = 'uri' } = options;
  if (!MOBILE_CONFIG.isNative()) {
    console.log('[DeviceService] Image picker not available on web');
    return null;
  }
  try {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
    const photo = await Camera.getPhoto({
      quality,
      allowEditing,
      resultType: resultType === 'base64' ? CameraResultType.Base64 : CameraResultType.Uri,
      source: CameraSource.Photos
    });
    return photo;
  } catch (err) {
    console.error('[DeviceService] pickImage error:', err);
    return null;
  }
}

export async function saveFile(options = {}) {
  const { path, data, directory = 'Data', encoding = 'utf8' } = options;
  if (!MOBILE_CONFIG.isNative()) {
    console.log('[DeviceService] Filesystem not available on web');
    return null;
  }
  try {
    const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
    const dirMap = { Data: Directory.Data, Documents: Directory.Documents, External: Directory.External };
    const result = await Filesystem.writeFile({
      path,
      data,
      directory: dirMap[directory] || Directory.Data,
      encoding: encoding === 'base64' ? Encoding.Base64 : Encoding.UTF8
    });
    return result;
  } catch (err) {
    console.error('[DeviceService] saveFile error:', err);
    return null;
  }
}

export async function readFile(options = {}) {
  const { path, directory = 'Data', encoding = 'utf8' } = options;
  if (!MOBILE_CONFIG.isNative()) return null;
  try {
    const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
    const dirMap = { Data: Directory.Data, Documents: Directory.Documents, External: Directory.External };
    const result = await Filesystem.readFile({
      path,
      directory: dirMap[directory] || Directory.Data,
      encoding: encoding === 'base64' ? Encoding.Base64 : Encoding.UTF8
    });
    return result;
  } catch (err) {
    console.error('[DeviceService] readFile error:', err);
    return null;
  }
}

export async function setStatusBarStyle(style = 'dark') {
  if (!MOBILE_CONFIG.isNative()) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    if (style === 'light') {
      await StatusBar.setStyle({ style: Style.Light });
    } else {
      await StatusBar.setStyle({ style: Style.Dark });
    }
    await StatusBar.setBackgroundColor({ color: MOBILE_CONFIG.theme.background });
  } catch (err) {
    console.error('[DeviceService] setStatusBarStyle error:', err);
  }
}

export async function hideSplashScreen() {
  if (!MOBILE_CONFIG.isNative()) return;
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide({ fadeOutDuration: 300 });
  } catch (err) {
    console.error('[DeviceService] hideSplashScreen error:', err);
  }
}

export async function exitApp() {
  if (!MOBILE_CONFIG.isNative()) {
    console.log('[DeviceService] exitApp not available on web');
    return;
  }
  try {
    const { App } = await import('@capacitor/app');
    App.exitApp();
  } catch (err) {
    console.error('[DeviceService] exitApp error:', err);
  }
}

export async function onBackButton(callback) {
  if (!MOBILE_CONFIG.isNative()) return () => {};
  try {
    const { App } = await import('@capacitor/app');
    const handler = await App.addListener('backButton', callback);
    return () => handler.remove();
  } catch (err) {
    console.error('[DeviceService] onBackButton error:', err);
    return () => {};
  }
}

export async function onAppResume(callback) {
  if (!MOBILE_CONFIG.isNative()) return () => {};
  try {
    const { App } = await import('@capacitor/app');
    const handler = await App.addListener('appStateChange', (state) => {
      if (state.isActive) callback();
    });
    return () => handler.remove();
  } catch (err) {
    console.error('[DeviceService] onAppResume error:', err);
    return () => {};
  }
}

export async function getSafeAreaInsets() {
  if (!MOBILE_CONFIG.isNative()) return { top: 0, bottom: 0, left: 0, right: 0 };
  try {
    const { SafeArea } = await import('capacitor-plugin-safe-area');
    const result = await SafeArea.getSafeAreaInsets();
    const insets = result.insets || result;
    MOBILE_CONFIG.updateSafeArea(insets);
    return insets;
  } catch (err) {
    const computed = {
      top: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-top')) || 0,
      bottom: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-bottom')) || 0,
      left: 0,
      right: 0
    };
    return computed;
  }
}

export function isNative() {
  return MOBILE_CONFIG.isNative();
}

export default {
  getDeviceInfo,
  getNetworkStatus,
  onNetworkChange,
  isOnline,
  vibrate,
  takePhoto,
  pickImage,
  saveFile,
  readFile,
  setStatusBarStyle,
  hideSplashScreen,
  exitApp,
  onBackButton,
  onAppResume,
  getSafeAreaInsets,
  isNative
};
