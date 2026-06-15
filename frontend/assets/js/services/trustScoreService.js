/**
 * Trust Score Service — Dynamic trust score engine
 * Calculates score from verification, transactions, ratings, activity, response time
 */
import { get } from '../api.js';
import { isAuthenticated, getStoredUser } from '../auth.js';

// Scoring weights for trust score components
const TRUST_WEIGHTS = {
  verification: 0.30,   // Account verification status
  transactions: 0.25,   // Completed transaction history
  ratings: 0.20,        // Average rating from partners
  activity: 0.15,       // Platform activity level
  responseTime: 0.10,   // Response speed to messages/RFQs
};

/**
 * Get trust score data for a user
 * Tries API first, falls back to local calculation
 * @param {string} [userId] - User ID (defaults to current user)
 * @returns {Promise<TrustScoreData>}
 */
export async function getTrustScoreData(userId) {
  const uid = userId || getStoredUser()?.uid;

  if (isAuthenticated() && uid) {
    try {
      const res = await get(`/users/${uid}/trust-score`);
      if (res.data || res) {
        return normalizeTrustData(res.data || res);
      }
    } catch { /* fall through to local */ }
  }

  return calculateLocalTrustScore(uid);
}

/**
 * Calculate trust score locally from available data
 */
function calculateLocalTrustScore(userId) {
  const user = getStoredUser();

  // Verification status (from user profile or mock)
  const verification = getVerificationStatus(user);
  const verificationScore = calcVerificationScore(verification);

  // Transaction history (mock for now)
  const transactions = {
    total: 8,
    completed: 7,
    cancelled: 1,
    volume: 12.5, // tons
  };
  const transactionScore = calcTransactionScore(transactions);

  // Ratings (mock)
  const ratings = { average: 4.8, count: 15 };
  const ratingScore = calcRatingScore(ratings);

  // Activity (mock)
  const activity = {
    daysActive: 90,
    rfqCreated: 12,
    listingsActive: 5,
    lastActive: Date.now() - 86400000, // 1 day ago
  };
  const activityScore = calcActivityScore(activity);

  // Response time (mock)
  const responseTime = { avgHours: 1.5, withinHour: 0.7 };
  const responseScore = calcResponseTimeScore(responseTime);

  // Calculate weighted total
  const totalScore = Math.round(
    verificationScore * TRUST_WEIGHTS.verification +
    transactionScore * TRUST_WEIGHTS.transactions +
    ratingScore * TRUST_WEIGHTS.ratings +
    activityScore * TRUST_WEIGHTS.activity +
    responseScore * TRUST_WEIGHTS.responseTime
  );

  return {
    score: Math.min(100, Math.max(0, totalScore)),
    breakdown: {
      verification: { score: verificationScore, weight: TRUST_WEIGHTS.verification, details: verification },
      transactions: { score: transactionScore, weight: TRUST_WEIGHTS.transactions, details: transactions },
      ratings: { score: ratingScore, weight: TRUST_WEIGHTS.ratings, details: ratings },
      activity: { score: activityScore, weight: TRUST_WEIGHTS.activity, details: activity },
      responseTime: { score: responseScore, weight: TRUST_WEIGHTS.responseTime, details: responseTime },
    },
    verification,
  };
}

/**
 * Get verification status for user
 */
function getVerificationStatus(user) {
  // In production, this comes from user.profile.verification
  return {
    email: true,
    phone: true,
    identity: false,  // KTP
    business: false,  // NIB/SIUP
  };
}

/**
 * Verification score: each step = 25 points
 */
function calcVerificationStatus(verification) {
  const steps = Object.values(verification);
  const completed = steps.filter(Boolean).length;
  return (completed / steps.length) * 100;
}

// Alias used in calculateLocalTrustScore
const calcVerificationScore = calcVerificationStatus;

/**
 * Transaction score based on completion rate and volume
 */
function calcTransactionScore(transactions) {
  if (!transactions.total) return 0;
  const completionRate = transactions.completed / transactions.total;
  const volumeBonus = Math.min(20, transactions.volume * 2); // 2 pts per ton, max 20
  return Math.round(completionRate * 80 + volumeBonus);
}

/**
 * Rating score: 5-star scale → 0-100
 */
function calcRatingScore(ratings) {
  if (!ratings.count) return 0;
  // Base score from average (5* = 100, 1* = 20)
  const baseScore = (ratings.average / 5) * 80;
  // Confidence bonus from number of ratings
  const confidenceBonus = Math.min(20, ratings.count * 1.5);
  return Math.round(baseScore + confidenceBonus);
}

/**
 * Activity score based on engagement
 */
function calcActivityScore(activity) {
  if (!activity.daysActive) return 0;
  const daysScore = Math.min(40, activity.daysActive * 0.5); // 0.5 pts per day, max 40
  const rfqScore = Math.min(30, activity.rfqCreated * 3);    // 3 pts per RFQ, max 30
  const listScore = Math.min(30, activity.listingsActive * 6); // 6 pts per listing, max 30
  return Math.round(daysScore + rfqScore + listScore);
}

/**
 * Response time score
 */
function calcResponseTimeScore(responseTime) {
  if (!responseTime.avgHours) return 50; // Default moderate
  const avgH = responseTime.avgHours;
  if (avgH <= 0.5) return 100;  // Under 30 min
  if (avgH <= 1) return 90;     // Under 1 hour
  if (avgH <= 3) return 75;     // Under 3 hours
  if (avgH <= 6) return 60;     // Under 6 hours
  if (avgH <= 24) return 40;    // Under 1 day
  return 20;                     // Over 1 day
}

function normalizeTrustData(raw) {
  return {
    score: raw.score ?? 0,
    breakdown: raw.breakdown || {},
    verification: raw.verification || getVerificationStatus(null),
  };
}
