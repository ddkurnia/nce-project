/**
 * NCE Property Routes
 * Nusantara Commodity Exchange (NCE)
 *
 * Property listing endpoints:
 *  GET    /api/properties        - List all (with filters, pagination, sorting)
 *  GET    /api/properties/:id    - Get by ID
 *  POST   /api/properties        - Create (auth required)
 *  PUT    /api/properties/:id    - Update (auth required, owner only)
 *  DELETE /api/properties/:id    - Delete (auth required, owner/admin)
 *  POST   /api/properties/upload - Upload image (auth required, multer)
 */

import { Router } from 'express';
import {
  getAll,
  getById,
  create,
  update,
  deleteProperty,
  uploadImage
} from '../controllers/propertyController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { upload, handleUploadError } from '../middleware/upload.js';
import { validatePagination } from '../middleware/validate.js';

const router = Router();

/**
 * @route   GET /api/properties
 * @desc    List all properties with filters and pagination
 * @access  Public
 * @query   type, search, page, limit, sortBy, sortOrder, location, minPrice, maxPrice
 */
router.get(
  '/',
  validatePagination(),
  getAll
);

/**
 * @route   GET /api/properties/:id
 * @desc    Get a single property by ID with owner info
 * @access  Public
 */
router.get(
  '/:id',
  getById
);

/**
 * @route   POST /api/properties
 * @desc    Create a new property listing
 * @access  Authenticated
 * @body    { title, type, price, location?, description?, address?, area?, features?, images? }
 */
router.post(
  '/',
  authenticate,
  create
);

/**
 * @route   PUT /api/properties/:id
 * @desc    Update an existing property
 * @access  Authenticated, owner only (or admin)
 * @body    { title?, type?, price?, location?, description?, address?, area?, features?, images? }
 */
router.put(
  '/:id',
  authenticate,
  update
);

/**
 * @route   DELETE /api/properties/:id
 * @desc    Delete a property
 * @access  Authenticated, owner only (or admin)
 */
router.delete(
  '/:id',
  authenticate,
  deleteProperty
);

/**
 * @route   POST /api/properties/upload
 * @desc    Upload a property image to Cloudinary
 * @access  Authenticated
 * @formdata image
 */
router.post(
  '/upload',
  authenticate,
  upload.single('image'),
  handleUploadError,
  uploadImage
);

export default router;
