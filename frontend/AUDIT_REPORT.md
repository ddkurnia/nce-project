# NCE Audit Report — Phase 1

**Project**: Nusantara Commodity Exchange (NCE)  
**Date**: 2026-06-15  
**Auditor**: Super Z  
**Scope**: Full frontend source code (`/frontend/` and `/docs/`)

---

## Executive Summary

The NCE frontend currently exists as **two divergent codebases**:

1. **`/frontend/`** — Multi-page architecture (6 separate HTML files, each with full page reload). Uses Tailwind CDN, inline styles/scripts, and ES module imports with Firebase SDK. This is the older "Digital Marketplace" version.

2. **`/docs/`** — Single-page application (SPA) with hash-based router, modular CSS, view components, and simulated market data. This is the newer "Digital Trading Floor" prototype (deployed to GitHub Pages).

**Neither codebase is production-ready for the "Digital Trading Floor" vision.** The multi-page version is bloated with duplicated code; the SPA version is a shallow prototype with hardcoded data and no Firebase integration. Both need to be unified into a single, clean, trading-floor-grade SPA.

---

## 1. Files Terlalu Besar (>300 lines)

| File | Lines | Severity | Recommendation |
|------|-------|----------|----------------|
| `assets/css/main.css` | 2,898 | 🔴 Critical | Split into `variables.css`, `base.css`, `components.css`, `views.css`, `utilities.css` |
| `index.html` | 1,541 | 🔴 Critical | Extract inline CSS (413 lines) and inline JS (306 lines) into separate files |
| `assets/js/components/modal.js` | 1,270 | 🔴 Critical | Split into `modalCore.js` (render/show/close), `authModal.js`, `commodityModal.js`, `offerModal.js` |
| `assets/js/components/charts.js` | 818 | 🟡 High | Split into `sparkline.js`, `areaChart.js`, `barChart.js`, `donutChart.js` |
| `assets/js/components/cards.js` | 739 | 🟡 High | Split into `commodityCard.js`, `requestCard.js`, `propertyCard.js`, `statCard.js`, `offerCard.js` |
| `commodities.html` | 659 | 🟡 High | Full-page HTML with inline everything — convert to SPA view module |
| `assets/js/components/navbar.js` | 624 | 🟡 High | Split into `navbarDesktop.js`, `navbarMobile.js`, `userDropdown.js` |
| `assets/js/modules/profile/index.js` | 622 | 🟡 High | Split into `profileView.js`, `profileEdit.js`, `profileStats.js` |
| `assets/js/utils/helpers.js` | 605 | 🟠 Medium | Already well-structured, minor splits possible |
| `buy-requests.html` | 528 | 🟡 High | Convert to SPA view module |
| `assets/js/modules/property/index.js` | 485 | 🟡 High | Split into smaller sub-modules |
| `assets/js/components/sidebar.js` | 483 | 🟡 High | **Will be removed** — replaced by bottom nav in Digital Trading Floor |
| `assets/js/modules/commodities/index.js` | 456 | 🟡 High | Split into `marketBoardView.js`, `commodityDetail.js` |
| `dashboard.html` | 452 | 🟡 High | Convert to SPA view module |
| `assets/js/modules/buy-requests/index.js` | 452 | 🟡 High | Split into `rfqListView.js`, `rfqCreate.js` |
| `profile.html` | 432 | 🟡 High | Convert to SPA view module |
| `assets/js/modules/dashboard/index.js` | 431 | 🟡 High | Split into `homeView.js`, `marketOverview.js` |
| `assets/js/utils/formatter.js` | 428 | 🟠 Medium | Well-structured, acceptable |
| `property.html` | 422 | 🟡 High | Convert to SPA view module |
| `assets/js/services/httpService.js` | 422 | 🟠 Medium | Well-structured, acceptable |
| `assets/js/services/authService.js` | 420 | 🟠 Medium | Well-structured, acceptable |
| `assets/js/utils/validator.js` | 411 | 🟠 Medium | Well-structured, acceptable |
| `assets/js/services/requestService.js` | 314 | 🟢 OK | Just over limit, acceptable |

**Total files > 300 lines: 23**  
**Total files > 500 lines: 9**  
**Total files > 1000 lines: 3**

---

## 2. Duplicate Code

### 2.1 Format Functions Duplicated (cards.js vs formatter.js)

