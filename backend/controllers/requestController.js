/**
 * NCE Request Controller
 * Nusantara Commodity Exchange (NCE)
 *
 * Handles buy request CRUD and offer management:
 *  - List / Get / Create / Update / Delete buy requests
 *  - Submit, list, accept, and reject offers
 */

import * as requestService from '../services/requestService.js';

/**
 * Get all buy requests with filtering and pagination.
 *
 * @route GET /api/requests
 * @query {string} [status]      - 'open' | 'closed' | 'fulfilled'
 * @query {string} [type]        - Commodity type filter
 * @query {number} [page=1]
 * @query {number} [limit=20]
 * @query {string} [sortBy=createdAt]
 * @query {string} [sortOrder=desc]
 */
export const getAll = async (req, res, next) => {
  try {
    const { status, type, page, limit, sortBy, sortOrder } = req.query;

    // Validate status if provided
    if (status && !['open', 'closed', 'fulfilled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Allowed values: open, closed, fulfilled.',
        code: 'VALIDATION_INVALID_STATUS'
      });
    }

    const result = await requestService.getAllRequests({
      status,
      type,
      page: page || 1,
      limit: limit || 20,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc'
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single buy request by ID, including its offers.
 *
 * @route GET /api/requests/:id
 * @param {string} id - Buy request ID
 */
export const getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Request ID is required.',
        code: 'VALIDATION_MISSING_ID'
      });
    }

    const request = await requestService.getRequestById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Buy request not found.',
        code: 'REQUEST_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new buy request.
 * Requires authentication (buyer role).
 *
 * @route POST /api/requests
 * @auth Required, buyer only
 * @body {string} title          - Request title
 * @body {string} [commodity]    - Commodity ID
 * @body {string} [commodityType]- Type of commodity
 * @body {number} quantity       - Desired quantity
 * @body {string} [unit]         - Unit of measurement
 * @body {number} [budget]       - Budget per unit
 * @body {string} [description]  - Additional details
 * @body {string} [deadline]     - Deadline ISO date
 * @body {string} [location]     - Delivery location
 */
