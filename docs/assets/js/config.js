/* ============================================================================
 * NCE — Configuration
 * ============================================================================ */

// Detect environment for API base URL
const isGitHubPages = window.location.hostname.includes('github.io');
const API_BASE = isGitHubPages
  ? 'https://nce-api-production.up.railway.app/api'  // Update with actual backend URL
  : '/api';  // Local dev uses Next.js proxy

const Config = {
  API_BASE,

  // App info
  APP_NAME: 'NCE',
  APP_FULL_NAME: 'Nusantara Commodity Exchange',
  APP_VERSION: '2.0.0',

  // Auth storage keys
  AUTH_USER_KEY: 'nce_user',
  AUTH_TOKEN_KEY: 'nce_token',

  // Pagination defaults
  DEFAULT_PAGE_SIZE: 20,

  // Simulated market data for commodities
  COMMODITIES: [
    { id: 'cpo', name: 'Kelapa Sawit CPO', price: 12500, unit: 'kg', change: 2.3 },
    { id: 'arabica', name: 'Kopi Arabika', price: 95000, unit: 'kg', change: -1.5 },
    { id: 'cocoa', name: 'Kakao', price: 38000, unit: 'kg', change: 4.1 },
    { id: 'betelnut', name: 'Pinang', price: 22500, unit: 'kg', change: -0.8 },
    { id: 'coconut', name: 'Kelapa', price: 8500, unit: 'kg', change: 1.2 },
    { id: 'pepper', name: 'Lada Hitam', price: 65000, unit: 'kg', change: 3.7 },
    { id: 'clove', name: 'Cengkeh', price: 120000, unit: 'kg', change: -2.1 },
    { id: 'nutmeg', name: 'Pala', price: 85000, unit: 'kg', change: 0.9 },
    { id: 'tobacco', name: 'Tembakau', price: 45000, unit: 'kg', change: -3.2 },
    { id: 'rubber', name: 'Karet', price: 15000, unit: 'kg', change: 1.8 }
  ],

  // Simulated companies
  COMPANIES: [
    { id: 1, name: 'PT Sawit Nusantara', location: 'Riau', trust: 94, verified: true },
    { id: 2, name: 'CV Kopi Aceh Mandiri', location: 'Aceh', trust: 91, verified: true },
    { id: 3, name: 'PT Kakao Sulawesi', location: 'Sulawesi Barat', trust: 88, verified: true },
    { id: 4, name: 'UD Lada Maluku', location: 'Maluku', trust: 85, verified: false },
    { id: 5, name: 'PT Cengkeh Ternate', location: 'Ternate', trust: 92, verified: true },
    { id: 6, name: 'CV Karet Kalimantan', location: 'Kalimantan Barat', trust: 87, verified: false }
  ],

  // Commodity types for filtering
  COMMODITY_TYPES: [
    'All', 'Sawit', 'Kopi', 'Kakao', 'Rempah', 'Kelapa', 'Karet', 'Tembakau'
  ],

  // Routes
  ROUTES: {
    HOME: 'home',
    MARKET: 'market',
    RFQ: 'rfq',
    MESSAGES: 'messages',
    PROFILE: 'profile'
  },

  // Default route
  DEFAULT_ROUTE: 'home'
};

export default Config;
