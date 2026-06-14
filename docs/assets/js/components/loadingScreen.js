/**
 * NCE Loading Screen Component
 * Full-screen loading, page transitions, skeleton loaders with shimmer effect
 */

import { MOBILE_CONFIG } from '../config/mobile-config.js';

function injectStyles() {
  if (document.getElementById('nce-loading-styles')) return;
  const style = document.createElement('style');
  style.id = 'nce-loading-styles';
  style.textContent = `
    @keyframes nce-pulse { 0%,100%{ transform:scale(1);opacity:1; } 50%{ transform:scale(1.08);opacity:0.85; } }
    @keyframes nce-dots { 0%,80%,100%{ opacity:0.3;transform:scale(0.8); } 40%{ opacity:1;transform:scale(1); } }
    @keyframes nce-shimmer { 0%{ background-position:-400px 0; } 100%{ background-position:400px 0; } }
    @keyframes nce-fade-in { from{ opacity:0; } to{ opacity:1; } }
    @keyframes nce-fade-out { from{ opacity:1; } to{ opacity:0; } }

    .nce-loading-screen {
      position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;
      align-items:center;justify-content:center;background:#0a0e27;
      animation:nce-fade-in 0.3s ease;
    }
    .nce-loading-screen.hiding { animation:nce-fade-out 0.3s ease forwards; }
    .nce-loading-screen__logo {
      font-size:32px;font-weight:800;color:#10b981;letter-spacing:2px;
      animation:nce-pulse 1.8s ease-in-out infinite;margin-bottom:24px;
    }
    .nce-loading-screen__logo span { color:#06b6d4; }
    .nce-loading-screen__message { color:#94a3b8;font-size:14px;margin-bottom:20px; }
    .nce-loading-screen__dots { display:flex;gap:8px; }
    .nce-loading-screen__dot {
      width:8px;height:8px;border-radius:50%;background:#10b981;
      animation:nce-dots 1.4s ease-in-out infinite;
    }
    .nce-loading-screen__dot:nth-child(2) { animation-delay:0.2s; }
    .nce-loading-screen__dot:nth-child(3) { animation-delay:0.4s; }

    .nce-page-transition {
      position:fixed;inset:0;z-index:9998;background:#0a0e27;
      animation:nce-fade-in 0.15s ease, nce-fade-out 0.15s ease 0.15s forwards;
      pointer-events:none;
    }

    .nce-skeleton {
      background:linear-gradient(90deg,#1e293b 25%,#334155 37%,#1e293b 63%);
      background-size:800px 100%;animation:nce-shimmer 1.5s linear infinite;border-radius:8px;
    }
    .nce-skeleton--circle { border-radius:50%; }
    .nce-skeleton--card { height:180px;width:100%;border-radius:12px;margin-bottom:12px; }
    .nce-skeleton--list-item { height:64px;width:100%;border-radius:8px;margin-bottom:8px; }
    .nce-skeleton--table-row { height:44px;width:100%;border-radius:6px;margin-bottom:4px; }
    .nce-skeleton--text { height:14px;border-radius:4px;margin-bottom:8px; }
    .nce-skeleton--title { height:20px;width:60%;border-radius:4px;margin-bottom:12px; }
    .nce-skeleton--avatar { width:56px;height:56px;border-radius:50%; }
    .nce-skeleton-container { padding:16px; }
    .nce-skeleton-card-wrap { background:#111827;border-radius:12px;padding:16px;margin-bottom:12px; }
  `;
  document.head.appendChild(style);
}

export function showLoadingScreen(message = 'Memuat...') {
  if (!MOBILE_CONFIG.isNative() && window.innerWidth >= 1024) return;

  injectStyles();
  hideLoadingScreen();

  const screen = document.createElement('div');
  screen.id = 'nce-loading-screen';
  screen.className = 'nce-loading-screen';

  screen.innerHTML = `
    <div class="nce-loading-screen__logo">NC<span>E</span></div>
    <div class="nce-loading-screen__message">${message}</div>
    <div class="nce-loading-screen__dots">
      <div class="nce-loading-screen__dot"></div>
      <div class="nce-loading-screen__dot"></div>
      <div class="nce-loading-screen__dot"></div>
    </div>
  `;

  document.body.appendChild(screen);
  document.body.style.overflow = 'hidden';
}

