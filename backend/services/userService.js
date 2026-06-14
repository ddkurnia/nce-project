/**
 * User Service
 * Nusantara Commodity Exchange (NCE)
 *
 * Provides user management, dashboard statistics, profile operations,
 * verification, and admin functions.
 *
 * Exports both the spec-defined function names and controller-compatible
 * aliases (getUserProfile, updateUserRole).
 *
 * @module services/userService
 */

import { db, auth } from '../config/firebase.js';
import logger from '../utils/logger.js';

// ---------------------------------------------------------------------------
// Firestore collection references (lazy getters for dev-mode safety)
// ---------------------------------------------------------------------------

const getUsersCollection = () => {
  if (!db) throw new Error('Firebase Firestore is not initialized. Check your credentials.');
  return db.collection('users');
};

const getCommoditiesCollection = () => {
  if (!db) throw new Error('Firebase Firestore is not initialized. Check your credentials.');
  return db.collection('commodities');
};

const getBuyRequestsCollection = () => {
  if (!db) throw new Error('Firebase Firestore is not initialized. Check your credentials.');
  return db.collection('buyRequests');
};

const getPropertiesCollection = () => {
  if (!db) throw new Error('Firebase Firestore is not initialized. Check your credentials.');
  return db.collection('properties');
};

const getTransactionsCollection = () => {
  if (!db) throw new Error('Firebase Firestore is not initialized. Check your credentials.');
  return db.collection('transactions');
};

const getActivityCollection = () => {
  if (!db) throw new Error('Firebase Firestore is not initialized. Check your credentials.');
  return db.collection('activity');
};

// ---------------------------------------------------------------------------
// Dashboard Statistics
// ---------------------------------------------------------------------------

/**
 * Aggregate dashboard statistics.
 * When called with a UID, provides user-specific stats.
 * When called without, provides global admin stats.
 *
 * @param {string} [uid] - Optional Firebase UID for user-specific stats
 * @returns {Promise<object>} Aggregated statistics
 */
export async function getDashboardStats(uid = null) {
  try {
    if (!db) throw new Error('Firebase Firestore is not initialized. Check your credentials.');

    if (uid) {
      // User-specific dashboard stats
      const [
        commoditiesSnapshot,
        buyRequestsSnapshot,
        propertiesSnapshot,
        offersSnapshot,
      ] = await Promise.all([
        getCommoditiesCollection().where('sellerUid', '==', uid).get(),
        getBuyRequestsCollection().where('buyerUid', '==', uid).get(),
        getPropertiesCollection().where('ownerUid', '==', uid).get(),
        db.collectionGroup('offers').where('sellerUid', '==', uid).get(),
      ]);

      const stats = {
        myCommodities: commoditiesSnapshot.size,
        myBuyRequests: buyRequestsSnapshot.size,
        myProperties: propertiesSnapshot.size,
        myOffers: offersSnapshot.size,
      };

      logger.debug(`[UserService] User dashboard stats computed for UID: ${uid}`);
      return stats;
    }

    // Global admin dashboard stats
    const [
      usersSnapshot,
      commoditiesSnapshot,
      buyRequestsSnapshot,
      propertiesSnapshot,
      transactionsSnapshot,
    ] = await Promise.all([
      getUsersCollection().get(),
      getCommoditiesCollection().get(),
      getBuyRequestsCollection().get(),
      getPropertiesCollection().get(),
      getTransactionsCollection().get(),
    ]);

    let totalUsers = 0;
    let totalSellers = 0;
    let totalBuyers = 0;

    usersSnapshot.forEach((doc) => {
      const { role, active } = doc.data();
      if (active === false) return; // Skip soft-deleted users
      totalUsers += 1;
      if (role === 'seller' || role === 'exporter') {
        totalSellers += 1;
      }
      if (role === 'buyer') {
        totalBuyers += 1;
      }
    });

    const totalCommodities = commoditiesSnapshot.size;
    const totalBuyRequests = buyRequestsSnapshot.size;
    const totalProperties = propertiesSnapshot.size;
    const totalTransactions = transactionsSnapshot.size;

    const stats = {
      totalUsers,
      totalSellers,
      totalBuyers,
      totalCommodities,
      totalBuyRequests,
      totalProperties,
      totalTransactions,
    };

    logger.debug('[UserService] Global dashboard stats computed');
    return stats;
  } catch (error) {
    logger.error('[UserService] Failed to compute dashboard stats', error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// User Listing & Retrieval
// ---------------------------------------------------------------------------

/**
 * List all users with optional pagination and filters.
 *
 * @param {object} [filters={}] - Query filters
 * @param {string} [filters.search]   - Search by companyName, email, or displayName
 * @param {string} [filters.role]     - Filter by role
 * @param {string} [filters.verified] - Filter by verification status ('true'/'false')
 * @param {number} [filters.page]     - Page number (1-based)
 * @param {number} [filters.limit]    - Items per page
 * @param {string} [filters.sortBy]   - Sort field
 * @param {string} [filters.sortOrder] - 'asc' or 'desc'
 * @returns {Promise<{ data: Array, pagination: { page, limit, total, pages } }>}
 */
export async function getAllUsers(filters = {}) {
  try {
    const {
      search = null,
      role = null,
      verified = null,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    let query = getUsersCollection();

    // Apply role filter
    if (role) {
      query = query.where('role', '==', role.trim().toLowerCase());
    }

    // Apply verification filter
    if (verified === 'true') {
      query = query.where('verification', '!=', null);
    } else if (verified === 'false') {
      query = query.where('verification', '==', null);
    }

    // Apply ordering
    const direction = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';
    query = query.orderBy(sortBy || 'createdAt', direction);

    // Normalize pagination params
    const normalizedPage = Math.max(1, parseInt(page, 10) || 1);
    const normalizedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    // Get total count
    const countSnapshot = await query.get();
    const total = countSnapshot.size;
    const pages = Math.ceil(total / normalizedLimit) || 1;

    // Apply pagination
    const offset = (normalizedPage - 1) * normalizedLimit;
    const paginatedQuery = query.offset(offset).limit(normalizedLimit);

    const snapshot = await paginatedQuery.get();

    let data = [];
    snapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() });
    });

    // Firestore doesn't support full-text search natively.
    // If a search term was provided, filter results in-memory.
    if (search) {
      const term = search.trim().toLowerCase();
      data = data.filter((user) => {
        const companyName = (user.companyName || '').toLowerCase();
        const email = (user.email || '').toLowerCase();
        const displayName = (user.displayName || '').toLowerCase();
        return (
          companyName.includes(term) ||
          email.includes(term) ||
          displayName.includes(term)
        );
      });
    }

    logger.debug(`[UserService] getAllUsers returned ${data.length} users (page ${normalizedPage}/${pages})`);

    return {
      data,
      pagination: {
        page: normalizedPage,
        limit: normalizedLimit,
        total,
        pages,
      },
    };
  } catch (error) {
    logger.error('[UserService] Failed to fetch users', error);
    throw error;
  }
}

