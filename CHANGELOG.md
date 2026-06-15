# NCE CHANGELOG

## [4.0.0] - 2025-06-15 — Digital Trading Floor Redesign

### BREAKING CHANGES
- Complete frontend rewrite from multi-page marketplace to single-page Digital Trading Floor
- Removed all old HTML pages (dashboard.html, commodities.html, property.html, profile.html, buy-requests.html)
- Removed Tailwind CDN dependency — now uses custom CSS with CSS custom properties
- New hash-based SPA router replaces full page reloads
- New bottom navigation replaces sidebar as primary mobile navigation

### Added
- **SPA Router** — Hash-based routing (`#/home`, `#/market`, `#/rfq`, `#/messages`, `#/profile`)
- **Home View** — Market Overview with:
  - Market Summary (average change, total supply, total demand)
  - Top Commodities (horizontal scroll cards with price + change)
  - Latest RFQ (real API data)
  - Market Movers (biggest price changes)
  - Top Verified Companies (with Trust Score)
  - Latest Business Opportunities (property listings)
- **Market View** — Market Board with:
  - Search bar with debounced filtering
  - Commodity type filter chips
  - Market board table showing: Commodity, Last Price, Supply, Demand, Buy/Sell Orders
  - Supply vs Demand visual bars with gap indicator
- **RFQ View** — Enhanced RFQ system with:
  - Status filter chips (All, Open, In Progress)
  - Create RFQ modal with form validation
  - Connected to real API endpoints
- **Profile View** — Company/Trader profile with:
  - Trust Score circular progress indicator
  - Verification badges
  - Menu: My Listings, My RFQs, Settings, Logout
- **Messages View** — Placeholder for future chat/messaging
- **Market Pulse Ticker** — Auto-scrolling strip with 10 Indonesian commodity prices
- **Toast Notifications** — Success/error/info/warning with auto-dismiss
- **Auth Modal** — Login/Register with tab switching
- **State Management** — Simple reactive state module

### Design
- **New Color Palette** — Bloomberg Terminal / TradingView / Binance inspired:
  - Background: `#081120`
  - Secondary: `#0F172A`
  - Gold Accent: `#D4AF37`
  - Success: `#22C55E`, Danger: `#EF4444`
- **Typography** — Inter + JetBrains Mono for numbers
- **CSS Custom Properties** — All design tokens in `variables.css`
- **Mobile-first responsive** — 44px touch targets, safe area handling
- **No external CSS frameworks** — Pure custom CSS

### Architecture
- **Clean file structure** — All files under 300 lines
- **Modular components** — header, bottomNav, cards, marketBoard, marketPulse, modal, toast
- **Separation of concerns** — views/, components/, services/, utils/
- **API service layer** — `api.js` handles all HTTP calls with auth headers
- **Auth module** — `auth.js` manages login/register/logout with localStorage
- **Config module** — `config.js` for app configuration (no `import.meta.env`)

### Removed
- Tailwind CDN (~3MB dev JIT compiler)
- Old multi-page HTML structure
- Dead code: sidebar.js (483 lines), navbar.js (624 lines)
- Old module system (modules/ directory)
- Firebase client SDK dependency (auth now via backend API)
- Capacitor/mobile-specific code
- TWA project directory
- `import.meta.env` usage (replaced with config.js)

### Fixed
- XSS vulnerability — all user data escaped via `escapeHtml()`
- Accessibility — removed `user-scalable=no` from viewport meta
- Import mismatches — all modules properly export/import
- No more `import.meta.env` without bundler
- Service worker — network-first strategy (no API caching)

### Backend
- No changes to backend code
- No changes to database schema
- All existing API endpoints preserved

---

## [3.1.0] - 2025-06-14

### Fixed
- Footer market icon not showing (SVG stroke-based styling)
- APK force close (replaced TWA with native WebView)
- APK not installable (added uses-sdk in manifest)
- Address bar still visible in TWA (replaced with WebView)

---

## [2.3.0] - 2025-06-13

### Added
- Enhanced native app meta tags
- Mobile-native SPA redesign
- PWA + TWA Android APK

---

## [1.0.0] - 2025-06-12

### Added
- Initial NCE marketplace
- Firebase authentication
- Commodity CRUD
- Property listings
- Buy request system with offers
