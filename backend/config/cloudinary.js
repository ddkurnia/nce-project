import { v2 as cloudinary } from 'cloudinary';
import config from './environment.js';

/**
 * Configure Cloudinary with credentials from environment variables.
 */
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
  secure: true,
});

console.log('[Cloudinary] SDK configured successfully');

/**
 * Upload an image file to Cloudinary.
 *
 * @param {object} file - The file object from multer (expects file.path or file.buffer).
 *   If file.path exists (disk storage), uploads from path.
 *   If file.buffer exists (memory storage), uploads via data URI.
 * @param {string} folder - The Cloudinary folder to upload into (e.g. 'nce/commodities').
 * @param {object} [options={}] - Additional Cloudinary upload options.
 * @returns {Promise<object>} Cloudinary upload result containing public_id, secure_url, etc.
 */
const uploadImage = async (file, folder = 'nce/uploads', options = {}) => {
  try {
    const uploadOptions = {
      folder,
      resource_type: 'image',
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      ...options,
    };

    let result;

    if (file.path) {
      // Disk storage — multer stored file on disk
      result = await cloudinary.uploader.upload(file.path, uploadOptions);
    } else if (file.buffer) {
      // Memory storage — convert buffer to data URI
      const fileUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      result = await cloudinary.uploader.upload(fileUri, uploadOptions);
    } else {
      throw new Error(
        'Invalid file object. Expected multer file with .path or .buffer property.'
      );
    }

    return result;
  } catch (error) {
    console.error('[Cloudinary] Upload failed:', error.message);
    throw new Error(`Image upload failed: ${error.message}`);
  }
};

/**
 * Delete an image from Cloudinary by its public ID.
 *
 * @param {string} publicId - The public_id of the image to delete.
 * @returns {Promise<object>} Cloudinary deletion result.
 */
const deleteImage = async (publicId) => {
  try {
    if (!publicId) {
      throw new Error('publicId is required to delete an image.');
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
    });

    if (result.result === 'not found') {
      console.warn(`[Cloudinary] Image not found for publicId: ${publicId}`);
    }

    return result;
  } catch (error) {
    console.error('[Cloudinary] Delete failed:', error.message);
    throw new Error(`Image deletion failed: ${error.message}`);
  }
};

/**
 * Generate an optimized URL for a Cloudinary image.
 *
 * @param {string} publicId - The public_id of the image.
 * @param {object} [options={}] - Transformation options (width, height, crop, etc.).
 * @returns {string} The optimized image URL.
 */
const getOptimizedUrl = (publicId, options = {}) => {
  if (!publicId) {
    throw new Error('publicId is required to generate an optimized URL.');
  }

  const defaultOptions = {
    quality: 'auto',
    fetch_format: 'auto',
    secure: true,
  };

  const transformationOptions = { ...defaultOptions, ...options };

  return cloudinary.url(publicId, transformationOptions);
};

export { cloudinary, uploadImage, deleteImage, getOptimizedUrl };
export default { cloudinary, uploadImage, deleteImage, getOptimizedUrl };