/**
 * Get a single user document by UID.
 *
 * @param {string} uid - Firebase Auth UID
 * @returns {Promise<object|null>} User document data or null
 */
export async function getUser(uid) {
  try {
    const docSnap = await getUsersCollection().doc(uid).get();

    if (!docSnap.exists) {
      return null;
    }

    return { id: docSnap.id, ...docSnap.data() };
  } catch (error) {
    logger.error(`[UserService] Failed to fetch user: ${uid}`, error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Profile Operations
// ---------------------------------------------------------------------------

/**
 * Update allowed fields on a user profile.
 * Only specific whitelisted fields may be updated.
 *
 * @param {string} uid  - Firebase Auth UID
 * @param {object} data - Fields to update
 * @returns {Promise<object>} Updated user document data
 */
export async function updateProfile(uid, data) {
  try {
    const allowedFields = [
      'displayName',
      'phone',
      'companyName',
      'company',
      'location',
      'address',
      'city',
      'province',
      'bio',
      'photoURL',
    ];

    const updateData = {};

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    updateData.updatedAt = new Date();

    if (Object.keys(updateData).length === 1) {
      // Only updatedAt was set – no actual fields provided
      throw new Error('At least one valid field must be provided for update');
    }

    await getUsersCollection().doc(uid).update(updateData);

    // Also update Firebase Auth display name and photo if provided
    const authUpdate = {};
    if (data.displayName) authUpdate.displayName = data.displayName;
    if (data.photoURL) authUpdate.photoURL = data.photoURL;

    if (Object.keys(authUpdate).length > 0) {
      try {
        if (!auth) throw new Error('Firebase Auth is not initialized.');
        await auth.updateUser(uid, authUpdate);
      } catch (authError) {
        logger.warn(`[UserService] Failed to sync Auth profile for UID: ${uid}`, authError);
        // Non-critical – continue
      }
    }

    logger.info(`[UserService] Profile updated: ${uid}`);

    const updatedDoc = await getUsersCollection().doc(uid).get();
    return { id: updatedDoc.id, ...updatedDoc.data() };
  } catch (error) {
    logger.error(`[UserService] Failed to update profile: ${uid}`, error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Verification & Role Management
// ---------------------------------------------------------------------------

/**
 * Add a verification badge to a user.
 *
 * @param {string} uid  - Firebase Auth UID
 * @param {string} type - Verification type ('supplier', 'buyer', 'exporter')
 * @returns {Promise<object>} Updated user document data
 */
export async function verifyUser(uid, type) {
  try {
    const validTypes = ['supplier', 'buyer', 'exporter'];

    if (!validTypes.includes(type)) {
      throw new Error(`Invalid verification type: ${type}. Must be one of: ${validTypes.join(', ')}`);
    }

    const now = new Date();
    const verification = {
      type,
      verifiedAt: now,
      verifiedBy: 'admin', // In a real app, this would be the admin's UID
    };

    await getUsersCollection().doc(uid).update({
      verification,
      updatedAt: now,
    });

    // Also set custom claims for verified status
    try {
      if (!auth) throw new Error('Firebase Auth is not initialized.');
      await auth.setCustomUserClaims(uid, { verified: true, verificationType: type });
    } catch (authError) {
      logger.warn(`[UserService] Failed to set verification claims for UID: ${uid}`, authError);
    }

    logger.info(`[UserService] User verified: ${uid} as ${type}`);

    const updatedDoc = await getUsersCollection().doc(uid).get();
    return { id: updatedDoc.id, ...updatedDoc.data() };
  } catch (error) {
    logger.error(`[UserService] Failed to verify user: ${uid}`, error);
    throw error;
  }
}

/**
 * Update a user's role.
 *
 * @param {string} uid  - Firebase Auth UID
 * @param {string} role - New role ('admin', 'seller', 'buyer', 'exporter')
 * @returns {Promise<object>} Updated user document data
 */
export async function updateRole(uid, role) {
  try {
    const validRoles = ['admin', 'seller', 'buyer', 'exporter'];

    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role: ${role}. Must be one of: ${validRoles.join(', ')}`);
    }

    const now = new Date();

    await getUsersCollection().doc(uid).update({
      role,
      updatedAt: now,
    });

    // Also set custom claims in Firebase Auth for role-based access
    try {
      if (!auth) throw new Error('Firebase Auth is not initialized.');
      await auth.setCustomUserClaims(uid, { role });
    } catch (authError) {
      logger.warn(`[UserService] Failed to set custom claims for UID: ${uid}`, authError);
      // Non-critical – Firestore is the source of truth
    }

    logger.info(`[UserService] User role updated: ${uid} → ${role}`);

    const updatedDoc = await getUsersCollection().doc(uid).get();
    return { id: updatedDoc.id, ...updatedDoc.data() };
  } catch (error) {
    logger.error(`[UserService] Failed to update role for: ${uid}`, error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// User Deletion (Soft Delete)
// ---------------------------------------------------------------------------

/**
 * Soft delete a user account by setting active: false.
 * Does not remove the Firestore document or the Firebase Auth account.
 *
 * @param {string} uid - Firebase Auth UID
 * @returns {Promise<object>} Updated user document data
 */
export async function deleteUser(uid) {
  try {
    const now = new Date();

    await getUsersCollection().doc(uid).update({
      active: false,
      deactivatedAt: now,
      updatedAt: now,
    });

    // Disable the Firebase Auth account as well
    try {
      if (!auth) throw new Error('Firebase Auth is not initialized.');
      await auth.updateUser(uid, { disabled: true });
    } catch (authError) {
      logger.warn(`[UserService] Failed to disable Auth account for UID: ${uid}`, authError);
      // Non-critical – Firestore is the primary record
    }

    logger.info(`[UserService] User soft-deleted: ${uid}`);

    const updatedDoc = await getUsersCollection().doc(uid).get();
    return { id: updatedDoc.id, ...updatedDoc.data() };
  } catch (error) {
    logger.error(`[UserService] Failed to delete user: ${uid}`, error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Activity Tracking
// ---------------------------------------------------------------------------

/**
 * Get recent activity for a specific user.
 *
 * @param {string} uid       - Firebase Auth UID
 * @param {number} [limit=20] - Maximum number of activity records to return
 * @returns {Promise<Array<object>>}
 */
export async function getRecentActivity(uid, limit = 20) {
  try {
    const maxLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const snapshot = await getActivityCollection()
      .where('uid', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(maxLimit)
      .get();

    const data = [];
    snapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() });
    });

    logger.debug(`[UserService] getRecentActivity returned ${data.length} records for UID: ${uid}`);

    return data;
  } catch (error) {
    logger.error(`[UserService] Failed to fetch recent activity for: ${uid}`, error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Controller-Compatible Aliases
// ---------------------------------------------------------------------------

/**
 * Alias for getUser() – used by userController.
 *
 * @param {string} uid
 * @returns {Promise<object|null>}
 */
export async function getUserProfile(uid) {
  return getUser(uid);
}

/**
 * Alias for updateRole() – used by userController.
 *
 * @param {string} uid
 * @param {string} role
 * @returns {Promise<object>}
 */
export async function updateUserRole(uid, role) {
  return updateRole(uid, role);
}