export function hideLoadingScreen() {
  const screen = document.getElementById('nce-loading-screen');
  if (!screen) return;
  screen.classList.add('hiding');
  document.body.style.overflow = '';
  setTimeout(() => { screen.remove(); }, 300);
}

export function showPageTransition() {
  injectStyles();
  const transition = document.createElement('div');
  transition.className = 'nce-page-transition';
  document.body.appendChild(transition);
  setTimeout(() => { transition.remove(); }, 350);
}

function generateSkeletonHTML(type) {
  switch (type) {
    case 'card':
      return `
        <div class="nce-skeleton-card-wrap">
          <div class="nce-skeleton nce-skeleton--title"></div>
          <div class="nce-skeleton nce-skeleton--text" style="width:90%"></div>
          <div class="nce-skeleton nce-skeleton--text" style="width:70%"></div>
          <div class="nce-skeleton nce-skeleton--card" style="height:100px;margin-top:12px"></div>
        </div>`.repeat(3);

    case 'list':
      return `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
          <div class="nce-skeleton nce-skeleton--circle" style="width:40px;height:40px;flex-shrink:0"></div>
          <div style="flex:1">
            <div class="nce-skeleton nce-skeleton--text" style="width:75%"></div>
            <div class="nce-skeleton nce-skeleton--text" style="width:50%"></div>
          </div>
        </div>`.repeat(6);

    case 'table':
      return `
        <div class="nce-skeleton nce-skeleton--title" style="margin-bottom:16px"></div>
        <div class="nce-skeleton nce-skeleton--table-row"></div>
        <div class="nce-skeleton nce-skeleton--table-row"></div>
        <div class="nce-skeleton nce-skeleton--table-row"></div>
        <div class="nce-skeleton nce-skeleton--table-row"></div>
        <div class="nce-skeleton nce-skeleton--table-row"></div>
        <div class="nce-skeleton nce-skeleton--table-row"></div>
        <div class="nce-skeleton nce-skeleton--table-row"></div>`;

    case 'profile':
      return `
        <div style="text-align:center;margin-bottom:24px">
          <div class="nce-skeleton nce-skeleton--avatar" style="margin:0 auto 12px"></div>
          <div class="nce-skeleton nce-skeleton--title" style="margin:0 auto 8px"></div>
          <div class="nce-skeleton nce-skeleton--text" style="width:40%;margin:0 auto"></div>
        </div>
        <div class="nce-skeleton nce-skeleton--text" style="width:100%"></div>
        <div class="nce-skeleton nce-skeleton--text" style="width:85%"></div>
        <div class="nce-skeleton nce-skeleton--text" style="width:60%"></div>
        <div style="margin-top:20px">
          <div class="nce-skeleton nce-skeleton--card" style="height:48px"></div>
          <div class="nce-skeleton nce-skeleton--card" style="height:48px;margin-top:8px"></div>
          <div class="nce-skeleton nce-skeleton--card" style="height:48px;margin-top:8px"></div>
        </div>`;

    default:
      return `<div class="nce-skeleton nce-skeleton--text"></div>`;
  }
}

export function showSkeletonLoader(containerSelector, type = 'card') {
  injectStyles();

  const container = document.querySelector(containerSelector);
  if (!container) return;

  const skeleton = document.createElement('div');
  skeleton.className = 'nce-skeleton-container';
  skeleton.setAttribute('data-skeleton-loader', 'true');

  skeleton.innerHTML = generateSkeletonHTML(type);
  container.appendChild(skeleton);

  return skeleton;
}

export function hideSkeletonLoader(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  const skeleton = container.querySelector('[data-skeleton-loader]');
  if (skeleton) skeleton.remove();
}

export default {
  showLoadingScreen,
  hideLoadingScreen,
  showPageTransition,
  showSkeletonLoader,
  hideSkeletonLoader
};