| Function | Location A | Location B | Lines Wasted |
|----------|-----------|-----------|-------------|
| `formatIDR()` | `cards.js` (line 13) | `formatter.js` as `formatCurrency()` | ~8 lines |
| `formatCompact()` | `cards.js` (line 24) | `formatter.js` as `formatCompactNumber()` | ~10 lines |
| `timeAgo()` | `cards.js` (line 37) | `formatter.js` as `formatRelativeTime()` | ~17 lines |
| `getStatusConfig()` | `cards.js` (line 61) | `helpers.js` as `getStatusColor()` | ~15 lines |

**Impact**: 4 duplicated utility functions, ~50 lines wasted. `cards.js` reimplements formatting logic that already exists in `utils/formatter.js`.

### 2.2 Avatar/Initials Logic Duplicated Across 4 Files

| Pattern | Files |
|---------|-------|
| `getInitials()` | `navbar.js`, `sidebar.js`, `mobileDrawer.js`, `cards.js` (inline) |
| `generateAvatarColor()` | `navbar.js`, `sidebar.js` (identical hash-based color generation) |

**Impact**: Same algorithm copied 4+ times. Any color palette change requires editing all files.

### 2.3 SVG Icons Duplicated Across Components

Each component file defines its own SVG icons inline:
- `navbar.js` → 10 SVG icons
- `sidebar.js` → 7 SVG icons (some identical to navbar)
- `mobileDrawer.js` → 9 SVG icons (some identical to navbar/sidebar)
- `bottomNav.js` → 5 SVG icons (some identical to above)
- `cards.js` → 9 SVG icons
- `modal.js` → 6 SVG icons
- `loadingScreen.js` → uses config

**Impact**: ~46 SVG definitions, many duplicated. A single `icons.js` module would reduce this by ~60%.

### 2.4 Tailwind Config Duplicated in Every HTML

Every HTML page (5 files) includes identical Tailwind CDN config:
```html
<script src="https://cdn.tailwindcss.com"></script>
<script>
tailwind.config = {
    theme: { extend: { colors: { navy: {...}, emerald: {...}, cyan: {...} } } }
}
</script>
```

**Impact**: 5x Tailwind CDN loads (300KB+ each), identical config repeated 5 times.

### 2.5 Google Fonts Import Duplicated

Inter font imported 6 different ways across files:
- 5 HTML files: `@import url('https://fonts.googleapis.com/css2?family=Inter...')`
- 1 HTML file: `<link href="https://fonts.googleapis.com/css2?family=Inter...">`
- `main.css`: Also imports Inter

**Impact**: Multiple font requests, some blocking CSS `@import` instead of `<link>`.

### 2.6 Two Completely Separate HTTP Service Implementations

| Feature | `frontend/` httpService.js | `docs/` api.js |
|---------|---------------------------|----------------|
| Lines | 422 | 128 |
| Error handling | Custom `NCEApiError` class | Simple `Error` |
| Interceptors | Request + Response | None |
| Auto-logout on 401 | Yes | No |
| FormData support | Yes | No |
| Token refresh | Cached + Firebase fallback | Simple localStorage read |

**Impact**: Two incompatible API layers. The SPA version is simpler but less robust.

### 2.7 Two Different Auth Implementations

| Feature | `frontend/` authService.js | `docs/` auth.js |
|---------|---------------------------|-----------------|
| Firebase Auth | Direct SDK import | Via API backend only |
| Token management | Firebase ID token + Backend JWT | Backend JWT only |
| Auth state observer | Firebase `onAuthStateChanged` | localStorage check |
| Lines | 420 | 128 |

**Impact**: The frontend/ version is more complete but Firebase SDK adds significant bundle size.

---

## 3. UI yang Tidak Reusable

### 3.1 Monolithic Components

Each "component" renders its own styles via `injectStyles()` injection:
- `cards.js` → 456 lines of CSS injected into `<head>`
- `charts.js` → ~200 lines of CSS injected
- `navbar.js` → ~320 lines of CSS injected
- `sidebar.js` → ~230 lines of CSS injected
- `modal.js` → ~400+ lines of CSS injected
- `bottomNav.js` → ~47 lines of CSS injected
- `loadingScreen.js` → ~58 lines of CSS injected
- `mobileDrawer.js` → ~15 lines of CSS injected

