# NCE AUDIT REPORT — Phase 1
## Nusantara Commodity Exchange → Digital Trading Floor Restructuring

**Tanggal Audit**: 2026-06-15  
**Branch**: `feature/digital-trading-floor`  
**Auditor**: Automated Analysis  
**Scope**: Seluruh source code `frontend/` + referensi `docs/` (deployed version)

---

## RINGKASAN EKSEKUTIF

Audit ini menganalisis **40 file source code** dengan total **~17,200 baris** JavaScript, **2,898 baris** CSS, dan **~4,034 baris** HTML. Temuan utama mencakup:

- **18+ fungsi/konstanta yang diimpor tapi TIDAK ADA di source** — akan menyebabkan **runtime crash** pada semua halaman
- **6 duplikasi kode kritis** — `formatIDR`, `formatCompact`, `timeAgo`, `getInitials`, `generateAvatarColor`, `getStatusColor` diimplementasikan ulang di beberapa file
- **20 file melebihi batas 300 baris** — file terbesar `modal.js` (1,270 baris) dan `main.css` (2,898 baris)
- **3 sistem styling independen** — `main.css`, komponen inject CSS, dan Tailwind CDN — menciptakan inkonsistensi visual
- **2 arsitektur berbeda** — `frontend/` (Multi-Page App) vs `docs/` (Single-Page App dengan router)

---

## 1. STRUKTUR DIREKTORI

```
frontend/
├── index.html                    (1,541 lines — Landing page)
├── dashboard.html                (452 lines)
├── commodities.html              (659 lines)
├── property.html                 (422 lines)
├── profile.html                  (432 lines)
├── buy-requests.html             (528 lines)
├── sw.js                         (48 lines — Service Worker)
├── package.json                  (34 lines)
├── manifest.json                 (78 lines)
├── capacitor.config.json         (42 lines)
├── AUDIT_REPORT.md               (this file)
├── .well-known/
│   └── assetlinks.json           (Digital Asset Links for TWA)
├── assets/
│   ├── css/
│   │   └── main.css              (2,898 lines — Landing page only)
│   ├── images/
│   │   ├── nce-logo.png
│   │   ├── nce-icon.svg
│   │   ├── nce-splash.svg
│   │   └── icons/                (PWA icons: 72px–512px, 10 files)
│   └── js/
│       ├── config/
│       │   ├── firebase.js       (64 lines)
│       │   └── mobile-config.js  (83 lines)
│       ├── utils/
│       │   ├── helpers.js        (605 lines)
│       │   ├── formatter.js      (428 lines)
│       │   └── validator.js      (411 lines)
│       ├── services/
│       │   ├── authService.js    (420 lines)
│       │   ├── httpService.js    (422 lines)
│       │   ├── userService.js    (264 lines)
│       │   ├── commodityService.js (255 lines)
│       │   ├── propertyService.js  (242 lines)
│       │   ├── requestService.js   (314 lines)
│       │   ├── deviceService.js    (289 lines)
│       │   └── notificationService.js (237 lines)
│       ├── components/
│       │   ├── navbar.js         (624 lines)
│       │   ├── sidebar.js        (483 lines)
│       │   ├── cards.js          (739 lines)
│       │   ├── charts.js         (818 lines)
│       │   ├── modal.js          (1,270 lines)
│       │   ├── loadingScreen.js  (184 lines)
│       │   ├── mobileDrawer.js   (181 lines)
│       │   └── bottomNav.js      (117 lines)
│       └── modules/
│           ├── landing/index.js     (83 lines)
│           ├── dashboard/index.js   (431 lines)
│           ├── commodities/index.js (456 lines)
│           ├── property/index.js    (485 lines)
│           ├── buy-requests/index.js (452 lines)
│           ├── profile/index.js     (622 lines)
│           ├── pwa/index.js         (31 lines)
│           └── mobile/index.js      (33 lines)
├── android/                      (Capacitor project — UNUSED)
└── twa-project/                  (TWA project — UNUSED, replaced by nce-webview-app/)
```

### Versi Deployed (docs/) — Arsitektur Berbeda

