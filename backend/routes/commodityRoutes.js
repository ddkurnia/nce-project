/**
 * NCE Commodity Routes
 * Nusantara Commodity Exchange (NCE)
 *
 * Commodity CRUD endpoints:
 *  GET    /api/commodities        - List all (with filters, pagination, sorting)
 *  GET    /api/commodities/:id    - Get by ID
 *  POST   /api/commodities        - Create (auth required, seller only)
 *  PUT    /api/commodities/:id    - Update (auth required, owner only)
 *  DELETE /api/commodities/:id    - Delete (auth required, owner/admin)
 *  POST   /api/commodities/upload - Upload image (auth required, multer)
 */

import { Router } from 'express';
import {
  getAll,
  getById,
  create,
  update,
  deleteCommodity,
  uploadImage
} from '../controllers/commodityController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { upload, handleUploadError } from '../middleware/upload.js';
import { validatePagination } from '../middleware/validate.js';

const router = Router();

/**
 * @route   GET /api/commodities
 * @desc    List all commodities with filters, pagination, and sorting
 * @access  Public
 * @query   type, search, page, limit, sortBy, sortOrder, featured
 */
router.get(
  '/',
  validatePagination(),
  getAll
);

/**
 * @route   GET /api/commodities/:id
 * @desc    Get a single commodity by ID with seller info
 * @access  Public
 */
router.get(
  '/:id',
  getById
);

/**
 * @route   POST /api/commodities
 * @desc    Create a new commodity listing
 * @access  Authenticated, seller only
 * @body    { name, type, price, stock, unit?, description?, images?, location? }
 */
router.post(
  '/',
  authenticate,
  authorize('seller', 'supplier'),
  create
);

/**
 * @route   PUT /api/commodities/:id
 * @desc    Update an existing commodity
 * @access  Authenticated, owner only (or admin)
 * @body    { name?, type?, price?, stock?, unit?, description?, images?, location? }
 */
router.put(
  '/:id',
  authenticate,
  update
);

/**
 * @route   DELETE /api/commodities/:id
 * @desc    Delete a commodity
 * @access  Authenticated, owner only (or admin)
 */
router.delete(
  '/:id',
  authenticate,
  deleteCommodity
);

/**
 * @route   POST /api/commodities/upload
 * @desc    Upload a commodity image to Cloudinary
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
