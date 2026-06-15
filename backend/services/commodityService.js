/**
 * Commodity Service
 * Nusantara Commodity Exchange (NCE)
 *
 * Provides full CRUD operations for commodity listings, including
 * filtering, search, pagination, aggregation, and seller join.
 *
 * Exports both the spec-defined function names (getAll, getById, create, etc.)
 * and controller-compatible aliases (getAllCommodities, getCommodityById,
 * createCommodity, updateCommodity, uploadCommodityImage).
 *
 * @module services/commodityService
 */

import { db } from '../config/firebase.js';
import logger from '../utils/logger.js';

// ---------------------------------------------------------------------------
// Firestore collection references (lazy getters for dev-mode safety)
// ---------------------------------------------------------------------------

const getCommoditiesCollection = () => {
  if (!db) throw new Error('Firebase Firestore is not initialized. Check your credentials.');
  return db.collection('commodities');
};

const getUsersCollection = () => {
  if (!db) throw new Error('Firebase Firestore is not initialized. Check your credentials.');
  return db.collection('users');
};

// ---------------------------------------------------------------------------
// Helper – Pagination & Query Builder
// ---------------------------------------------------------------------------

/**
 * Build a Firestore query from filter parameters.
 *
 * @param {object} filters
 * @param {string} [filters.type]      - Commodity type filter
 * @param {string} [filters.search]    - Search term for name/description
 * @param {number} [filters.page]      - Page number (1-based)
 * @param {number} [filters.limit]     - Items per page
 * @param {string} [filters.sortBy]    - Sort field name
 * @param {string} [filters.sortOrder] - 'asc' or 'desc'
 * @param {string} [filters.featured]  - 'true' for featured only
 * @returns {{ query: Query, page: number, limit: number, sortBy: string, sortOrder: string }}
 */
function buildQuery(filters = {}) {
  const {
    type = null,
    search = null,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    featured = null,
  } = filters;

  let query = getCommoditiesCollection();

  // Apply type filter
  if (type) {
    query = query.where('type', '==', type.trim().toLowerCase());
  }

  // Apply featured filter
  if (featured === 'true' || featured === true) {
    query = query.where('featured', '==', true);
  }

  // Firestore doesn't support full-text search natively.
  // We apply a prefix match on the name field when a search term is given.
  if (search) {
    const term = search.trim();
    // Prefix search: >= term and < term + unicode end character
    query = query
      .where('name', '>=', term)
      .where('name', '<=', term + '\uf8ff');
  }

  // Apply sorting
  const direction = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';
  query = query.orderBy(sortBy, direction);

  return {
    query,
    page: Math.max(1, parseInt(page, 10) || 1),
    limit: Math.min(100, Math.max(1, parseInt(limit, 10) || 20)),
    sortBy,
    sortOrder: direction,
  };
}

// ---------------------------------------------------------------------------
// Service Functions (per spec)
// ---------------------------------------------------------------------------

/**
 * Retrieve a paginated, filterable list of commodities.
 *
 * @param {object} [filters={}] - Query filters (type, search, page, limit, sortBy, sortOrder, featured)
 * @returns {Promise<{ data: Array, pagination: { page, limit, total, pages } }>}
 */
export async function getAll(filters = {}) {
  try {
    const { query, page, limit } = buildQuery(filters);

    // Get total count for pagination metadata
    const countSnapshot = await query.get();
    const total = countSnapshot.size;
    const pages = Math.ceil(total / limit) || 1;

    // Apply pagination offsets
    const offset = (page - 1) * limit;
    const paginatedQuery = query.offset(offset).limit(limit);

    const snapshot = await paginatedQuery.get();

    const data = [];
    snapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() });
    });

    logger.debug(`[CommodityService] getAll returned ${data.length} commodities (page ${page}/${pages})`);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    };
  } catch (error) {
    logger.error('[CommodityService] Failed to fetch commodities', error);
    throw error;
  }
}

/**
 * Retrieve a single commodity by ID, with seller user data joined.
 *
 * @param {string} id - Commodity document ID
 * @returns {Promise<object|null>} Commodity data with seller info, or null
 */
