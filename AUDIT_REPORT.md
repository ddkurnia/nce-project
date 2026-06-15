# NCE AUDIT REPORT
**Nusantara Commodity Exchange — Codebase Audit**
**Date:** 2025-06-15 | **Version:** 3.1.0

---

## EXECUTIVE SUMMARY

| Metric | Value |
|--------|-------|
| Frontend Source Lines | 18,177 |
| Backend Source Lines | 6,833 |
| Files > 300 Lines | 22 frontend + 10 backend = **32** |
| Duplicate Code Patterns | **14 critical duplications** |
| Dead Code | ~2,000+ lines (frontend) + 984 lines (backend) |
| Security Issues | **7 critical**, 6 medium |
| Performance Issues | **9 critical** |
| Runtime Crash Bugs | **5 import mismatches** (inner pages won't load) |
| Test Coverage | **0%** |

---

## 1. FILES EXCEEDING 300 LINES

### Frontend
| File | Lines | Concern |
|------|-------|---------|
| `index.html` | 1,541 | Monolithic landing page with inline CSS/JS |
| `assets/css/main.css` | 2,898 | Monolithic CSS — loaded on every page |
| `assets/js/components/modal.js` | 1,270 | All forms hardcoded in one file |
| `assets/js/components/charts.js` | 818 | 4 chart types + inline CSS |
| `assets/js/components/cards.js` | 739 | 6 card types + inline CSS + duplicate formatters |
| `assets/js/components/navbar.js` | 624 | Component + 300 lines inline CSS |
| `assets/js/modules/profile/index.js` | 622 | Page module + duplicate sidebar logic |
| `assets/js/utils/helpers.js` | 605 | Kitchen sink — many unused functions |
| `assets/js/components/sidebar.js` | 483 | Entire component DEAD (never imported) |
| `assets/js/modules/property/index.js` | 485 | Duplicate pagination + sidebar |
| `assets/js/modules/commodities/index.js` | 456 | Duplicate pagination + sidebar |
| `assets/js/modules/buy-requests/index.js` | 452 | Duplicate pagination + sidebar |
| `assets/js/modules/dashboard/index.js` | 431 | Duplicate sidebar |
| `assets/js/utils/formatter.js` | 428 | Formatting utilities |
| `assets/js/services/httpService.js` | 422 | HTTP wrapper |
| `assets/js/services/authService.js` | 420 | Auth service |
| `assets/js/services/requestService.js` | 314 | Request service |
| `commodities.html` | 659 | Page HTML |
| `buy-requests.html` | 528 | Page HTML |
| `dashboard.html` | 452 | Page HTML |
| `profile.html` | 432 | Page HTML |
| `property.html` | 422 | Page HTML |

### Backend
| File | Lines | Concern |
|------|-------|---------|
| `utils/validator.js` | 661 | **COMPLETELY UNUSED** — dead code |
| `controllers/requestController.js` | 585 | Too large |
| `services/requestService.js` | 565 | Too large |
| `services/userService.js` | 524 | Too large |
| `services/commodityService.js` | 472 | Too large |
| `services/propertyService.js` | 450 | Too large |
| `services/authService.js` | 387 | Too large |
| `controllers/userController.js` | 367 | Too large |
| `controllers/commodityController.js` | 332 | Slightly over |
| `controllers/propertyController.js` | 329 | Slightly over |

---

## 2. DUPLICATE CODE

### Critical (Duplicated 3-4x)
1. **Mobile Menu Toggle** — identical `initMobileMenu()` in 4 page modules
2. **Sidebar Toggle** — `openSidebar()`/`closeSidebar()` in 3 modules despite `sidebar.js` existing
3. **Pagination Component** — `renderPagination()` in 3 modules (only differs by entity label)
4. **getStatusColor()** — 3 separate implementations (helpers.js, cards.js, profile/index.js)
5. **formatIDR/formatCompact/timeAgo** — cards.js duplicates formatter.js
6. **Tailwind Config Block** — identical config repeated in every HTML page
7. **Common CSS Block** — scrollbar/gradient styles repeated in every page
8. **getUsersCollection() lazy getter** — 16 instances across 6 service files (backend)
9. **Ownership-check pattern** — identical in 6 controller methods (backend)
10. **buildQuery()** — near-identical in commodityService + propertyService (backend)
11. **Pagination logic** — identical count-then-paginate in 4 services (backend)
12. **uploadImage()** — identical pattern in commodityService + propertyService (backend)

### Moderate (Duplicated 2x)
13. **getInitials()/generateAvatarColor()** — in navbar.js + sidebar.js
14. **SVG Icon definitions** — duplicated in navbar.js + sidebar.js

---

## 3. UI REUSABILITY

| Component | Reusable? | Issue |
|-----------|-----------|-------|
| `bottomNav.js` | ✅ Yes | Properly uses MOBILE_CONFIG |
| `mobileDrawer.js` | ✅ Yes | Uses MOBILE_CONFIG, swipe support |
| `charts.js` | ✅ Yes | Pure SVG charts |
| `loadingScreen.js` | ✅ Yes | Clean component |
| `navbar.js` | ❌ DEAD | Never imported by any page |
| `sidebar.js` | ❌ DEAD | Never imported; modules have inline sidebar |
| `modal.js` | ⚠️ Partial | 1,270 lines, all forms hardcoded |
| `cards.js` | ⚠️ Partial | Has duplicate formatting functions |

**Root cause:** Every HTML page hardcodes its own layout (sidebar, header, mobile menu) instead of using shared components.

---

## 4. FIREBASE CALLS BYPASSING SERVICE LAYER

| Location | Issue |
|----------|-------|
| `notificationService.js:61` | Uses raw `fetch()` to `/devices/register` — no auth token, no error standardization |
| `authController.js:13` | Imports `auth` directly from Firebase config, bypassing authService |

All other Firebase calls properly go through the service layer. ✅

---

## 5. TECHNICAL DEBT

### Critical
| Issue | Impact |
|-------|--------|
| **No build system** | No bundler (Vite/Webpack). Raw ES modules, no tree-shaking, no minification |
| **`import.meta.env` without bundler** | `firebase.js` uses Vite-specific API — will crash at runtime |
| **5 import mismatches** | Inner pages import non-existent exports from services — pages won't load |
| **No testing** | 0% test coverage, no test framework configured |
| **No linting** | No ESLint/Prettier, inconsistent code style |
| **Dead components** | sidebar.js (483 lines) + navbar.js (624 lines) = 1,107 lines never used |

### High
| Issue | Impact |
|-------|--------|
| **No CI/CD** | No GitHub Actions, no deployment pipeline |
| **Tailwind CDN in production** | Dev-only JIT compiler (~3MB) loaded on every page |
| **87 console.log statements** | Left in production code |
| **Hardcoded localhost API** | `firebase.js` defaults to `http://localhost:3001/api` |
| **Placeholder WhatsApp number** | `mobile-config.js:32` uses `6281234567890` |

---

## 6. PERFORMANCE ISSUES

### Critical
| Issue | Details |
|-------|---------|
| **Tailwind CDN (~3MB)** | Development JIT compiler loaded in production on every page |
| **No JS lazy loading** | All modules eagerly loaded, no code splitting |
| **CSS duplication** | Components inject CSS via JS; main.css is 2,898 lines loaded everywhere |
| **Service Worker over-caching** | `sw.js` uses cache-first for ALL requests including API calls |
| **Double-query pagination** | Every list endpoint reads Firestore twice (count + data) — backend |
| **In-memory search filtering** | `getAllUsers` fetches ALL docs then filters — doesn't scale — backend |
| **Full collection scans** | `countByType()`/`countByStatus()` read every document — backend |
| **5 parallel full-collection reads** | Dashboard stats reads 5 entire collections — backend |
| **Firestore offset pagination** | O(n) — still reads all skipped documents — backend |

### Moderate
| Issue | Details |
|-------|---------|
| **Google Fonts render-blocking** | No `font-display: swap` |
| **No image optimization** | PNG only, no WebP/AVIF |
| **JS-injected CSS** | 100-300 lines per component, blocks rendering |
| **Dashboard polls every 60s** | Even when tab is hidden |
| **Haptic vibration on all touches** | `vibrate(5)` on every button/card — battery drain |
| **No caching layer** | Every request hits Firestore — backend |

---

## 7. MOBILE UX ISSUES

| Issue | Severity | Details |
|-------|----------|---------|
| `user-scalable=no` on landing | 🔴 Critical | Violates accessibility, prevents pinch-to-zoom |
| Touch targets too small | 🟡 Medium | Some sidebar items at `12px 16px` padding |
| No safe area handling on landing | 🟡 Medium | Missing `env(safe-area-inset-*)` |
| Viewport height calculation | 🟡 Medium | Only runs on load + resize, not on URL bar change |
| Double-tap zoom blocked | 🟡 Medium | Prevents ALL double-click interactions |
| No pull-to-refresh | 🟢 Low | No native-feeling refresh pattern |
| Landing page has no bottom nav | 🟡 Medium | Inconsistent navigation vs other pages |

---

## 8. SECURITY ISSUES

### Critical
| Issue | Details |
|-------|---------|
| **XSS via innerHTML** | 64 occurrences; image URLs injected unescaped: `<img src="${image}">` |
| **JWT in localStorage** | Vulnerable to XSS token theft; should use httpOnly cookies |
| **req.body spread into Firestore** | No field whitelisting on update — clients can inject arbitrary fields |
| **validator.js completely unused** | 661 lines of input validation sit dormant; controllers have weak ad-hoc checks |

### Medium
| Issue | Details |
|-------|---------|
| **No CSRF protection** | No token mechanism for cookie-based auth |
| **No Content Security Policy** | No CSP meta tag or header |
| **Notification service bypasses auth** | Raw `fetch()` without auth token |
| **Refresh/logout bypass authenticate middleware** | Inconsistent auth enforcement |
| **`verifiedBy: 'admin'` hardcoded** | Audit trail lost — should be admin's UID |
| **Capacitor allows cleartext + mixed content** | `allowMixedContent: true`, `cleartext: true` |

---

## 9. DEAD CODE

### Frontend (~2,000+ lines)
| Module | Lines | Status |
|--------|-------|--------|
| `sidebar.js` | 483 | Entire component never imported |
| `navbar.js` | 624 | Entire component never imported |
| `helpers.js` unused functions | ~200 | `createBreadcrumb`, `copyToClipboard`, `downloadFile`, `lazyLoadImage`, `scrollToElement`, `getQueryString`, `parseQueryString`, `deepClone`, `groupBy` |
| `cards.js` duplicate formatters | ~40 | `formatIDR`, `formatCompact`, `timeAgo`, `getStatusConfig` |
| `profile/index.js` duplicate | ~10 | Local `getStatusColor` |
| `httpService.js` unused interceptors | ~30 | `addRequestInterceptor`, `addResponseInterceptor` |
| `mobile-config.js` | 1 | `whatsappNumber` never referenced |

### Backend (984 lines — 14% of codebase)
| Module | Lines | Status |
|--------|-------|--------|
| `utils/validator.js` | 661 | **Entirely unused** — no import anywhere |
| `middleware/errorMiddleware.js` | 225 | **Entirely unused** — server.js has inline handler |
| `utils/response.js` | 98 | **Entirely unused** — controllers build responses inline |

### Backend Unused Functions
- `commodityService.countByType()`, `getRecent()`, `getBySeller()`
- `propertyService.countByType()`, `getByOwner()`
- `requestService.countByStatus()`
- `userService.getRecentActivity()` — reads `activity` collection that's never written to
- `authService.verifyFirebaseToken()`, `deleteSession()`, `createSession()` (sessions never read/cleaned)
- `cloudinary.deleteImage()`, `getOptimizedUrl()` — images never deleted from Cloudinary

---

## 10. UNUSED ASSETS

| Asset | Status | Details |
|-------|--------|---------|
| `nce-icon.svg` | ⚠️ Possibly unused | Not referenced in HTML or JS |
| `nce-splash.svg` | ⚠️ Only Capacitor | Not used in web |
| `android/` directory | Present | Full Capacitor project — only needed for native builds |
| `twa-project/` directory | Present | Full TWA project — superseded by WebView APK |

---

## 11. RUNTIME CRASH BUGS

These import mismatches mean **inner pages will not load**:

1. `commodities/index.js` imports `COMMODITY_TYPES, LOCATIONS` — **not exported** by commodityService.js
2. `buy-requests/index.js` imports `REQUEST_STATUSES, getMyRequests` — **not exported** by requestService.js
3. `property/index.js` imports `PROPERTY_TYPES` — **not exported** by propertyService.js
4. `profile/index.js` imports `logout, isAuthenticated, getStoredUser` — **not exported** by userService.js
5. `dashboard/index.js` imports `getDashboardStats, getRecentActivity, getStoredUser` — partially not exported

Plus: `firebase.js` uses `import.meta.env` which requires Vite — **no bundler configured**.

---

## PRIORITY FIXES

### P0 — Immediate (App is broken)
1. Fix missing service exports (5 import mismatches)
2. Remove `import.meta.env` dependency or add Vite
3. Fix XSS vectors in innerHTML usage
4. Remove `user-scalable=no` from viewport meta

### P1 — Short-term
5. Replace Tailwind CDN with pre-built CSS
6. Extract duplicate code into shared modules
7. Remove dead code (sidebar.js, navbar.js, unused helpers)
8. Fix notificationService to use httpService
9. Activate validator.js on backend routes
10. Wire up errorMiddleware.js

### P2 — Medium-term
11. Add ESLint + Prettier
12. Add unit tests
13. Implement proper SPA routing
14. Store JWT in httpOnly cookie
15. Add Content Security Policy
16. Fix Service Worker cache strategy
17. Add Redis caching layer
18. Clean up dual field naming in Firestore
19. Add session cleanup cron
20. Document required Firestore composite indexes
