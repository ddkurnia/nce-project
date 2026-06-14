/**
 * NCE Property Controller
 * Nusantara Commodity Exchange (NCE)
 *
 * Handles property listing CRUD operations:
 *  - List with filters, pagination, sorting
 *  - Get by ID with owner info
 *  - Create (auth required)
 *  - Update (owner only)
 *  - Delete (owner or admin)
 *  - Upload image (Cloudinary)
 */

import * as propertyService from '../services/propertyService.js';

/**
 * Get all properties with filtering and pagination.
 *
 * @route GET /api/properties
 * @query {string} [type]       - Property type filter
 * @query {string} [search]     - Search term
 * @query {number} [page=1]
 * @query {number} [limit=20]
 * @query {string} [sortBy=createdAt]
 * @query {string} [sortOrder=desc]
 * @query {string} [location]   - Location filter
 * @query {number} [minPrice]   - Minimum price filter
 * @query {number} [maxPrice]   - Maximum price filter
 */
export const getAll = async (req, res, next) => {
  try {
    const { type, search, page, limit, sortBy, sortOrder, location, minPrice, maxPrice } = req.query;

    const result = await propertyService.getAllProperties({
      type,
      search,
      page: page || 1,
      limit: limit || 20,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
      location,
      minPrice,
      maxPrice
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
 * Get a single property by ID, including owner information.
 *
 * @route GET /api/properties/:id
 * @param {string} id - Property ID
 */
export const getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Property ID is required.',
        code: 'VALIDATION_MISSING_ID'
      });
    }

    const property = await propertyService.getPropertyById(id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found.',
        code: 'PROPERTY_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: property
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new property listing.
 * Requires authentication.
 *
 * @route POST /api/properties
 * @auth Required
 * @body {string} title        - Property title
 * @body {string} type         - Property type
 * @body {number} price        - Price
 * @body {string} [location]   - Property location
 * @body {string} [description]
 * @body {string} [address]    - Full address
 * @body {number} [area]       - Area in square meters
 * @body {string[]} [features] - List of features
 * @body {string[]} [images]
 */
export const create = async (req, res, next) => {
  try {
    const { title, type, price, location, description, address, area, features, images } = req.body;
    const ownerId = req.user.uid;

    // Validate required fields
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Property title is required.',
        code: 'VALIDATION_MISSING_TITLE'
      });
    }

    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Property type is required.',
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

    if (Number(price) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a positive number.',
        code: 'VALIDATION_INVALID_PRICE'
      });
    }

    if (area !== undefined && area !== null && Number(area) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Area must be a positive number.',
        code: 'VALIDATION_INVALID_AREA'
      });
    }

    const property = await propertyService.createProperty(
      { title, type, price, location, description, address, area, features, images },
      ownerId
    );

    res.status(201).json({
      success: true,
      message: 'Property created successfully.',
      data: property
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing property.
 * Requires authentication and ownership (or admin role).
 *
 * @route PUT /api/properties/:id
 * @auth Required
 * @param {string} id - Property ID
 * @body {string} [title]
 * @body {string} [type]
 * @body {number} [price]
 * @body {string} [location]
 * @body {string} [description]
 * @body {string} [address]
 * @body {number} [area]
 * @body {string[]} [features]
 * @body {string[]} [images]
 */
export const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;
    const isAdmin = req.user.role === 'admin';

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Property ID is required.',
        code: 'VALIDATION_MISSING_ID'
      });
    }

    // Check if property exists
    const existing = await propertyService.getPropertyById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Property not found.',
        code: 'PROPERTY_NOT_FOUND'
      });
    }

    // Validate ownership
    if (!isAdmin && existing.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own properties.',
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

    if (req.body.area !== undefined && req.body.area !== null && Number(req.body.area) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Area must be a positive number.',
        code: 'VALIDATION_INVALID_AREA'
      });
    }

    const updated = await propertyService.updateProperty(id, req.body);

    res.json({
      success: true,
      message: 'Property updated successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a property by ID.
 * Requires authentication and ownership (or admin role).
 *
 * @route DELETE /api/properties/:id
 * @auth Required
 * @param {string} id - Property ID
 */
export const deleteProperty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;
    const isAdmin = req.user.role === 'admin';

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Property ID is required.',
        code: 'VALIDATION_MISSING_ID'
      });
    }

    // Check if property exists
    const existing = await propertyService.getPropertyById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Property not found.',
        code: 'PROPERTY_NOT_FOUND'
      });
    }

    // Validate ownership
    if (!isAdmin && existing.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own properties.',
        code: 'FORBIDDEN_NOT_OWNER'
      });
    }

    await propertyService.deleteProperty(id);

    res.json({
      success: true,
      message: 'Property deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload a property image to Cloudinary.
 * Uses Multer middleware for file handling.
 *
 * @route POST /api/properties/upload
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

    const result = await propertyService.uploadPropertyImage(req.file);

    res.json({
      success: true,
      message: 'Image uploaded successfully.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};