export async function getById(id) {
  try {
    const docSnap = await getCommoditiesCollection().doc(id).get();

    if (!docSnap.exists) {
      return null;
    }

    const commodity = { id: docSnap.id, ...docSnap.data() };

    // Join seller data if sellerUid is present
    const sellerUid = commodity.sellerUid || commodity.sellerId;
    if (sellerUid) {
      try {
        const sellerSnap = await getUsersCollection().doc(sellerUid).get();
        if (sellerSnap.exists) {
          const sellerData = sellerSnap.data();
          commodity.seller = {
            uid: sellerSnap.id,
            displayName: sellerData.displayName || '',
            companyName: sellerData.companyName || '',
            photoURL: sellerData.photoURL || '',
            location: sellerData.location || '',
            verification: sellerData.verification || null,
          };
        } else {
          commodity.seller = null;
        }
      } catch (joinError) {
        logger.warn(`[CommodityService] Failed to join seller data for UID: ${sellerUid}`, joinError);
        commodity.seller = null;
      }
    }

    logger.debug(`[CommodityService] getById: ${id}`);
    return commodity;
  } catch (error) {
    logger.error(`[CommodityService] Failed to fetch commodity: ${id}`, error);
    throw error;
  }
}

/**
 * Create a new commodity listing.
 *
 * @param {object} data - Commodity data
 * @param {string} [sellerUid] - Seller's Firebase UID (optional, can be in data)
 * @returns {Promise<object>} Created commodity with id
 */
export async function create(data, sellerUid = null) {
  try {
    const now = new Date();

    const commodityDoc = {
      name: data.name || '',
      type: (data.type || '').toLowerCase(),
      price: Number(data.price) || 0,
      volume: Number(data.volume || data.stock) || 0,
      stock: Number(data.stock || data.volume) || 0,
      unit: data.unit || 'kg',
      location: data.location || '',
      description: data.description || '',
      images: Array.isArray(data.images) ? data.images : [],
      sellerUid: sellerUid || data.sellerUid || '',
      sellerId: sellerUid || data.sellerId || data.sellerUid || '',
      featured: data.featured || false,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await getCommoditiesCollection().add(commodityDoc);

    logger.info(`[CommodityService] Commodity created: ${docRef.id}`);

    return { id: docRef.id, ...commodityDoc };
  } catch (error) {
    logger.error('[CommodityService] Failed to create commodity', error);
    throw error;
  }
}

/**
 * Update an existing commodity listing.
 *
 * @param {string} id   - Commodity document ID
 * @param {object} data - Fields to update
 * @returns {Promise<object>} Updated commodity data
 */
export async function update(id, data) {
  try {
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    // Remove protected fields
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.sellerUid;
    delete updateData.sellerId;

    // Normalize type if provided
    if (updateData.type) {
      updateData.type = updateData.type.toLowerCase();
    }

    // Ensure numeric fields stay numeric
    if (updateData.price !== undefined) {
      updateData.price = Number(updateData.price);
    }
    if (updateData.volume !== undefined) {
      updateData.volume = Number(updateData.volume);
      updateData.stock = updateData.volume; // Keep both in sync
    }
    if (updateData.stock !== undefined) {
      updateData.stock = Number(updateData.stock);
      updateData.volume = updateData.stock; // Keep both in sync
    }

    await getCommoditiesCollection().doc(id).update(updateData);

    logger.info(`[CommodityService] Commodity updated: ${id}`);

    const updatedDoc = await getCommoditiesCollection().doc(id).get();
    return { id: updatedDoc.id, ...updatedDoc.data() };
  } catch (error) {
    logger.error(`[CommodityService] Failed to update commodity: ${id}`, error);
    throw error;
  }
}

/**
 * Delete a commodity listing permanently.
 *
 * @param {string} id - Commodity document ID
 * @returns {Promise<void>}
 */
export async function deleteCommodity(id) {
  try {
    await getCommoditiesCollection().doc(id).delete();
    logger.info(`[CommodityService] Commodity deleted: ${id}`);
  } catch (error) {
    logger.error(`[CommodityService] Failed to delete commodity: ${id}`, error);
    throw error;
  }
}

/**
 * Aggregate commodity count by type.
 * Returns an array of { type, count } objects.
 *
 * @returns {Promise<Array<{ type: string, count: number }>>}
 */
export async function countByType() {
  try {
    const snapshot = await getCommoditiesCollection().get();

    const typeCounts = {};

    snapshot.forEach((doc) => {
      const { type } = doc.data();
      const normalizedType = (type || 'other').toLowerCase();
      typeCounts[normalizedType] = (typeCounts[normalizedType] || 0) + 1;
    });

    const result = Object.entries(typeCounts).map(([type, count]) => ({
      type,
      count,
    }));

    // Sort by count descending
    result.sort((a, b) => b.count - a.count);

    logger.debug(`[CommodityService] countByType returned ${result.length} types`);

    return result;
  } catch (error) {
    logger.error('[CommodityService] Failed to aggregate count by type', error);
    throw error;
  }
}

/**
 * Get the most recently created commodity listings.
 *
 * @param {number} [limit=10] - Maximum number of items to return
 * @returns {Promise<Array<object>>}
 */
export async function getRecent(limit = 10) {
  try {
    const maxLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));

    const snapshot = await getCommoditiesCollection()
      .orderBy('createdAt', 'desc')
      .limit(maxLimit)
      .get();

    const data = [];
    snapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() });
    });

    logger.debug(`[CommodityService] getRecent returned ${data.length} commodities`);

    return data;
  } catch (error) {
    logger.error('[CommodityService] Failed to fetch recent commodities', error);
    throw error;
  }
}

