/**
 * NCE Request Routes
 * Nusantara Commodity Exchange (NCE)
 *
 * Buy request and offer endpoints:
 *  GET    /api/requests                              - List all buy requests
 *  GET    /api/requests/:id                          - Get by ID with offers
 *  POST   /api/requests                              - Create buy request (buyer only)
 *  PUT    /api/requests/:id                          - Update (owner only)
 *  DELETE /api/requests/:id                          - Delete (owner/admin)
 *  POST   /api/requests/:id/offers                   - Submit offer (seller only)
 *  GET    /api/requests/:id/offers                   - Get offers for request
 *  PUT    /api/requests/:id/offers/:offerId/accept   - Accept offer (buyer only)
 *  PUT    /api/requests/:id/offers/:offerId/reject   - Reject offer (buyer only)
 */

import { Router } from 'express';
import {
  getAll,
  getById,
  create,
  update,
  deleteRequest,
  submitOffer,
  getOffers,
  acceptOffer,
  rejectOffer
} from '../controllers/requestController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { validatePagination } from '../middleware/validate.js';

const router = Router();

/**
 * @route   GET /api/requests
 * @desc    List all buy requests with filters and pagination
 * @access  Public
 * @query   status, type, page, limit, sortBy, sortOrder
 */
router.get(
  '/',
  validatePagination(),
  getAll
);

/**
 * @route   GET /api/requests/:id
 * @desc    Get a single buy request by ID with its offers
 * @access  Public
 */
router.get(
  '/:id',
  getById
);

/**
 * @route   POST /api/requests
 * @desc    Create a new buy request
 * @access  Authenticated, buyer only
 * @body    { title, commodity?, commodityType?, quantity, unit?, budget?, description?, deadline?, location? }
 */
router.post(
  '/',
  authenticate,
  authorize('buyer'),
  create
);

/**
 * @route   PUT /api/requests/:id
 * @desc    Update an existing buy request
 * @access  Authenticated, owner only (or admin)
 * @body    { title?, commodity?, commodityType?, quantity?, unit?, budget?, description?, deadline?, location?, status? }
 */
router.put(
  '/:id',
  authenticate,
  update
);

/**
 * @route   DELETE /api/requests/:id
 * @desc    Delete a buy request
 * @access  Authenticated, owner only (or admin)
 */
router.delete(
  '/:id',
  authenticate,
  deleteRequest
);

/**
 * @route   POST /api/requests/:id/offers
 * @desc    Submit an offer on a buy request
 * @access  Authenticated, seller/supplier only
 * @body    { price, quantity, message?, deliveryDate? }
 */
router.post(
  '/:id/offers',
  authenticate,
  authorize('seller', 'supplier'),
  submitOffer
);

/**
 * @route   GET /api/requests/:id/offers
 * @desc    Get all offers for a buy request
 * @access  Public
 */
router.get(
  '/:id/offers',
  getOffers
);

/**
 * @route   PUT /api/requests/:id/offers/:offerId/accept
 * @desc    Accept an offer on a buy request (rejects all others, marks request as fulfilled)
 * @access  Authenticated, buyer only (request owner)
 */
router.put(
  '/:id/offers/:offerId/accept',
  authenticate,
  authorize('buyer'),
  acceptOffer
);

/**
 * @route   PUT /api/requests/:id/offers/:offerId/reject
 * @desc    Reject an offer on a buy request
 * @access  Authenticated, buyer only (request owner)
 */
router.put(
  '/:id/offers/:offerId/reject',
  authenticate,
  authorize('buyer'),
  rejectOffer
);

export default router;
