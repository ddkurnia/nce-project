# NCE Changelog — Digital Trading Floor Restructuring

All notable changes to the NCE (Nusantara Commodity Exchange) project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased] — Digital Trading Floor Restructuring

### Phase 1: Audit — 2026-06-15
- **Added**: `AUDIT_REPORT.md` — comprehensive audit of entire frontend codebase
- **Identified**: 23 files exceeding 300-line limit (3 exceeding 1000 lines)
- **Identified**: 12+ duplicated functions across components
- **Identified**: ~1,700 lines of CSS injected at runtime via JS
- **Identified**: 2 divergent codebases (`frontend/` multi-page vs `docs/` SPA)
- **Identified**: 85 dead files in `twa-project/` and `android/` directories (964KB)
- **Identified**: 4 competing navigation systems
- **Identified**: Security concerns (XSS in templates, token in localStorage, no CSP)
- **Created**: Feature branch `feature/digital-trading-floor`
- **Created**: `CHANGELOG.md`

---

## [4.0.0] — 2026-06-15

### Changed
- Replaced TWA with native Android WebView app
- Full-screen immersive mode WebView Activity
- Remote URL loading with local fallback
- App icon updated to use nce.png
- APK size reduced from 3.6MB to 1.7MB (removed TWA bloat)

### Fixed
- Force close issue caused by TWA library crash
- App icon not displaying nce.png correctly

---

## [3.0.0] — 2026-06-14

### Added
- Dark fintech theme with emerald/cyan accents
- Dashboard page with stats and charts
- Commodities listing page
- Buy requests page
- Property exchange page
- Profile page
- Firebase Authentication integration
- Backend API service layer
- PWA support with manifest and service worker
- Mobile-responsive design with bottom navigation

---

## [2.0.0] — 2026-06-13

### Added
- SPA prototype with hash-based router (`docs/`)
- Modular CSS (variables/base/components/views)
- View components (home, market, rfq, messages, profile)
- State management (StateManager class)
- Simulated market data for commodities
- Market pulse ticker component
- Market board component
- Toast notification component

---

## [1.0.0] — 2026-06-12

### Added
- Initial project setup
- Basic HTML/CSS/JS structure
- Firebase configuration
- GitHub Pages deployment