```
docs/                             (GitHub Pages deployed version)
├── index.html                    (50 lines — SPA shell)
├── assets/
│   ├── css/
│   │   ├── variables.css         (108 lines)
│   │   ├── base.css              (210 lines)
│   │   ├── components.css        (328 lines)
│   │   └── views.css             (244 lines)
│   └── js/
│       ├── app.js                (166 lines — SPA bootstrap)
│       ├── router.js             (143 lines — Client-side router)
│       ├── config.js             (89 lines)
│       ├── auth.js               (128 lines)
│       ├── state.js              (82 lines — Shared state)
│       ├── api.js                (128 lines)
│       ├── components/
│       │   ├── header.js         (84 lines)
│       │   ├── marketBoard.js    (144 lines)
│       │   ├── marketPulse.js    (81 lines)
│       │   ├── sparkline.js      (70 lines)
│       │   └── toast.js          (53 lines)
│       ├── views/
│       │   ├── homeView.js       (280 lines)
│       │   ├── marketView.js     (220 lines)
│       │   ├── rfqView.js        (377 lines)
│       │   ├── messagesView.js   (235 lines)
│       │   └── profileView.js    (236 lines)
│       ├── services/             (same as frontend/)
│       └── utils/                (same as frontend/)
```

**Masalah Kritis**: `frontend/` dan `docs/` memiliki **arsitektur yang sama sekali berbeda**. Frontend menggunakan Multi-Page App (setiap halaman file HTML terpisah), sedangkan docs menggunakan Single-Page App dengan client-side router. Kedua codebase harus disatukan.

---

## 2. FILE YANG MELEBIHI BATAS 300 BARIS

Batas maksimal: **300 baris per file** (sesuai Clean Architecture Phase 5)

| # | File | Baris | Kelebihan | Kategori |
|---|------|------:|----------:|----------|
| 1 | `assets/css/main.css` | 2,898 | +2,598 | CSS |
| 2 | `assets/js/components/modal.js` | 1,270 | +970 | Komponen |
| 3 | `index.html` | 1,541 | +1,241 | HTML |
| 4 | `assets/js/components/charts.js` | 818 | +518 | Komponen |
| 5 | `assets/js/components/cards.js` | 739 | +439 | Komponen |
| 6 | `commodities.html` | 659 | +359 | HTML |
| 7 | `assets/js/components/navbar.js` | 624 | +324 | Komponen |
| 8 | `assets/js/modules/profile/index.js` | 622 | +322 | Modul |
| 9 | `assets/js/utils/helpers.js` | 605 | +305 | Utilitas |
| 10 | `assets/js/components/sidebar.js` | 483 | +183 | Komponen |
| 11 | `assets/js/modules/property/index.js` | 485 | +185 | Modul |
| 12 | `assets/js/modules/commodities/index.js` | 456 | +156 | Modul |
| 13 | `buy-requests.html` | 528 | +228 | HTML |
| 14 | `assets/js/modules/buy-requests/index.js` | 452 | +152 | Modul |
| 15 | `assets/js/modules/dashboard/index.js` | 431 | +131 | Modul |
| 16 | `assets/js/utils/formatter.js` | 428 | +128 | Utilitas |
| 17 | `assets/js/services/httpService.js` | 422 | +122 | Service |
| 18 | `assets/js/services/authService.js` | 420 | +120 | Service |
| 19 | `assets/js/utils/validator.js` | 411 | +111 | Utilitas |
| 20 | `assets/js/services/requestService.js` | 314 | +14 | Service |
| 21 | `dashboard.html` | 452 | +152 | HTML |
| 22 | `profile.html` | 432 | +132 | HTML |
| 23 | `property.html` | 422 | +122 | HTML |

**Total kelebihan baris**: ~7,296 baris di atas batas 300. Ini menunjukkan bahwa mayoritas file perlu dipecah menjadi modul-modul yang lebih kecil.

---

## 3. IMPOR YANG TIDAK ADA (RUNTIME CRASH)

### Status: KRITIS — Akan menyebabkan crash saat halaman dimuat

Setiap modul halaman mengimpor fungsi/konstanta yang **tidak diekspor** oleh file sumbernya. Karena menggunakan ES Modules, import yang gagal akan menyebabkan **seluruh modul tidak bisa dimuat**.

### 3.1 `cards.js` — Missing Exports