/**
 * Get all commodities listed by a specific seller.
 *
 * @param {string} uid - Seller's Firebase UID
 * @returns {Promise<Array<object>>}
 */
export async function getBySeller(uid) {
  try {
    // Try sellerUid first, then fall back to sellerId
    let snapshot = await getCommoditiesCollection()
      .where('sellerUid', '==', uid)
      .orderBy('createdAt', 'desc')
      .get();

    if (snapshot.empty) {
      snapshot = await getCommoditiesCollection()
        .where('sellerId', '==', uid)
        .orderBy('createdAt', 'desc')
        .get();
    }

    const data = [];
    snapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() });
    });

    logger.debug(`[CommodityService] getBySeller returned ${data.length} commodities for UID: ${uid}`);

    return data;
  } catch (error) {
    logger.error(`[CommodityService] Failed to fetch commodities for seller: ${uid}`, error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Controller-Compatible Aliases
// ---------------------------------------------------------------------------

/**
 * Alias for getAll() – used by commodityController.
 *
 * @param {object} [filters={}]
 * @returns {Promise<{ data: Array, pagination: object }>}
 */
export async function getAllCommodities(filters = {}) {
  return getAll(filters);
}

/**
 * Alias for getById() – used by commodityController.
 *
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function getCommodityById(id) {
  return getById(id);
}

/**
 * Alias for create() – used by commodityController.
 * Accepts (data, sellerId) signature.
 *
 * @param {object} data
 * @param {string} sellerId
 * @returns {Promise<object>}
 */
export async function createCommodity(data, sellerId) {
  return create(data, sellerId);
}

/**
 * Alias for update() – used by commodityController.
 *
 * @param {string} id
 * @param {object} data
 * @returns {Promise<object>}
 */
export async function updateCommodity(id, data) {
  return update(id, data);
}

/**
 * Upload a commodity image to Cloudinary.
 * Handles file upload and returns the image URL and metadata.
 *
 * @param {object} file - Multer file object
 * @returns {Promise<object>} Upload result with url and publicId
 */
export async function uploadCommodityImage(file) {
  try {
    // Cloudinary upload is handled by the config/cloudinary.js module
    // Dynamic import to avoid hard dependency if cloudinary is not configured
    const { uploadImage } = await import('../config/cloudinary.js');

    const result = await uploadImage(file.path, {
      folder: 'nce/commodities',
    });

    logger.info(`[CommodityService] Image uploaded: ${result.public_id}`);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    };
  } catch (error) {
    logger.error('[CommodityService] Image upload failed', error);
    throw error;
  }
}
