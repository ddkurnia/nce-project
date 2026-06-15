/**
 * NCE Commodity Controller
 * Nusantara Commodity Exchange (NCE)
 *
 * Handles commodity CRUD operations:
 *  - List with filters, pagination, sorting
 *  - Get by ID with seller info
 *  - Create (seller only)
 *  - Update (owner only)
 *  - Delete (owner or admin)
 *  - Upload image (Cloudinary)
 */

import * as commodityService from '../services/commodityService.js';

/**
 * Get all commodities with filtering, pagination, and sorting.
 *
 * @route GET /api/commodities
 * @query {string} [type]       - Commodity type filter
 * @query {string} [search]     - Search term
 * @query {number} [page=1]
 * @query {number} [limit=20]
 * @query {string} [sortBy=createdAt]
 * @query {string} [sortOrder=desc]
 * @query {string} [featured]   - 'true' for featured only
 */
export const getAll = async (req, res, next) => {
  try {
    const { type, search, page, limit, sortBy, sortOrder, featured } = req.query;

    const result = await commodityService.getAllCommodities({
      type,
      search,
      page: page || 1,
      limit: limit || 20,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
      featured
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
 * Get a single commodity by ID, including seller information.
 *
 * @route GET /api/commodities/:id
 * @param {string} id - Commodity ID
 */
export const getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Commodity ID is required.',
        code: 'VALIDATION_MISSING_ID'
      });
    }

    const commodity = await commodityService.getCommodityById(id);

    if (!commodity) {
      return res.status(404).json({
        success: false,
        message: 'Commodity not found.',
        code: 'COMMODITY_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: commodity
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new commodity listing.
 * Requires authentication (seller role).
 *
 * @route POST /api/commodities
 * @auth Required, seller only
 * @body {string} name        - Commodity name
 * @body {string} type        - Commodity type
 * @body {number} price       - Price per unit
 * @body {number} stock       - Available stock
 * @body {string} [unit]      - Unit of measurement (default: 'kg')
 * @body {string} [description]
 * @body {string[]} [images]
 * @body {string} [location]
 */
export const create = async (req, res, next) => {
  try {
    const { name, type, price, stock, unit, description, images, location } = req.body;
    const sellerId = req.user.uid;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Commodity name is required.',
        code: 'VALIDATION_MISSING_NAME'
      });
    }

    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Commodity type is required.',
        code: 'VALIDATION_MISSING_TYPE'
      });
    }

    if (price === undefined || price === null) {
      return res.status(400).json({
        success: false,
        message: 'Price is required.',
        code: 'VALIDATION_MISSING_PRICE'
      });
    }

    if (stock === undefined || stock === null) {
      return res.status(400).json({
        success: false,
        message: 'Stock quantity is required.',
        code: 'VALIDATION_MISSING_STOCK'
      });
    }

    // Validate numeric fields
    if (Number(price) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a positive number.',
        code: 'VALIDATION_INVALID_PRICE'
      });
    }

    if (Number(stock) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock must be a positive number.',
        code: 'VALIDATION_INVALID_STOCK'
      });
    }

    const commodity = await commodityService.createCommodity(
      { name, type, price, stock, unit, description, images, location },
      sellerId
    );

    res.status(201).json({
      success: true,
      message: 'Commodity created successfully.',
      data: commodity
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing commodity.
 * Requires authentication and ownership (or admin role).
 *
 * @route PUT /api/commodities/:id
 * @auth Required
 * @param {string} id - Commodity ID
 * @body {string} [name]
 * @body {string} [type]
 * @body {number} [price]
 * @body {number} [stock]
 * @body {string} [unit]
 * @body {string} [description]
 * @body {string[]} [images]
 * @body {string} [location]
 */
export const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;
    const isAdmin = req.user.role === 'admin';

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Commodity ID is required.',
        code: 'VALIDATION_MISSING_ID'
      });
    }

    // Check if commodity exists
    const existing = await commodityService.getCommodityById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Commodity not found.',
        code: 'COMMODITY_NOT_FOUND'
      });
    }

    // Validate ownership
    if (!isAdmin && existing.sellerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own commodities.',
        code: 'FORBIDDEN_NOT_OWNER'
      });
    }

    // Validate numeric fields if provided
    if (req.body.price !== undefined && Number(req.body.price) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a positive number.',
        code: 'VALIDATION_INVALID_PRICE'
      });
    }

    if (req.body.stock !== undefined && Number(req.body.stock) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock must be a positive number.',
        code: 'VALIDATION_INVALID_STOCK'
      });
    }

    const updated = await commodityService.updateCommodity(id, req.body);

    res.json({
      success: true,
      message: 'Commodity updated successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a commodity by ID.
 * Requires authentication and ownership (or admin role).
 *
 * @route DELETE /api/commodities/:id
 * @auth Required
 * @param {string} id - Commodity ID
 */
export const deleteCommodity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;
    const isAdmin = req.user.role === 'admin';

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Commodity ID is required.',
        code: 'VALIDATION_MISSING_ID'
      });
    }

    // Check if commodity exists
    const existing = await commodityService.getCommodityById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Commodity not found.',
        code: 'COMMODITY_NOT_FOUND'
      });
    }

    // Validate ownership
    if (!isAdmin && existing.sellerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own commodities.',
        code: 'FORBIDDEN_NOT_OWNER'
      });
    }

    await commodityService.deleteCommodity(id);

    res.json({
      success: true,
      message: 'Commodity deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload a commodity image to Cloudinary.
 * Uses Multer middleware for file handling.
 *
 * @route POST /api/commodities/upload
 * @auth Required
 * @formdata image - Image file (JPEG, PNG, WebP, GIF)
 */
export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image file is required.',
        code: 'VALIDATION_MISSING_FILE'
      });
    }

    const result = await commodityService.uploadCommodityImage(req.file);

    res.json({
      success: true,
      message: 'Image uploaded successfully.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};