| Fungsi yang Diimpor | Diimpor Oleh | Status |
|---------------------|-------------|--------|
| `renderSkeleton()` | dashboard, commodities, buy-requests, property, profile | TIDAK DIEKSPOR |
| `renderErrorState()` | dashboard, commodities, buy-requests, property, profile | TIDAK DIEKSPOR |

**Export yang ada**: `renderCommodityCard`, `renderBuyRequestCard`, `renderPropertyCard`, `renderStatCard`, `renderOfferCard`, `renderActivityItem`

### 3.2 `modal.js` — Missing Exports

| Fungsi yang Diimpor | Diimpor Oleh | Status |
|---------------------|-------------|--------|
| `showNotification()` | dashboard, commodities, buy-requests, property, profile | TIDAK DIEKSPOR |
| `showCommodityDetail()` | commodities | TIDAK DIEKSPOR |

**Export yang ada**: `showModal`, `closeModal`, `showConfirmDialog`, `showLoginForm`, `showRegisterForm`, `showCreateBuyRequestForm`, `showOfferForm`, `showImageUpload`, `showLoading`, `showSuccess`, `showError`

### 3.3 `charts.js` — Missing Exports

| Fungsi yang Diimpor | Diimpor Oleh | Status |
|---------------------|-------------|--------|
| `updatePeriodToggle()` | dashboard | TIDAK DIEKSPOR |

**Export yang ada**: `renderPriceChart`, `renderVolumeChart`, `renderPieChart`, `renderMiniChart`, `resizeCharts`

### 3.4 `userService.js` — Missing Exports

| Fungsi yang Diimpor | Diimpor Oleh | Status |
|---------------------|-------------|--------|
| `getRecentActivity()` | dashboard | TIDAK DIEKSPOR |
| `getStoredUser()` | dashboard | TIDAK DIEKSPOR |
| `logout()` | profile | TIDAK DIEKSPOR |
| `isAuthenticated()` | profile | TIDAK DIEKSPOR |

**Export yang ada**: `default` (singleton dengan method: `getProfile`, `updateProfile`, `getAllUsers`, `verifyUser`, `updateRole`, `deleteAccount`, `getDashboardStats`)

### 3.5 `commodityService.js` — Missing Exports

| Fungsi/Konstanta yang Diimpor | Diimpor Oleh | Status |
|-------------------------------|-------------|--------|
| `COMMODITY_TYPES` | commodities, buy-requests | TIDAK DIEKSPOR |
| `LOCATIONS` | commodities | TIDAK DIEKSPOR |
| `getPriceChartData()` | dashboard | TIDAK DIEKSPOR |
| `getVolumeChartData()` | dashboard | TIDAK DIEKSPOR |

**Export yang ada**: `default` (singleton dengan method: `getAll`, `getById`, `create`, `update`, `delete`, `getByType`, `getFeatured`, `uploadImage`)

### 3.6 `propertyService.js` — Missing Exports

| Konstanta yang Diimpor | Diimpor Oleh | Status |
|------------------------|-------------|--------|
| `PROPERTY_TYPES` | property | TIDAK DIEKSPOR |

**Export yang ada**: `default` (singleton)

### 3.7 `requestService.js` — Missing Exports

| Fungsi/Konstanta yang Diimpor | Diimpor Oleh | Status |
|-------------------------------|-------------|--------|
| `getMyRequests()` | buy-requests | TIDAK DIEKSPOR |
| `REQUEST_STATUSES` | buy-requests | TIDAK DIEKSPOR |

**Export yang ada**: `default` (singleton)

### Ringkasan Dampak

| Halaman | Jumlah Import Rusak | Dampak |
|---------|---------------------|--------|
| dashboard.html | 7 | Crash total — halaman tidak bisa dimuat |
| commodities.html | 4 | Crash total |
| buy-requests.html | 6 | Crash total |
| property.html | 3 | Crash total |
| profile.html | 4 | Crash total |

> **Catatan**: Landing page (`index.html`) tidak terdampak karena menggunakan inline script dan modul terpisah yang tidak memiliki broken imports.

---

## 4. DUPLIKASI KODE

### 4.1 Duplikasi Fungsi Utilitas

