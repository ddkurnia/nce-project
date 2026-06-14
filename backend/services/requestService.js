/**
 * Buy Request & Offer Service
 * Nusantara Commodity Exchange (NCE)
 *
 * Provides full CRUD for buy requests and their associated offers.
 * Buy requests live in the 'buyRequests' collection; offers live in
 * subcollections under each request: buyRequests/{requestId}/offers
 *
 * Exports both the spec-defined function names and controller-compatible
 * aliases (getOffersForRequest, acceptOffer, rejectOffer).
 *
 * @module services/requestService
 */

import { db } from '../config/firebase.js';
import { FieldValue } from 'firebase-admin/firestore';
import logger from '../utils/logger.js';

// ---------------------------------------------------------------------------
// Firestore collection references (lazy getters for dev-mode safety)
// ---------------------------------------------------------------------------

const getBuyRequestsCollection = () => {
  if (!db) throw new Error('Firebase Firestore is not initialized. Check your credentials.');
  return db.collection('buyRequests');
};

// ---------------------------------------------------------------------------
// Buy Request Operations (per spec)
// ---------------------------------------------------------------------------

/**
 * Retrieve a paginated, filterable list of buy requests.
 *
 * @param {object} [filters={}] - Query filters
 * @param {string} [filters.status]  - Status filter ('open', 'in-progress', 'closed', 'fulfilled', 'cancelled')
 * @param {string} [filters.type]    - Commodity type filter
 * @param {number} [filters.page]    - Page number (1-based)
 * @param {number} [filters.limit]   - Items per page
 * @param {string} [filters.sortBy]  - Sort field
 * @param {string} [filters.sortOrder] - 'asc' or 'desc'
 * @returns {Promise<{ data: Array, pagination: { page, limit, total, pages } }>}
 */
export async function getAllRequests(filters = {}) {
  try {
    const {
      status = null,
      type = null,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    let query = getBuyRequestsCollection();

    // Apply status filter
    if (status) {
      query = query.where('status', '==', status.trim().toLowerCase());
    }

    // Apply commodity type filter
    if (type) {
      query = query.where('commodityType', '==', type.trim().toLowerCase());
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

    const data = [];
    snapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() });
    });

    logger.debug(`[RequestService] getAllRequests returned ${data.length} requests (page ${normalizedPage}/${pages})`);

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
    logger.error('[RequestService] Failed to fetch buy requests', error);
    throw error;
  }
}

/**
 * Retrieve a single buy request by ID, including its offers subcollection.
 *
 * @param {string} id - Buy request document ID
 * @returns {Promise<object|null>} Buy request with offers array, or null
 */
export async function getRequestById(id) {
  try {
    const docSnap = await getBuyRequestsCollection().doc(id).get();

    if (!docSnap.exists) {
      return null;
    }

    const requestData = { id: docSnap.id, ...docSnap.data() };

    // Fetch offers from subcollection
    requestData.offers = await getOffers(id);

    logger.debug(`[RequestService] getRequestById: ${id}`);

    return requestData;
  } catch (error) {
    logger.error(`[RequestService] Failed to fetch buy request: ${id}`, error);
    throw error;
  }
}

/**
 * Create a new buy request.
 *
 * @param {object} data              - Buy request data
 * @param {string} [buyerUid]        - Buyer's Firebase UID (optional, can be in data)
 * @returns {Promise<object>} Created buy request with id
 */
