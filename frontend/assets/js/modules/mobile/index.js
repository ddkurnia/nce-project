// NCE Mobile Module
// Handles mobile-specific interactions and optimizations

console.log('[NCE Mobile] Initialized');

// Prevent double-tap zoom on iOS
document.addEventListener('dblclick', function(e) {
  e.preventDefault();
}, { passive: false });

// Smooth scroll behavior for all scrollable elements
document.querySelectorAll('.tab-content').forEach(el => {
  el.style.scrollBehavior = 'smooth';
});

// Haptic feedback simulation (if supported)
if (navigator.vibrate) {
  document.querySelectorAll('button, .card, .menu-item, .prop-card, .commodity-item').forEach(el => {
    el.addEventListener('touchstart', () => {
      navigator.vibrate(5);
    }, { passive: true });
  });
}

// Viewport height fix for mobile browsers
function setVH() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

setVH();
window.addEventListener('resize', setVH);
window.addEventListener('orientationchange', () => setTimeout(setVH, 100));