| Fungsi | Lokasi Duplikat | Seharusnya Menggunakan |
|--------|----------------|----------------------|
| `formatIDR()` | `cards.js:13-17`, `charts.js:188-197` | `formatter.js:formatCurrency()` |
| `formatCompact()` | `cards.js:24-30`, `charts.js:194-208` | `formatter.js:formatCompactNumber()` |
| `timeAgo()` | `cards.js:37-54` | `formatter.js:formatRelativeTime()` |
| `getStatusConfig()` | `cards.js:61-74` | `helpers.js:getStatusColor()` + `formatter.js:formatStatus()` |
| `escapeHtml()` | `helpers.js:458-475` | Sama dengan `validator.js:sanitizeInput()` |

### 4.2 Duplikasi Fungsi Avatar

Fungsi `getInitials()` dan `generateAvatarColor()` diimplementasikan ulang di **4 lokasi berbeda**:

| Lokasi | Implementasi |
|--------|-------------|
| `cards.js:476` (inline di `renderCommodityCard`) | Inisial + hash warna |
| `cards.js:668-674` (inline di `renderOfferCard`) | Inisial + hash warna (identik) |
| `sidebar.js:62-74` | `getInitials()` + `generateAvatarColor()` |
| `navbar.js:54-66` | `getInitials()` + `generateAvatarColor()` |

Semua menggunakan algoritma hash yang sama:
```javascript
const colors = ['#10B981', '#06B6D4', '#8B5CF6', '#F59E0B', '#EF4444'];
let h = 0;
for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
return colors[Math.abs(h) % colors.length];
```

### 4.3 Duplikasi Logika Halaman

| Pola | Lokasi Duplikat | Baris per Instansi |
|------|----------------|-------------------|
| `initMobileMenu()` | `commodities/index.js:71-78`, `buy-requests/index.js:77-84`, `property/index.js:78-85` | ~7 baris x3 |
| Sidebar toggle | `dashboard/index.js:65-100`, `profile/index.js:75-110` | ~35 baris x2 |
| Pagination rendering | `commodities/index.js:307-371`, `property/index.js:350-400`, `buy-requests/index.js:314-357` | ~60 baris x3 |
| Status color mapping | `cards.js:getStatusConfig()`, `helpers.js:getStatusColor()`, `profile/index.js:306-317` | ~15 baris x3 |
| Inline CSS di HTML | Semua 5 halaman inner memiliki `<style>` block identik (~30 baris) | ~30 baris x5 |

**Total baris duplikat**: ~350+ baris yang bisa dieliminasi dengan shared modules.

---

## 5. FIREBASE CALLS DI LUAR SERVICE LAYER

### Status: AMAN — Semua Firebase calls sudah melalui service layer