export const create = async (req, res, next) => {
  try {
    const { title, commodity, commodityType, quantity, unit, budget, description, deadline, location } = req.body;
    const buyerId = req.user.uid;

    // Validate required fields
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Request title is required.',
        code: 'VALIDATION_MISSING_TITLE'
      });
    }

    if (quantity === undefined || quantity === null) {
      return res.status(400).json({
        success: false,
        message: 'Quantity is required.',
        code: 'VALIDATION_MISSING_QUANTITY'
      });
    }

    if (Number(quantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive number.',
        code: 'VALIDATION_INVALID_QUANTITY'
      });
    }

    if (budget !== undefined && budget !== null && Number(budget) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Budget must be a positive number.',
        code: 'VALIDATION_INVALID_BUDGET'
      });
    }

    // Validate deadline format if provided
    if (deadline && isNaN(Date.parse(deadline))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid deadline format. Use ISO 8601 format.',
        code: 'VALIDATION_INVALID_DEADLINE'
      });
    }

    const request = await requestService.createRequest(
      { title, commodity, commodityType, quantity, unit, budget, description, deadline, location },
      buyerId
    );

    res.status(201).json({
      success: true,
      message: 'Buy request created successfully.',
      data: request
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing buy request.
 * Requires authentication and ownership (or admin role).
 *
 * @route PUT /api/requests/:id
 * @auth Required
 * @param {string} id - Buy request ID
 * @body {string} [title]
 * @body {string} [commodity]
 * @body {string} [commodityType]
 * @body {number} [quantity]
 * @body {string} [unit]
 * @body {number} [budget]
 * @body {string} [description]
 * @body {string} [deadline]
 * @body {string} [location]
 * @body {string} [status] - 'open' | 'closed'
 */
export const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;
    const isAdmin = req.user.role === 'admin';

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Request ID is required.',
        code: 'VALIDATION_MISSING_ID'
      });
    }

    // Check if request exists
    const existing = await requestService.getRequestById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Buy request not found.',
        code: 'REQUEST_NOT_FOUND'
      });
    }

    // Validate ownership
    if (!isAdmin && existing.buyerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own buy requests.',
        code: 'FORBIDDEN_NOT_OWNER'
      });
    }

    // Validate numeric fields if provided
    if (req.body.quantity !== undefined && Number(req.body.quantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive number.',
        code: 'VALIDATION_INVALID_QUANTITY'
      });
    }

    if (req.body.budget !== undefined && req.body.budget !== null && Number(req.body.budget) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Budget must be a positive number.',
        code: 'VALIDATION_INVALID_BUDGET'
      });
    }

    // Validate deadline format if provided
    if (req.body.deadline && isNaN(Date.parse(req.body.deadline))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid deadline format. Use ISO 8601 format.',
        code: 'VALIDATION_INVALID_DEADLINE'
      });
    }

    // Only allow certain status transitions
    if (req.body.status && !['open', 'closed'].includes(req.body.status)) {
      return res.status(400).json({
        success: false,
        message: 'Status can only be set to "open" or "closed" via update.',
        code: 'VALIDATION_INVALID_STATUS'
      });
    }

    const updated = await requestService.updateRequest(id, req.body);

    res.json({
      success: true,
      message: 'Buy request updated successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a buy request by ID.
 * Requires authentication and ownership (or admin role).
 *
 * @route DELETE /api/requests/:id
 * @auth Required
 * @param {string} id - Buy request ID
 */
export const deleteRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;
    const isAdmin = req.user.role === 'admin';

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Request ID is required.',
        code: 'VALIDATION_MISSING_ID'
      });
    }

    // Check if request exists
    const existing = await requestService.getRequestById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Buy request not found.',
        code: 'REQUEST_NOT_FOUND'
      });
    }

    // Validate ownership
    if (!isAdmin && existing.buyerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own buy requests.',
        code: 'FORBIDDEN_NOT_OWNER'
      });
    }

    await requestService.deleteRequest(id);

    res.json({
      success: true,
      message: 'Buy request deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit an offer on a buy request.
 * Requires authentication (seller/supplier role).
 *
 * @route POST /api/requests/:id/offers
 * @auth Required, seller only
 * @param {string} id - Buy request ID
 * @body {number} price         - Offered price per unit
 * @body {number} quantity      - Available quantity
 * @body {string} [message]    - Offer message
 * @body {string} [deliveryDate] - Estimated delivery date
 */
export const submitOffer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { price, quantity, message, deliveryDate } = req.body;
    const sellerId = req.user.uid;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Request ID is required.',
        code: 'VALIDATION_MISSING_REQUEST_ID'
      });
    }

    // Validate required fields
    if (price === undefined || price === null) {
      return res.status(400).json({
        success: false,
        message: 'Offer price is required.',
        code: 'VALIDATION_MISSING_PRICE'
      });
    }

    if (quantity === undefined || quantity === null) {
      return res.status(400).json({
        success: false,
        message: 'Offer quantity is required.',
        code: 'VALIDATION_MISSING_QUANTITY'
      });
    }

    if (Number(price) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Offer price must be a positive number.',
        code: 'VALIDATION_INVALID_PRICE'
      });
    }

    if (Number(quantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Offer quantity must be a positive number.',
        code: 'VALIDATION_INVALID_QUANTITY'
      });
    }

    // Validate delivery date if provided
    if (deliveryDate && isNaN(Date.parse(deliveryDate))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid delivery date format. Use ISO 8601 format.',
        code: 'VALIDATION_INVALID_DELIVERY_DATE'
      });
    }

    // Check if the buy request exists and is still open
    const existingRequest = await requestService.getRequestById(id);
    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        message: 'Buy request not found.',
        code: 'REQUEST_NOT_FOUND'
      });
    }

    if (existingRequest.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'Cannot submit offers on a closed or fulfilled request.',
        code: 'REQUEST_NOT_OPEN'
      });
    }

    // Prevent seller from offering on their own request
    if (existingRequest.buyerId === sellerId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot submit an offer on your own buy request.',
        code: 'CANNOT_OFFER_OWN_REQUEST'
      });
    }

    const offer = await requestService.submitOffer(
      id,
      { price, quantity, message, deliveryDate },
      sellerId
    );

    res.status(201).json({
      success: true,
      message: 'Offer submitted successfully.',
      data: offer
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all offers for a specific buy request.
 *
 * @route GET /api/requests/:id/offers
 * @param {string} id - Buy request ID
 */
export const getOffers = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Request ID is required.',
        code: 'VALIDATION_MISSING_REQUEST_ID'
      });
    }

    // Check if the buy request exists
    const existingRequest = await requestService.getRequestById(id);
    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        message: 'Buy request not found.',
        code: 'REQUEST_NOT_FOUND'
      });
    }

    const offers = await requestService.getOffersForRequest(id);

    res.json({
      success: true,
      data: offers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Accept an offer on a buy request.
 * Only the request owner (buyer) can accept.
 * Rejects all other pending offers and marks the request as fulfilled.
 *
 * @route PUT /api/requests/:id/offers/:offerId/accept
 * @auth Required, buyer only
 * @param {string} id       - Buy request ID
 * @param {string} offerId  - Offer ID to accept
 */
export const acceptOffer = async (req, res, next) => {
  try {
    const { id, offerId } = req.params;
    const buyerId = req.user.uid;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Request ID is required.',
        code: 'VALIDATION_MISSING_REQUEST_ID'
      });
    }

    if (!offerId) {
      return res.status(400).json({
        success: false,
        message: 'Offer ID is required.',
        code: 'VALIDATION_MISSING_OFFER_ID'
      });
    }

    const result = await requestService.acceptOffer(id, offerId, buyerId);

    res.json({
      success: true,
      message: 'Offer accepted successfully. The buy request is now fulfilled.',
      data: result
    });
  } catch (error) {
    if (error.statusCode === 403) {
      return res.status(403).json({
        success: false,
        message: error.message,
        code: 'FORBIDDEN_NOT_OWNER'
      });
    }

    if (error.statusCode === 404) {
      return res.status(404).json({
        success: false,
        message: error.message,
        code: 'REQUEST_NOT_FOUND'
      });
    }

    next(error);
  }
};

