/**
 * NCE Upload Middleware
 * Nusantara Commodity Exchange (NCE)
 *
 * Configures Multer for multipart/form-data file uploads.
 * Validates file types and enforces size limits.
 */

import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '5242880', 10); // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const UPLOAD_DIR = path.join(process.cwd(), 'tmp', 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ---------------------------------------------------------------------------
// Storage Configuration
// ---------------------------------------------------------------------------

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

/**
 * File filter that only allows image MIME types.
 */
const imageFileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`), false);
  }
};

/**
 * Multer instance configured for single image uploads.
 * Use as middleware: upload.single('image')
 */
export const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1
  }
});

/**
 * Multer error handler middleware.
 * Catches Multer-specific errors (file size, wrong type, etc.) and returns
 * a consistent JSON error response.
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
        code: 'UPLOAD_FILE_TOO_LARGE'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Only one file is allowed per upload.',
        code: 'UPLOAD_TOO_MANY_FILES'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload error.',
      code: 'UPLOAD_ERROR'
    });
  }

  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: err.message,
      code: 'UPLOAD_INVALID_FILE_TYPE'
    });
  }

  next(err);
};