**Total inline CSS in JS: ~1,700+ lines** — should be in CSS files.

### 3.2 No Shared Design Token System

Colors are hardcoded as hex values throughout JS and CSS:
- Primary green: `#10B981`, `#10b981`, `#059669` (inconsistent casing)
- Background: `#0a0e27`, `#0A0E27`, `#111827`
- Cyan accent: `#06B6D4`, `#06b6d4`
- Text colors: `#E2E8F0`, `#CBD5E1`, `#94A3B8`, `#64748B`

**Impact**: No single source of truth for colors. New gold palette (#D4AF37) will require updating 100+ locations.

### 3.3 No Shared UI Primitives

Common UI patterns are re-implemented per component:
- Buttons (accept/reject, login/register, submit)
- Badges (status, type, verified)
- Avatars (initials + color hash)
- Loading states (spinners, skeletons)
- Cards (commodity, property, request, offer, stat)

**Impact**: Each component has its own button/badge/avatar CSS and HTML. A shared component library would reduce ~40% of component code.

---

## 4. Firebase Calls yang Tidak Melalui Service Layer

### 4.1 Direct Firebase SDK Import in `firebase.js`

```javascript
// firebase.js — directly initializes Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';
```

**Exports `db` and `storage` directly**, inviting direct Firestore/Storage access from any module.

### 4.2 authService.js Uses Firebase SDK Directly

```javascript
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { auth } from '../config/firebase.js';
```

This bypasses the backend API for authentication. While this works, it means:
- Client has Firebase credentials in source code
- Auth flow depends on Firebase SDK (2MB+ bundle)
- Backend JWT is secondary to Firebase Auth

### 4.3 No Firestore/Storage Calls Found Outside Services

Good news: No direct `db.collection()` or `storage.ref()` calls were found outside service files. All database access goes through `httpService.js` → Express backend.

**However**, the exported `db` and `storage` instances from `firebase.js` create a risk that future developers might use them directly.

---

## 5. Technical Debt

### 5.1 Two Divergent Codebases

| Aspect | `/frontend/` (Multi-page) | `/docs/` (SPA) |
|--------|--------------------------|----------------|
| Architecture | 6 separate HTML pages | 1 SPA with hash router |
| CSS | Tailwind CDN + inline + main.css | Modular CSS (variables/base/components/views) |
| State | Per-page globals | `state.js` (StateManager class) |
| Navigation | `<a href="page.html">` | Hash-based SPA router |
| Data | Firebase SDK + httpService | Simple `api.js` wrapper |
| Components | Large monolithic JS files | Smaller, focused modules |
| Auth | Firebase Auth + backend JWT | Backend-only JWT |
| Market data | Real API calls | Hardcoded in `config.js` |
| Size | ~2.4MB (84 files) | ~smaller (30 files) |

**This is the #1 technical debt** — two versions with incompatible patterns.

### 5.2 Dead Capacitor/TWA Code

| Directory | Files | Size | Status |
|-----------|-------|------|--------|
| `twa-project/` | 28 files | 356KB | 🔴 Dead — TWA approach abandoned |
| `android/` (Capacitor) | 56 files | 608KB | 🔴 Dead — replaced by native WebView APK |
| `capacitor.config.json` | 1 file | — | 🔴 Dead config |

**Total dead code: ~964KB, 85 files**

### 5.3 No Build System

- No bundler (Webpack, Vite, Rollup, esbuild)
- No tree-shaking — all code ships as-is
- No minification
- No code splitting
- CDN dependencies loaded at runtime (Tailwind CDN = 300KB+ per page)
- Firebase SDK loaded via CDN (2MB+)

### 5.4 No TypeScript

All JS files are plain JavaScript with JSDoc comments. No type safety, no compile-time checks.

### 5.5 No Testing Infrastructure

- No test framework configured
- No unit tests
- No integration tests
- No E2E tests

---

## 6. Performance Issues

### 6.1 Tailwind CDN in Production

Every HTML page loads `https://cdn.tailwindcss.com` — this is the **development-only** version:
- **~300KB+** per page load (not cached between pages in multi-page app)
- Includes JIT compiler running in browser
- Not minified or tree-shaken
- Should use pre-built CSS for production

### 6.2 Massive HTML Files with Inline Everything

| File | Size | Problem |
|------|------|---------|
| `index.html` | 75KB | 413 lines inline CSS + 306 lines inline JS |
| `commodities.html` | 53KB | Full Tailwind + inline styles |
| `buy-requests.html` | 42KB | Full Tailwind + inline styles |
| `profile.html` | 41KB | Full Tailwind + inline styles |
| `dashboard.html` | 38KB | Full Tailwind + inline styles |
| `property.html` | 34KB | Full Tailwind + inline styles |

**Total: ~283KB of HTML** — much of it duplicate Tailwind config and inline styles.

### 6.3 No Caching Strategy

- No service worker caching in `frontend/` (only in `docs/`)
- No HTTP cache headers configured
- API responses not cached
- Images not lazy-loaded systematically

### 6.4 CSS Injection at Runtime

Components inject styles on first render via `document.createElement('style')`. This:
- Blocks rendering while CSS is parsed
- Cannot be cached by browser
- Creates style tag soup in `<head>`
- Makes debugging difficult

### 6.5 No Image Optimization

- 14 image files totaling 1.5MB
- No WebP/AVIF variants
- No responsive image srcsets
- PWA icons range from 16px to 512px (some may be unused)

---

## 7. Mobile UX Issues

### 7.1 Multi-Page Navigation on Mobile

Current multi-page app means:
- Full page reload on every navigation
- No transition animations between pages
- Lost scroll position on navigation
- 300KB+ Tailwind CDN re-downloaded on each page
- No offline support between pages

### 7.2 Competing Navigation Systems

The app has **4 separate navigation systems**:
1. **Top navbar** (`navbar.js`) — desktop only, hidden on mobile
2. **Sidebar** (`sidebar.js`) — desktop + mobile overlay
3. **Mobile drawer** (`mobileDrawer.js`) — left slide-out drawer
4. **Bottom nav** (`bottomNav.js`) — mobile fixed bottom

Users see different navigation depending on which component renders. The sidebar and drawer have overlapping functionality. This is confusing.

### 7.3 No Touch Gestures

- No swipe-to-navigate between views
- No pull-to-refresh
- Drawer has basic swipe-to-close only
- No haptic feedback integration (deviceService exists but unused)

### 7.4 Viewport Issues

- `index.html` uses `user-scalable=no` — violates accessibility guidelines
- No safe area insets handled consistently
- Bottom nav can overlap with content

### 7.5 No Bottom Sheet / Action Sheet Pattern

Common mobile patterns missing:
- No bottom sheet for filters
- No action sheet for confirmations
- No pull-up panel for details

---

## 8. Security Issues

### 8.1 Firebase Config Exposed in Source Code

```javascript
// firebase.js — empty strings in source, but fills from import.meta.env
const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || '',
  // ...
};
```

Currently safe (empty strings), but `import.meta.env` only works with a bundler like Vite. Since there's no build system, these env variables won't work. If someone hardcodes the keys, they'll be visible in client-side code.

### 8.2 Token Stored in localStorage

Both codebases store JWT tokens in `localStorage`:
```javascript
localStorage.setItem('nce_user', JSON.stringify(userData));
localStorage.setItem('nce_token', token);
```

**Risk**: XSS attack can steal tokens. `httpOnly` cookies would be more secure.

### 8.3 No CSRF Protection

API calls use Bearer token in Authorization header — this provides some CSRF protection, but:
- No CSRF token for form submissions
- No SameSite cookie configuration
- No origin checking on API requests

### 8.4 No Content Security Policy (CSP)

No CSP headers or meta tags configured. Allows:
- Inline scripts (XSS risk)
- External CDN loading (supply chain risk)
- eval() in Tailwind JIT compiler

### 8.5 XSS Risk in Card Components

`cards.js` renders user-supplied data without escaping:
```javascript
return `<h3 class="nce-card-title">${name}</h3>`;  // name is not escaped
```

While `helpers.js` has `escapeHtml()`, it's not used consistently in template rendering.

---

## 9. Dead Code

### 9.1 Dead Directories

| Path | Files | Size | Reason |
|------|-------|------|--------|
| `twa-project/` | 28 | 356KB | TWA approach abandoned, now using native WebView |
| `android/` (Capacitor) | 56 | 608KB | Capacitor approach abandoned, now using custom APK build |
| `capacitor.config.json` | 1 | — | Dead config |
| `android/variables.gradle` | 1 | — | Dead Capacitor config |

### 9.2 Dead/Unused Components

| Component | Status | Reason |
|-----------|--------|--------|
| `sidebar.js` | 🟡 Pending removal | Replaced by bottom nav in Digital Trading Floor |
| `mobileDrawer.js` | 🟡 Pending removal | Overlaps with sidebar and bottom nav |
| `navbar.js` | 🟡 Needs redesign | Will become trading-floor header |
| `loadingScreen.js` | 🟢 Keep | Still useful |
| `charts.js` | 🟢 Keep | Core for trading floor |
| `cards.js` | 🟢 Keep, refactor | Core component, needs modularization |
| `modal.js` | 🟢 Keep, refactor | Core component, too large |

### 9.3 Dead Capacitor Service Code

`deviceService.js` (289 lines) and `notificationService.js` (237 lines) contain extensive Capacitor plugin imports:
- `@capacitor/device`, `@capacitor/network`, `@capacitor/haptics`
- `@capacitor/camera`, `@capacitor/filesystem`, `@capacitor/status-bar`
- `@capacitor/splash-screen`, `@capacitor/app`, `capacitor-plugin-safe-area`
- `@capacitor/push-notifications`, `@capacitor/local-notifications`, `@capacitor/badge`

Since the app now uses a **native WebView** (not Capacitor), none of these plugins will work. The `MOBILE_CONFIG.isNative()` check will always return `false` in WebView.

### 9.4 Unused Module Entries

- `assets/js/modules/pwa/index.js` — PWA module, unclear if actively used
- `assets/js/modules/mobile/index.js` — Mobile-specific module, redundant with responsive design
- `assets/js/modules/landing/index.js` — Landing page module, may overlap with home

---

## 10. Unused Assets

### 10.1 PWA Icon Set (14 files, ~1.5MB)

All PWA icons exist but the PWA is not actively used:
- `icon-72x72.png` through `icon-512x512.png` (8 files)
- `apple-touch-icon.png`
- `favicon-16x16.png`, `favicon-32x32.png`
- `nce-logo.png` (source)
- `nce-icon.svg`, `nce-splash.svg`

**Recommendation**: Keep for PWA support but optimize file sizes.

### 10.2 Duplicate Icons in Dead Directories

- `twa-project/app/src/main/res/mipmap-*/` — 14 icon files
- `android/app/src/main/res/mipmap-*/` — 15 icon files
- These are from abandoned TWA and Capacitor builds

---

## Summary Statistics

| Metric | Count | Target |
|--------|-------|--------|
| Files > 300 lines | 23 | 0 |
| Files > 500 lines | 9 | 0 |
| Files > 1000 lines | 3 | 0 |
| Duplicated functions | ~12 | 0 |
| Inline CSS lines (JS injection) | ~1,700 | 0 |
| Dead directories | 2 (85 files, 964KB) | 0 |
| Competing nav systems | 4 | 1 |
| Total HTML size (multi-page) | 283KB | <50KB |
| Separate codebases | 2 | 1 |

---

## Priority Recommendations

### P0 — Must Fix Before Phase 2
1. **Unify into single SPA** — Merge `frontend/` and `docs/` into one codebase
2. **Remove dead directories** — Delete `twa-project/`, `android/`, `capacitor.config.json`
3. **Create shared icon module** — Extract all SVGs into `icons.js`
4. **Create shared UI primitives** — Button, Badge, Avatar, Card base components

### P1 — Fix During Phase 2-3
5. **Extract inline CSS** — Move all `injectStyles()` CSS into proper CSS files
6. **Replace Tailwind CDN** — Use pre-built CSS or remove Tailwind entirely
7. **Consolidate navigation** — Single bottom nav + header, remove sidebar/drawer
8. **Consolidate formatters** — Use `formatter.js` exclusively, delete duplicates
9. **Unify API layer** — Use `httpService.js` (more robust) in the SPA

### P2 — Fix During Phase 4-5
10. **Split files > 300 lines** — Break into focused modules
11. **Implement design token system** — CSS custom properties for all colors
12. **Add build system** — Vite for bundling, minification, tree-shaking
13. **XSS protection** — Use `escapeHtml()` in all template rendering
14. **Remove Capacitor service code** — Replace with WebView-compatible alternatives

---

*End of Phase 1 Audit Report*