| File | Firebase Usage | Lokasi |
|------|---------------|--------|
| `config/firebase.js` | Inisialisasi: `initializeApp`, `getAuth`, `getFirestore`, `getStorage` | Config layer (OK) |
| `services/authService.js` | `signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, `firebaseSignOut`, `onAuthStateChanged`, `getIdToken` | Service layer (OK) |

**Catatan**: Meskipun `getFirestore()` dan `getStorage()` diinisialisasi di `firebase.js`, keduanya **diekspor tapi tidak pernah diimpor** oleh service manapun. Semua operasi data melalui Express backend API via `httpService.js`.

### Potensi Masalah
- `db` (Firestore) dan `storage` (Firebase Storage) diinisialisasi tapi **tidak digunakan** — menambah bundle size tanpa manfaat
- `import.meta.env` digunakan untuk konfigurasi Firebase, tapi **tidak ada bundler (Vite) yang dikonfigurasi** — environment variables akan selalu fallback ke empty string

---

## 6. TECHNICAL DEBT

### 6.1 Dua Codebase Paralel

`frontend/` dan `docs/` memiliki **arsitektur berbeda**:
- **frontend/**: Multi-Page App — 6 file HTML terpisah, masing-masing dengan script module sendiri
- **docs/**: Single-Page App — 1 file HTML shell + client-side router (`router.js`) + views

Masalah ini menyebabkan:
- Fitur harus diimplementasi dua kali
- Bug fixes tidak sinkron
- Testing harus dilakukan di dua codebase

### 6.2 Tidak Ada Build System

- **Tidak ada Vite/Webpack/Rollup** — semua file served as-is tanpa minification, tree-shaking, atau bundling
- **`import.meta.env`** digunakan tapi tidak ada tool yang memprosesnya — akan selalu `undefined`
- **Tailwind CDN** digunakan di production — tidak ada JIT, purging, atau optimization
- **Tidak ada source maps** untuk debugging

### 6.3 Service Worker Minimal

`sw.js` hanya meng-cache 7 asset dasar:
```javascript
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/css/main.css',
  '/assets/images/nce-logo.png',
  '/assets/images/nce-icon.svg',
  '/assets/images/nce-splash.svg'
];
```

Tidak ada caching untuk:
- JavaScript modules (services, components, utils)
- API responses
- Halaman inner (dashboard, commodities, dll)
- Font Inter dari Google Fonts

### 6.4 Tidak Ada State Management

- Setiap halaman memuat state sendiri secara independen
- Tidak ada shared state antar halaman (user data dimuat ulang di setiap navigasi)
- Auth state di-cache di localStorage tapi tidak ada mekanisme sinkronisasi antar tab

### 6.5 Project Android Tidak Terpakai

Dua project Android ada di `frontend/`:
- `frontend/android/` — Capacitor project (tidak digunakan)
- `frontend/twa-project/` — TWA project (tidak digunakan, sudah diganti dengan `nce-webview-app/`)

Kedua direktori ini menambah ukuran repository tanpa manfaat.

---

## 7. PERFORMANCE

### 7.1 Asset Loading

| Masalah | Dampak | Solusi |
|---------|--------|--------|
| Tailwind CDN (full bundle ~350KB) | Load time tinggi, blocking render | Gunakan Vite + Tailwind JIT |
| Google Fonts Inter (external) | DNS lookup + TCP connection ekstra | Self-host font |
| Tidak ada lazy loading untuk modul | Semua JS dimuat sekaligus | Dynamic imports |
| SVG icons di-inline di JS | String besar di memory | Sprite sheet atau icon component |
| Tidak ada image optimization | Gambar tidak terkompresi | WebP + responsive images |

### 7.2 Rendering Performance

| Masalah | Lokasi | Dampak |
|---------|--------|--------|
| `innerHTML` untuk semua rendering | cards.js, charts.js, modal.js, dll | Tidak ada DOM diffing, full re-render |
| Style injection setiap render | Semua komponen (`injectCardStyles()`, dll) | Cek duplikasi style setiap kali |
| Auto-refresh 60 detik | dashboard/index.js | Fetch yang tidak perlu jika tab tidak aktif |
| Pagination full re-render | commodities, property, buy-requests | Seluruh grid di-replace setiap page change |

### 7.3 Network Performance

| Masalah | Dampak |
|---------|--------|
| Tidak ada request deduplication | Komponen berbeda bisa fetch data yang sama |
| Tidak ada API response caching | Data dimuat ulang setiap navigasi halaman |
| Tidak ada retry logic di httpService | Gagal sekali = gagal total |
| Tidak ada request cancellation | Navigation tidak membatalkan request pending |

---

## 8. MOBILE UX GAPS

### 8.1 Navigasi Tidak Konsisten

| Halaman | Navigasi Mobile | Bottom Nav |
|---------|----------------|------------|
| index.html (Landing) | Custom scroll navigation | Tidak ada |
| dashboard.html | Sidebar toggle + hamburger | Tidak ada |
| commodities.html | Hamburger + mobile menu | Tidak ada |
| property.html | Hamburger + mobile menu | Tidak ada |
| buy-requests.html | Hamburger + mobile menu | Tidak ada |
| profile.html | Sidebar toggle + hamburger | Tidak ada |

**bottomNav.js** (117 baris) ada tapi **tidak digunakan** di halaman manapun.

### 8.2 Touch Interaction

- Tidak ada swipe gesture untuk sidebar
- Tidak ada pull-to-refresh
- Tidak ada infinite scroll (menggunakan pagination tradisional)
- Modal tidak bisa di-dismiss dengan swipe down

### 8.3 Responsive Design

- `main.css` memiliki media queries tapi hanya untuk landing page
- Halaman inner bergantung sepenuhnya pada Tailwind responsive classes
- Tidak ada breakpoint konsisten antara main.css dan Tailwind config

---

## 9. SECURITY

### 9.1 XSS Vulnerability

Meskipun `escapeHtml()` tersedia di `helpers.js`, banyak komponen menyisipkan data user langsung ke innerHTML tanpa escaping:

| File | Contoh |
|------|--------|
| `cards.js:498` | `${name}` di card title — tidak di-escape |
| `cards.js:506` | `${seller.name}` — tidak di-escape |
| `cards.js:538` | `${commodityType}` — tidak di-escape |
| `cards.js:684` | `${sellerName}` — tidak di-escape |
| `charts.js` | Data labels tidak di-escape |
| `modal.js` | Form values tidak di-escape saat ditampilkan |

### 9.2 Authentication

| Masalah | Detail |
|---------|--------|
| Token disimpan di localStorage | Rentan terhadap XSS |
| Tidak ada token refresh mechanism | Token expired = harus login ulang |
| Firebase config fallback ke empty string | Aplikasi akan gagal silently tanpa error yang jelas |
| `import.meta.env` tanpa bundler | Environment variables tidak terproteksi |

### 9.3 Content Security Policy

Tidak ada CSP header yang dikonfigurasi. Inline styles dan scripts diizinkan tanpa batasan.

---

## 10. DEAD CODE & UNUSED ASSETS

### 10.1 Dead Code

| Item | File | Detail |
|------|------|--------|
| `db` (Firestore instance) | `config/firebase.js:42` | Diekspor tapi tidak pernah diimpor |
| `storage` (Firebase Storage) | `config/firebase.js:45` | Diekspor tapi tidak pernah diimpor |
| `app` (Firebase App) | `config/firebase.js:36` | Diekspor tapi tidak pernah diimpor oleh konsumer |
| `hasFormData` variable | `httpService.js:162-163` | Dihitung tapi tidak pernah dibaca |
| `loadingScreen.js` | `components/loadingScreen.js` | Tidak diimpor oleh modul manapun |
| `mobileDrawer.js` | `components/mobileDrawer.js` | Tidak diimpor oleh modul manapun |
| `bottomNav.js` | `components/bottomNav.js` | Tidak diimpor oleh halaman manapun |
| `deviceService.js` | `services/deviceService.js` | Tidak diimpor oleh modul manapun |
| `notificationService.js` | `services/notificationService.js` | Tidak diimpor oleh modul manapun |
| `mobile-config.js` | `config/mobile-config.js` | Tidak diimpor oleh modul manapun |
| `mobile/index.js` | `modules/mobile/index.js` | Tidak diimpor oleh halaman manapun |

### 10.2 Unused Directories

| Direktori | Ukuran Estimasi | Status |
|-----------|----------------|--------|
| `frontend/android/` | ~15 MB | Capacitor project — tidak digunakan |
| `frontend/twa-project/` | ~5 MB | TWA project — sudah diganti nce-webview-app |

### 10.3 Unused PWA Icons

`assets/images/icons/` berisi 10 file icon PWA. Jika PWA tidak di-support dengan baik (Service Worker minimal), ini tidak berguna.

---

## 11. INKONSISTENSI STYLING

### 11.1 Tiga Sistem CSS Terpisah

| Sistem | Digunakan Oleh | Ukuran |
|--------|---------------|--------|
| `main.css` + CSS Custom Properties | index.html (Landing) | 2,898 baris |
| Component-injected CSS (`injectCardStyles()`, dll) | Komponen cards, charts, modal, sidebar, navbar | ~800+ baris tersebar |
| Tailwind CDN + inline classes | Semua halaman inner | ~2,000+ class references |

Hasil: Warna, spacing, dan typography **tidak konsisten** antara landing page dan halaman inner.

### 11.2 Duplikasi CSS

| Style | `main.css` | Component CSS | Tailwind |
|-------|-----------|---------------|----------|
| Card background | `.nce-card` | `cards.js` inject | `bg-navy-800` |
| Stat card | `.stat-card` | `cards.js` `.nce-stat-card` | Grid classes |
| Scrollbar | `::-webkit-scrollbar` | `sidebar.js` scrollbar | Tailwind utilities |
| Status badges | `.badge-*` | `cards.js` `.nce-badge` | Inline styles |
| Button gradients | `.btn-primary` | `navbar.js` `.nce-btn-register` | `bg-gradient-to-r` |
| Modal overlay | `.modal-overlay` | `modal.js` inline | N/A |

---

## 12. KONFIGURASI YANG BERMASALAH

| File | Masalah | Dampak |
|------|---------|--------|
| `capacitor.config.json` | `webDir: "www"` tapi tidak ada direktori `www/` | Capacitor build akan gagal |
| `package.json` | Tidak ada build script, hanya `dev` dengan `npx serve` | Tidak ada production build |
| `manifest.json` | `start_url: "/"` — tidak sesuai dengan GitHub Pages path | PWA install bisa gagal |
| `.well-known/assetlinks.json` | SHA256 fingerprint untuk TWA yang sudah tidak digunakan | Tidak berbahaya tapi tidak berguna |

---

## 13. REKOMENDASI PRIORITAS

### P0 — CRITICAL (Harus diperbaiki sebelum Phase 2)

1. **Implementasikan semua missing exports** di services dan components
   - Tambahkan `renderSkeleton()`, `renderErrorState()` ke cards.js
   - Tambahkan `showNotification()`, `showCommodityDetail()` ke modal.js
   - Tambahkan `updatePeriodToggle()` ke charts.js
   - Tambahkan `getRecentActivity()`, `getStoredUser()`, `logout()`, `isAuthenticated()` ke userService.js
   - Tambahkan `COMMODITY_TYPES`, `LOCATIONS`, `getPriceChartData()`, `getVolumeChartData()` ke commodityService.js
   - Tambahkan `PROPERTY_TYPES` ke propertyService.js
   - Tambahkan `getMyRequests()`, `REQUEST_STATUSES` ke requestService.js

2. **Hapus dead Firebase exports** (`db`, `storage`, `app`) dari firebase.js

3. **Fix capacitor.config.json** — ubah `webDir` ke `.` atau hapus file

### P1 — HIGH (Phase 2-3)

4. **Konsolidasi ke satu codebase** — pilih antara SPA (docs/) atau MPA (frontend/). Rekomendasi: SPA dengan router
5. **Eliminasi semua duplikasi kode** — buat shared modules untuk formatIDR, timeAgo, getInitials, generateAvatarColor, initMobileMenu, sidebar toggle, pagination
6. **Satukan sistem styling** — pilih satu: Tailwind JIT + Vite ATAU CSS custom properties
7. **Implementasikan shared bottom navigation** di semua halaman

### P2 — MEDIUM (Phase 4-5)

8. **Pecah file besar** — modal.js (1,270 baris) jadi 5+ modul, main.css (2,898 baris) jadi 6+ file
9. **Tambahkan build system** (Vite) — minification, tree-shaking, environment variables
10. **Perbaiki Service Worker** — caching strategy untuk JS modules dan API responses
11. **Tambahkan XSS protection** — escape semua user input sebelum innerHTML
12. **Hapus unused directories** — `frontend/android/`, `frontend/twa-project/`

### P3 — LOW (Phase 6)

13. **Tambahkan state management** — minimal shared reactive store
14. **Implementasikan lazy loading** — dynamic imports untuk modul halaman
15. **Tambahkan request deduplication & caching** — di httpService layer
16. **Tambahkan unit tests** — tidak ada test sama sekali saat ini
17. **Tambahkan linting** — ESLint + Prettier

---

## 14. METRIK AUDIT

| Metrik | Nilai | Target |
|--------|------:|-------:|
| Total file source | 40 | — |
| Total baris JS | ~10,270 | — |
| Total baris CSS | 2,898 | — |
| Total baris HTML | ~4,034 | — |
| File > 300 baris | 23 | 0 |
| Import rusak | 18+ | 0 |
| Duplikasi kode | 6 pola kritis | 0 |
| Dead code | 11 item | 0 |
| Test coverage | 0% | >70% |
| Sistem styling | 3 | 1 |
| Codebase paralel | 2 | 1 |

---

*Dokumen ini dihasilkan sebagai bagian dari Phase 1 — Audit Project dari rencana 6 fase restrukturisasi NCE menjadi "Indonesia's Digital Trading Floor".*