export async function createRequest(data, buyerUid = null) {
  try {
    const now = new Date();

    const requestDoc = {
      title: data.title || '',
      commodityType: (data.commodityType || '').toLowerCase(),
      commodity: data.commodity || '',
      volume: Number(data.volume || data.quantity) || 0,
      quantity: Number(data.quantity || data.volume) || 0,
      unit: data.unit || 'kg',
      targetPrice: Number(data.targetPrice || data.budget) || 0,
      budget: Number(data.budget || data.targetPrice) || 0,
      deliveryLocation: data.deliveryLocation || data.location || '',
      location: data.location || data.deliveryLocation || '',
      description: data.description || '',
      deadline: data.deadline || null,
      buyerUid: buyerUid || data.buyerUid || '',
      buyerId: buyerUid || data.buyerId || data.buyerUid || '',
      status: 'open',
      offersCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await getBuyRequestsCollection().add(requestDoc);

    logger.info(`[RequestService] Buy request created: ${docRef.id}`);

    return { id: docRef.id, ...requestDoc };
  } catch (error) {
    logger.error('[RequestService] Failed to create buy request', error);
    throw error;
  }
}

/**
 * Update an existing buy request.
 *
 * @param {string} id   - Buy request document ID
 * @param {object} data - Fields to update
 * @returns {Promise<object>} Updated buy request data
 */
export async function updateRequest(id, data) {
  try {
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    // Remove protected fields
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.buyerUid;
    delete updateData.buyerId;

    // Normalize commodityType if provided
    if (updateData.commodityType) {
      updateData.commodityType = updateData.commodityType.toLowerCase();
    }

    // Ensure numeric fields stay numeric
    if (updateData.volume !== undefined) {
      updateData.volume = Number(updateData.volume);
      updateData.quantity = updateData.volume; // Keep in sync
    }
    if (updateData.quantity !== undefined) {
      updateData.quantity = Number(updateData.quantity);
      updateData.volume = updateData.quantity; // Keep in sync
    }
    if (updateData.targetPrice !== undefined) {
      updateData.targetPrice = Number(updateData.targetPrice);
      updateData.budget = updateData.targetPrice; // Keep in sync
    }
    if (updateData.budget !== undefined) {
      updateData.budget = Number(updateData.budget);
      updateData.targetPrice = updateData.budget; // Keep in sync
    }

    await getBuyRequestsCollection().doc(id).update(updateData);

    logger.info(`[RequestService] Buy request updated: ${id}`);

    const updatedDoc = await getBuyRequestsCollection().doc(id).get();
    return { id: updatedDoc.id, ...updatedDoc.data() };
  } catch (error) {
    logger.error(`[RequestService] Failed to update buy request: ${id}`, error);
    throw error;
  }
}

/**
 * Delete a buy request permanently.
 * Also deletes all offers in its subcollection.
 *
 * @param {string} id - Buy request document ID
 * @returns {Promise<void>}
 */
export async function deleteRequest(id) {
  try {
    if (!db) throw new Error('Firebase Firestore is not initialized. Check your credentials.');

    // Delete all offers in the subcollection first
    const offersSnapshot = await getBuyRequestsCollection().doc(id).collection('offers').get();

    const batch = db.batch();
    offersSnapshot.forEach((offerDoc) => {
      batch.delete(offerDoc.ref);
    });

    // Delete the request itself
    batch.delete(getBuyRequestsCollection().doc(id));

    await batch.commit();

    logger.info(`[RequestService] Buy request deleted: ${id} (with ${offersSnapshot.size} offers)`);
  } catch (error) {
    logger.error(`[RequestService] Failed to delete buy request: ${id}`, error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Offer Operations (Subcollection) – per spec
// ---------------------------------------------------------------------------

/**
 * Submit an offer on a buy request.
 *
 * @param {string} requestId    - Buy request document ID
 * @param {object} data         - Offer data
 * @param {string} [sellerUid]  - Seller's Firebase UID (optional, can be in data)
 * @returns {Promise<object>} Created offer with id
 */
export async function submitOffer(requestId, data, sellerUid = null) {
  try {
    const now = new Date();

    const offerDoc = {
      pricePerUnit: Number(data.pricePerUnit || data.price) || 0,
      price: Number(data.price || data.pricePerUnit) || 0,
      volume: Number(data.volume || data.quantity) || 0,
      quantity: Number(data.quantity || data.volume) || 0,
      unit: data.unit || 'kg',
      deliveryTime: data.deliveryTime || '',
      deliveryDate: data.deliveryDate || null,
      message: data.message || '',
      sellerUid: sellerUid || data.sellerUid || '',
      sellerId: sellerUid || data.sellerId || data.sellerUid || '',
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    const offerRef = await getBuyRequestsCollection()
      .doc(requestId)
      .collection('offers')
      .add(offerDoc);

    // Increment offersCount on the parent request
    await getBuyRequestsCollection().doc(requestId).update({
      offersCount: FieldValue.increment(1),
      updatedAt: now,
    });

    logger.info(`[RequestService] Offer submitted: ${offerRef.id} on request: ${requestId}`);

    return { id: offerRef.id, ...offerDoc };
  } catch (error) {
    logger.error(`[RequestService] Failed to submit offer on request: ${requestId}`, error);
    throw error;
  }
}

/**
 * List all offers for a specific buy request.
 *
 * @param {string} requestId - Buy request document ID
 * @returns {Promise<Array<object>>} Array of offer objects
 */
export async function getOffers(requestId) {
  try {
    const snapshot = await getBuyRequestsCollection()
      .doc(requestId)
      .collection('offers')
      .orderBy('createdAt', 'desc')
      .get();

    const offers = [];
    snapshot.forEach((doc) => {
      offers.push({ id: doc.id, ...doc.data() });
    });

    logger.debug(`[RequestService] getOffers returned ${offers.length} offers for request: ${requestId}`);

    return offers;
  } catch (error) {
    logger.error(`[RequestService] Failed to fetch offers for request: ${requestId}`, error);
    throw error;
  }
}

/**
 * Update the status of a specific offer.
 *
 * @param {string} requestId - Buy request document ID
 * @param {string} offerId   - Offer document ID
 * @param {string} status    - New status ('pending', 'accepted', 'rejected', 'withdrawn')
 * @returns {Promise<object>} Updated offer data
 */
export async function updateOfferStatus(requestId, offerId, status) {
  try {
    const validStatuses = ['pending', 'accepted', 'rejected', 'withdrawn'];

    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid offer status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }

    const now = new Date();
    const offerRef = getBuyRequestsCollection().doc(requestId).collection('offers').doc(offerId);

    const updateData = {
      status,
      updatedAt: now,
    };

    await offerRef.update(updateData);

    // If the offer is accepted, update the parent request status to 'in-progress'
    if (status === 'accepted') {
      await getBuyRequestsCollection().doc(requestId).update({
        status: 'in-progress',
        acceptedOfferId: offerId,
        updatedAt: now,
      });
    }

    logger.info(`[RequestService] Offer status updated: ${offerId} → ${status} on request: ${requestId}`);

    const updatedDoc = await offerRef.get();
    return { id: updatedDoc.id, ...updatedDoc.data() };
  } catch (error) {
    logger.error(`[RequestService] Failed to update offer status: ${offerId} on request: ${requestId}`, error);
    throw error;
  }
}

/**
 * Aggregate buy request counts by status.
 * Returns an array of { status, count } objects.
 *
 * @returns {Promise<Array<{ status: string, count: number }>>}
 */
export async function countByStatus() {
  try {
    const snapshot = await getBuyRequestsCollection().get();

    const statusCounts = {};

    snapshot.forEach((doc) => {
      const { status } = doc.data();
      const normalizedStatus = status || 'open';
      statusCounts[normalizedStatus] = (statusCounts[normalizedStatus] || 0) + 1;
    });

    const result = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }));

    // Sort by count descending
    result.sort((a, b) => b.count - a.count);

    logger.debug(`[RequestService] countByStatus returned ${result.length} statuses`);

    return result;
  } catch (error) {
    logger.error('[RequestService] Failed to aggregate count by status', error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Controller-Compatible Aliases & Additional Functions
// ---------------------------------------------------------------------------

/**
 * Alias for getOffers() – used by requestController.
 *
 * @param {string} requestId
 * @returns {Promise<Array<object>>}
 */
export async function getOffersForRequest(requestId) {
  return getOffers(requestId);
}

/**
 * Accept an offer on a buy request.
 * Only the buyer (request owner) can accept.
 * Rejects all other pending offers and marks the request as fulfilled.
 *
 * @param {string} requestId - Buy request document ID
 * @param {string} offerId   - Offer document ID
 * @param {string} buyerId   - Buyer's Firebase UID (for ownership verification)
 * @returns {Promise<object>} Updated request data with accepted offer
 */
export async function acceptOffer(requestId, offerId, buyerId) {
  try {
    if (!db) throw new Error('Firebase Firestore is not initialized. Check your credentials.');

    // Verify the buy request exists and belongs to this buyer
    const requestDoc = await getBuyRequestsCollection().doc(requestId).get();

    if (!requestDoc.exists) {
      const err = new Error('Buy request not found');
      err.statusCode = 404;
      throw err;
    }

    const requestData = requestDoc.data();
    const requestBuyerId = requestData.buyerUid || requestData.buyerId;

    if (requestBuyerId !== buyerId) {
      const err = new Error('Only the request owner can accept offers');
      err.statusCode = 403;
      throw err;
    }

    // Verify the offer exists
    const offerDoc = await getBuyRequestsCollection()
      .doc(requestId)
      .collection('offers')
      .doc(offerId)
      .get();

    if (!offerDoc.exists) {
      const err = new Error('Offer not found');
      err.statusCode = 404;
      throw err;
    }

    const now = new Date();

    // Use a batch to update everything atomically
    const batch = db.batch();

    // Accept the selected offer
    batch.update(
      getBuyRequestsCollection().doc(requestId).collection('offers').doc(offerId),
      { status: 'accepted', updatedAt: now }
    );

    // Reject all other pending offers
    const otherOffersSnapshot = await getBuyRequestsCollection()
      .doc(requestId)
      .collection('offers')
      .where('status', '==', 'pending')
      .get();

    otherOffersSnapshot.forEach((doc) => {
      if (doc.id !== offerId) {
        batch.update(doc.ref, { status: 'rejected', updatedAt: now });
      }
    });

    // Update the request status to fulfilled
    batch.update(getBuyRequestsCollection().doc(requestId), {
      status: 'fulfilled',
      acceptedOfferId: offerId,
      updatedAt: now,
    });

    await batch.commit();

    logger.info(`[RequestService] Offer accepted: ${offerId} on request: ${requestId}`);

    // Return updated request with offers
    return await getRequestById(requestId);
  } catch (error) {
    logger.error(`[RequestService] Failed to accept offer: ${offerId} on request: ${requestId}`, error);
    throw error;
  }
}

/**
 * Reject an offer on a buy request.
 * Only the buyer (request owner) can reject.
 *
 * @param {string} requestId - Buy request document ID
 * @param {string} offerId   - Offer document ID
 * @param {string} buyerId   - Buyer's Firebase UID (for ownership verification)
 * @returns {Promise<object>} Updated offer data
 */
export async function rejectOffer(requestId, offerId, buyerId) {
  try {
    // Verify the buy request exists and belongs to this buyer
    const requestDoc = await getBuyRequestsCollection().doc(requestId).get();

    if (!requestDoc.exists) {
      const err = new Error('Buy request not found');
      err.statusCode = 404;
      throw err;
    }

    const requestData = requestDoc.data();
    const requestBuyerId = requestData.buyerUid || requestData.buyerId;

    if (requestBuyerId !== buyerId) {
      const err = new Error('Only the request owner can reject offers');
      err.statusCode = 403;
      throw err;
    }

    const result = await updateOfferStatus(requestId, offerId, 'rejected');

    logger.info(`[RequestService] Offer rejected: ${offerId} on request: ${requestId}`);

    return result;
  } catch (error) {
    logger.error(`[RequestService] Failed to reject offer: ${offerId} on request: ${requestId}`, error);
    throw error;
  }
}
