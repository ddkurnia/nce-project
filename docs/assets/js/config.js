/* ============================================================================
 * NCE — Configuration
 * Digital Trading Floor — Enhanced market data
 * ============================================================================ */

// Detect environment for API base URL
const isGitHubPages = window.location.hostname.includes('github.io');
const API_BASE = isGitHubPages
  ? 'https://nce-api-production.up.railway.app/api'
  : '/api';

const Config = {
  API_BASE,

  // App info
  APP_NAME: 'NCE',
  APP_FULL_NAME: 'Nusantara Commodity Exchange',
  APP_TAGLINE: 'Indonesia\'s Digital Trading Floor',
  APP_VERSION: '3.0.0',

  // Auth storage keys
  AUTH_USER_KEY: 'nce_user',
  AUTH_TOKEN_KEY: 'nce_token',

  // Pagination defaults
  DEFAULT_PAGE_SIZE: 20,

  // Market simulation config
  MARKET_REFRESH_INTERVAL: 15000,  // 15 seconds
  TICKER_REFRESH_INTERVAL: 30000,  // 30 seconds
  SPARKLINE_POINTS: 20,

  // Commodities with realistic base prices (IDR/kg)
  COMMODITIES: [
    { id: 'cpo', name: 'Kelapa Sawit CPO', code: 'CPO', price: 14250, unit: 'kg', change: 2.3, type: 'Sawit', region: 'Riau' },
    { id: 'palm-oil', name: 'Minyak Sawit', code: 'PLMO', price: 16800, unit: 'kg', change: 1.8, type: 'Sawit', region: 'Kalimantan' },
    { id: 'arabica', name: 'Kopi Arabika', code: 'ARBC', price: 95000, unit: 'kg', change: -1.5, type: 'Kopi', region: 'Aceh' },
    { id: 'robusta', name: 'Kopi Robusta', code: 'RBST', price: 52000, unit: 'kg', change: 0.9, type: 'Kopi', region: 'Lampung' },
    { id: 'cocoa', name: 'Kakao', code: 'COCO', price: 38500, unit: 'kg', change: 4.1, type: 'Kakao', region: 'Sulawesi' },
    { id: 'betelnut', name: 'Pinang', code: 'BTLN', price: 22500, unit: 'kg', change: -0.8, type: 'Rempah', region: 'Maluku' },
    { id: 'coconut', name: 'Kelapa', code: 'CCNT', price: 8500, unit: 'kg', change: 1.2, type: 'Kelapa', region: 'Sulawesi' },
    { id: 'pepper', name: 'Lada Hitam', code: 'PPPR', price: 65000, unit: 'kg', change: 3.7, type: 'Rempah', region: 'Lampung' },
    { id: 'clove', name: 'Cengkeh', code: 'CLVE', price: 120000, unit: 'kg', change: -2.1, type: 'Rempah', region: 'Ternate' },
    { id: 'nutmeg', name: 'Pala', code: 'NTMG', price: 85000, unit: 'kg', change: 0.9, type: 'Rempah', region: 'Maluku' },
    { id: 'tobacco', name: 'Tembakau', code: 'TBCC', price: 45000, unit: 'kg', change: -3.2, type: 'Tembakau', region: 'Jawa Timur' },
    { id: 'rubber', name: 'Karet', code: 'RBRR', price: 15000, unit: 'kg', change: 1.8, type: 'Karet', region: 'Kalimantan' },
    { id: 'cinnamon', name: 'Kayu Manis', code: 'CNMN', price: 75000, unit: 'kg', change: 2.5, type: 'Rempah', region: 'Kerinci' },
    { id: 'ginger', name: 'Jahe', code: 'JHJE', price: 18000, unit: 'kg', change: -1.2, type: 'Rempah', region: 'Jawa Barat' },
  ],

  // Simulated companies
  COMPANIES: [
    { id: 1, name: 'PT Sawit Nusantara', location: 'Riau', trust: 94, verified: true, type: 'supplier', commodities: ['CPO', 'PLMO'] },
    { id: 2, name: 'CV Kopi Aceh Mandiri', location: 'Aceh', trust: 91, verified: true, type: 'supplier', commodities: ['ARBC'] },
    { id: 3, name: 'PT Kakao Sulawesi', location: 'Sulawesi Barat', trust: 88, verified: true, type: 'supplier', commodities: ['COCO'] },
    { id: 4, name: 'UD Lada Maluku', location: 'Maluku', trust: 85, verified: false, type: 'supplier', commodities: ['PPPR', 'BTLN'] },
    { id: 5, name: 'PT Cengkeh Ternate', location: 'Ternate', trust: 92, verified: true, type: 'supplier', commodities: ['CLVE', 'NTMG'] },
    { id: 6, name: 'CV Karet Kalimantan', location: 'Kalimantan Barat', trust: 87, verified: false, type: 'supplier', commodities: ['RBRR'] },
    { id: 7, name: 'PT Indo Palm Resources', location: 'Kalimantan Timur', trust: 90, verified: true, type: 'buyer', commodities: ['CPO'] },
    { id: 8, name: 'CV Tembakau Madura', location: 'Jawa Timur', trust: 83, verified: true, type: 'supplier', commodities: ['TBCC'] },
  ],

  // Chat contacts (simulated)
  CHAT_CONTACTS: [
    { id: 1, name: 'PT Sawit Nusantara', initials: 'PS', lastMessage: 'Mohon konfirmasi harga CPO untuk pengiriman minggu depan', time: '10m', unread: 2, color: '#D4AF37' },
    { id: 2, name: 'CV Kopi Aceh Mandiri', initials: 'KA', lastMessage: 'Kami bisa supply 5 ton arabika grade A', time: '1h', unread: 0, color: '#22C55E' },
    { id: 3, name: 'PT Kakao Sulawesi', initials: 'KS', lastMessage: 'Sample sudah dikirim via ekspedisi', time: '3h', unread: 1, color: '#3B82F6' },
    { id: 4, name: 'UD Lada Maluku', initials: 'LM', lastMessage: 'Terima kasih atas ordernya', time: '1d', unread: 0, color: '#F59E0B' },
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
