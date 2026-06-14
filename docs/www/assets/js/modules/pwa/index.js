// NCE PWA Module
// Service Worker registration and PWA lifecycle

console.log('[NCE PWA] Initialized');

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js');
      console.log('[NCE PWA] Service Worker registered:', reg.scope);
    } catch (err) {
      console.log('[NCE PWA] Service Worker registration failed:', err);
    }
  });
}

// Install prompt
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log('[NCE PWA] Install prompt captured');
});

// Check if running as installed PWA
if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
  console.log('[NCE PWA] Running as installed app');
  document.body.classList.add('pwa-mode');
}
