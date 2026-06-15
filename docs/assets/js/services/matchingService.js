/**
 * Matching Service — AI-powered business matching
 * Client-side scoring algorithm with API integration
 */
import { get, post } from '../api.js';
import { isAuthenticated, getStoredUser } from '../auth.js';
import { getCommodityLabel } from '../constants/commodities.js';

// Scoring weights for match algorithm
const WEIGHTS = {
  commodity: 0.30,    // Same commodity type match
  price: 0.20,        // Price compatibility (within range)
  volume: 0.15,       // Volume compatibility
  location: 0.15,     // Geographic proximity
  trust: 0.10,        // Trust score bonus
  responseTime: 0.10, // Response speed bonus
};

let cachedMatches = [];
let userPreferences = null;

/**
 * Get business matches for current user
 * Tries API first, falls back to client-side algorithm
 */
export async function getMatches(limit = 10) {
  if (!isAuthenticated()) {
    return runLocalAlgorithm(limit);
  }

  try {
    const res = await get(`/matching?limit=${limit}`);
    cachedMatches = (res.data || res || []).map(normalizeMatch);
    return cachedMatches;
  } catch {
    return runLocalAlgorithm(limit);
  }
}

/**
 * Run client-side matching algorithm using commodity + user data
 */
function runLocalAlgorithm(limit) {
  const user = getStoredUser();
  const candidates = generateCandidatePool();

  const scored = candidates.map(candidate => {
    const scores = {
      commodity: calcCommodityScore(candidate),
      price: calcPriceScore(candidate),
      volume: calcVolumeScore(candidate),
      location: calcLocationScore(candidate),
      trust: calcTrustScore(candidate),
      responseTime: calcResponseScore(candidate),
    };

    const totalScore = Object.entries(WEIGHTS).reduce(
      (sum, [key, weight]) => sum + (scores[key] * weight), 0
    );

    return {
      ...candidate,
      matchScore: Math.round(totalScore),
      _scores: scores,
    };
  });

  cachedMatches = scored
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
  return cachedMatches;
}

/**
 * Calculate commodity type similarity score (0-100)
 */
function calcCommodityScore(candidate) {
  // Prefer matches with commodities the user has RFQs for
  const userCommodities = ['sawit', 'kopi', 'karet']; // Would come from user data
  if (userCommodities.includes(candidate.commodity)) return 100;
  // Partial match via category
  const categories = { palm: ['sawit'], beverage: ['kopi', 'teh'], rubber: ['karet'], spice: ['lada', 'cengkeh'] };
  for (const cat of Object.values(categories)) {
    if (cat.includes(candidate.commodity) && cat.some(c => userCommodities.includes(c))) return 60;
  }
  return 20;
}

/**
 * Calculate price compatibility score (0-100)
 */
function calcPriceScore(candidate) {
  // Higher score for competitive pricing
  if (candidate.price <= 0) return 0;
  // Mock: assume user's target price range is ±15% of candidate price
  const competitiveness = candidate.rating >= 4.5 ? 85 : candidate.rating >= 4.0 ? 70 : 50;
  return competitiveness;
}

/**
 * Calculate volume compatibility score (0-100)
 */
function calcVolumeScore(candidate) {
  const userTargetVol = 3000; // Would come from user RFQ data
  const ratio = candidate.volume / userTargetVol;
  if (ratio >= 0.8 && ratio <= 2.0) return 100; // Within 2x range
  if (ratio >= 0.5 && ratio <= 3.0) return 70;
  return 40;
}

/**
 * Calculate geographic proximity score (0-100)
 */
function calcLocationScore(candidate) {
  const userLocation = 'Jakarta'; // Would come from user profile
  const sameIsland = {
    Sumatra: ['Medan', 'Palembang', 'Padang', 'Lampung'],
    Java: ['Jakarta', 'Surabaya', 'Bandung', 'Semarang', 'Yogyakarta'],
    Kalimantan: ['Banjarmasin', 'Samarinda', 'Pontianak'],
    Sulawesi: ['Makassar', 'Manado', 'Palu'],
    Eastern: ['Denpasar', 'Kupang', 'Ambon', 'Jayapura'],
  };

  const userIsland = Object.entries(sameIsland).find(
    ([, cities]) => cities.includes(userLocation)
  )?.[0];

  if (candidate.location === userLocation) return 100;
  if (userIsland && sameIsland[userIsland]?.includes(candidate.location)) return 80;
  return 40;
}

/**
 * Calculate trust score bonus (0-100)
 */
function calcTrustScore(candidate) {
  const score = candidate.trustScore || 50;
  return Math.min(100, score);
}

/**
 * Calculate response time score (0-100)
 */
function calcResponseScore(candidate) {
  const rt = candidate.responseTime || '';
  if (rt.includes('30 menit') || rt.includes('< 1 jam')) return 100;
  if (rt.includes('< 2 jam') || rt.includes('< 3 jam')) return 80;
  if (rt.includes('< 6 jam')) return 60;
  return 30;
}

/**
 * Submit match feedback (accept/reject) for learning
 */
export async function submitMatchFeedback(matchId, action) {
  try {
    await post('/matching/feedback', { matchId, action });
  } catch { /* offline */ }
}

/**
 * Get cached matches without re-fetching
 */
export function getCachedMatches() {
  return [...cachedMatches];
}

/**
 * Generate candidate pool (mock data for demo)
 */
function generateCandidatePool() {
  return [
    { id: 'm1', type: 'seller', name: 'PT Sawit Jaya Mandiri', commodity: 'sawit', volume: 5000, price: 12200, location: 'Medan', rating: 4.8, trustScore: 88, trustLevel: 'gold', verified: true, responseTime: '< 1 jam' },
    { id: 'm2', type: 'seller', name: 'CV Kopi Nusantara', commodity: 'kopi', volume: 2000, price: 82000, location: 'Bandung', rating: 4.5, trustScore: 75, trustLevel: 'silver', verified: true, responseTime: '< 3 jam' },
    { id: 'm3', type: 'buyer', name: 'PT Karet Indo Global', commodity: 'karet', volume: 3000, price: 16200, location: 'Palembang', rating: 4.6, trustScore: 72, trustLevel: 'silver', verified: true, responseTime: '< 2 jam' },
    { id: 'm4', type: 'seller', name: 'UD Pinang Sejahtera', commodity: 'pinang', volume: 1500, price: 21500, location: 'Makassar', rating: 4.2, trustScore: 45, trustLevel: 'bronze', verified: false, responseTime: '< 6 jam' },
    { id: 'm5', type: 'buyer', name: 'PT Kakao Sulawesi', commodity: 'kakao', volume: 4000, price: 43500, location: 'Manado', rating: 4.9, trustScore: 92, trustLevel: 'gold', verified: true, responseTime: '< 30 menit' },
  ];
}

function normalizeMatch(raw) {
  return {
    id: raw.id || `m${Date.now()}`,
    type: raw.type || 'seller',
    name: raw.name || 'Unknown',
    commodity: raw.commodity || 'other',
    volume: raw.volume || 0,
    price: raw.price || 0,
    location: raw.location || '',
    rating: raw.rating || 0,
    trustScore: raw.trustScore || 50,
    trustLevel: raw.trustLevel || 'new',
    verified: !!raw.verified,
    responseTime: raw.responseTime || '',
    matchScore: raw.matchScore || 0,
  };
}