/**
 * Reject an offer on a buy request.
 * Only the request owner (buyer) can reject.
 *
 * @route PUT /api/requests/:id/offers/:offerId/reject
 * @auth Required, buyer only
 * @param {string} id       - Buy request ID
 * @param {string} offerId  - Offer ID to reject
 */
export const rejectOffer = async (req, res, next) => {
  try {
    const { id, offerId } = req.params;
    const buyerId = req.user.uid;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Request ID is required.',
        code: 'VALIDATION_MISSING_REQUEST_ID'
      });
    }

    if (!offerId) {
      return res.status(400).json({
        success: false,
        message: 'Offer ID is required.',
        code: 'VALIDATION_MISSING_OFFER_ID'
      });
    }

    const result = await requestService.rejectOffer(id, offerId, buyerId);

    res.json({
      success: true,
      message: 'Offer rejected successfully.',
      data: result
    });
  } catch (error) {
    if (error.statusCode === 403) {
      return res.status(403).json({
        success: false,
        message: error.message,
        code: 'FORBIDDEN_NOT_OWNER'
      });
    }

    if (error.statusCode === 404) {
      return res.status(404).json({
        success: false,
        message: error.message,
        code: 'REQUEST_NOT_FOUND'
      });
    }

    next(error);
  }
};
