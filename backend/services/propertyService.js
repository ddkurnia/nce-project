/**
 * Property Service
 * Nusantara Commodity Exchange (NCE)
 *
 * Provides full CRUD operations for property listings, including
 * filtering, search, pagination, aggregation, and owner join.
 *
 * Exports both the spec-defined function names and controller-compatible
 * aliases (getAllProperties, getPropertyById, createProperty, updateProperty,
 * uploadPropertyImage).
 *
 * @module services/propertyService
 */

import { db } from '../config/firebase.js';
import logger from '../utils/logger.js';

// ---------------------------------------------------------------------------
// Firestore collection references (lazy getters for dev-mode safety)
// ---------------------------------------------------------------------------

const getPropertiesCollection = () => {
  if (!db) throw new Error('Firebase Firestore is not initialized. Check your credentials.');
  return db.collection('properties');
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
 * @param {string} [filters.type]      - Property type filter
 * @param {string} [filters.search]    - Search term for title/description
 * @param {number} [filters.page]      - Page number (1-based)
 * @param {number} [filters.limit]     - Items per page
 * @param {string} [filters.sortBy]    - Sort field name
 * @param {string} [filters.sortOrder] - 'asc' or 'desc'
 * @param {string} [filters.location]  - Location filter
 * @param {number} [filters.minPrice]  - Minimum price filter
 * @param {number} [filters.maxPrice]  - Maximum price filter
 * @returns {{ query: Query, page: number, limit: number }}
 */
function buildQuery(filters = {}) {
  const {
    type = null,
    search = null,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    location = null,
    minPrice = null,
    maxPrice = null,
  } = filters;

  let query = getPropertiesCollection();

  // Apply type filter
  if (type) {
    query = query.where('type', '==', type.trim().toLowerCase());
  }

  // Apply location filter
  if (location) {
    query = query.where('location', '==', location.trim());
  }

  // Apply price range filters
  if (minPrice !== null && minPrice !== undefined) {
    const minVal = Number(minPrice);
    if (!Number.isNaN(minVal)) {
      query = query.where('price', '>=', minVal);
    }
  }

  if (maxPrice !== null && maxPrice !== undefined) {
    const maxVal = Number(maxPrice);
    if (!Number.isNaN(maxVal)) {
      query = query.where('price', '<=', maxVal);
    }
  }

  // Firestore prefix search on title
  if (search) {
    const term = search.trim();
    query = query
      .where('title', '>=', term)
      .where('title', '<=', term + '\uf8ff');
  }

  // Default ordering by most recent first
  const direction = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';
  query = query.orderBy(sortBy || 'createdAt', direction);

  return {
    query,
    page: Math.max(1, parseInt(page, 10) || 1),
    limit: Math.min(100, Math.max(1, parseInt(limit, 10) || 20)),
  };
}

// ---------------------------------------------------------------------------
// Service Functions (per spec)
// ---------------------------------------------------------------------------

/**
 * Retrieve a paginated, filterable list of properties.
 *
 * @param {object} [filters={}] - Query filters (type, search, page, limit, etc.)
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

    logger.debug(`[PropertyService] getAll returned ${data.length} properties (page ${page}/${pages})`);

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
    logger.error('[PropertyService] Failed to fetch properties', error);
    throw error;
  }
}

/**
 * Retrieve a single property by ID, with owner user data joined.
 *
 * @param {string} id - Property document ID
 * @returns {Promise<object|null>} Property data with owner info, or null
 */
export async function getById(id) {
  try {
    const docSnap = await getPropertiesCollection().doc(id).get();

    if (!docSnap.exists) {
      return null;
    }

    const property = { id: docSnap.id, ...docSnap.data() };

    // Join owner data if ownerUid is present
    const ownerUid = property.ownerUid || property.ownerId;
    if (ownerUid) {
      try {
        const ownerSnap = await getUsersCollection().doc(ownerUid).get();
        if (ownerSnap.exists) {
          const ownerData = ownerSnap.data();
          property.owner = {
            uid: ownerSnap.id,
            displayName: ownerData.displayName || '',
            companyName: ownerData.companyName || '',
            photoURL: ownerData.photoURL || '',
            location: ownerData.location || '',
            verification: ownerData.verification || null,
          };
        } else {
          property.owner = null;
        }
      } catch (joinError) {
        logger.warn(`[PropertyService] Failed to join owner data for UID: ${ownerUid}`, joinError);
        property.owner = null;
      }
    }

    logger.debug(`[PropertyService] getById: ${id}`);

    return property;
  } catch (error) {
    logger.error(`[PropertyService] Failed to fetch property: ${id}`, error);
    throw error;
  }
}

/**
 * Create a new property listing.
 *
 * @param {object} data           - Property data
 * @param {string} [ownerUid]     - Owner's Firebase UID (optional, can be in data)
 * @returns {Promise<object>} Created property with id
 */
export async function create(data, ownerUid = null) {
  try {
    const now = new Date();

    const propertyDoc = {
      title: data.title || '',
      type: (data.type || '').toLowerCase(),
      price: Number(data.price) || 0,
      location: data.location || '',
      area: Number(data.area) || 0,
      description: data.description || '',
      address: data.address || '',
      features: Array.isArray(data.features) ? data.features : [],
      images: Array.isArray(data.images) ? data.images : [],
      ownerUid: ownerUid || data.ownerUid || '',
      ownerId: ownerUid || data.ownerId || data.ownerUid || '',
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await getPropertiesCollection().add(propertyDoc);

    logger.info(`[PropertyService] Property created: ${docRef.id}`);

    return { id: docRef.id, ...propertyDoc };
  } catch (error) {
    logger.error('[PropertyService] Failed to create property', error);
    throw error;
  }
}

/**
 * Update an existing property listing.
 *
 * @param {string} id   - Property document ID
 * @param {object} data - Fields to update
 * @returns {Promise<object>} Updated property data
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
    delete updateData.ownerUid;
    delete updateData.ownerId;

    // Normalize type if provided
    if (updateData.type) {
      updateData.type = updateData.type.toLowerCase();
    }

    // Ensure numeric fields stay numeric
    if (updateData.price !== undefined) {
      updateData.price = Number(updateData.price);
    }
    if (updateData.area !== undefined) {
      updateData.area = Number(updateData.area);
    }

    await getPropertiesCollection().doc(id).update(updateData);

    logger.info(`[PropertyService] Property updated: ${id}`);

    const updatedDoc = await getPropertiesCollection().doc(id).get();
    return { id: updatedDoc.id, ...updatedDoc.data() };
  } catch (error) {
    logger.error(`[PropertyService] Failed to update property: ${id}`, error);
    throw error;
  }
}

/**
 * Delete a property listing permanently.
 *
 * @param {string} id - Property document ID
 * @returns {Promise<void>}
 */
export async function deleteProperty(id) {
  try {
    await getPropertiesCollection().doc(id).delete();
    logger.info(`[PropertyService] Property deleted: ${id}`);
  } catch (error) {
    logger.error(`[PropertyService] Failed to delete property: ${id}`, error);
    throw error;
  }
}

/**
 * Aggregate property count by type.
 * Returns an array of { type, count } objects.
 *
 * @returns {Promise<Array<{ type: string, count: number }>>}
 */
export async function countByType() {
  try {
    const snapshot = await getPropertiesCollection().get();

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

    logger.debug(`[PropertyService] countByType returned ${result.length} types`);

    return result;
  } catch (error) {
    logger.error('[PropertyService] Failed to aggregate count by type', error);
    throw error;
  }
}

/**
 * Get all properties listed by a specific owner.
 *
 * @param {string} uid - Owner's Firebase UID
 * @returns {Promise<Array<object>>}
 */
export async function getByOwner(uid) {
  try {
    // Try ownerUid first, then fall back to ownerId
    let snapshot = await getPropertiesCollection()
      .where('ownerUid', '==', uid)
      .orderBy('createdAt', 'desc')
      .get();

    if (snapshot.empty) {
      snapshot = await getPropertiesCollection()
        .where('ownerId', '==', uid)
        .orderBy('createdAt', 'desc')
        .get();
    }

    const data = [];
    snapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() });
    });

    logger.debug(`[PropertyService] getByOwner returned ${data.length} properties for UID: ${uid}`);

    return data;
  } catch (error) {
    logger.error(`[PropertyService] Failed to fetch properties for owner: ${uid}`, error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Controller-Compatible Aliases
// ---------------------------------------------------------------------------

/**
 * Alias for getAll() – used by propertyController.
 *
 * @param {object} [filters={}]
 * @returns {Promise<{ data: Array, pagination: object }>}
 */
export async function getAllProperties(filters = {}) {
  return getAll(filters);
}

/**
 * Alias for getById() – used by propertyController.
 *
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function getPropertyById(id) {
  return getById(id);
}

/**
 * Alias for create() – used by propertyController.
 * Accepts (data, ownerId) signature.
 *
 * @param {object} data
 * @param {string} ownerId
 * @returns {Promise<object>}
 */
export async function createProperty(data, ownerId) {
  return create(data, ownerId);
}

/**
 * Alias for update() – used by propertyController.
 *
 * @param {string} id
 * @param {object} data
 * @returns {Promise<object>}
 */
export async function updateProperty(id, data) {
  return update(id, data);
}

/**
 * Upload a property image to Cloudinary.
 *
 * @param {object} file - Multer file object
 * @returns {Promise<object>} Upload result with url and publicId
 */
export async function uploadPropertyImage(file) {
  try {
    const { uploadImage } = await import('../config/cloudinary.js');

    const result = await uploadImage(file.path, {
      folder: 'nce/properties',
    });

    logger.info(`[PropertyService] Image uploaded: ${result.public_id}`);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    };
  } catch (error) {
    logger.error('[PropertyService] Image upload failed', error);
    throw error;
  }
}
