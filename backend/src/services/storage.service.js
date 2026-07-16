const fs = require('fs').promises;
const path = require('path');
const config = require('../config');
const cloudinaryService = require('./cloudinary.service');
const ApiError = require('../utils/ApiError');

/**
 * Local Storage Provider
 * Keeps files in the configured local processed images directory.
 */
class LocalStorageProvider {
  async upload(filePath, filename) {
    // For local storage, the file is already saved in the processed folder.
    // We construct the URL mapped to the static router.
    return {
      url: `/api/uploads/processed/${filename}`,
      publicId: filename
    };
  }

  async delete(filename) {
    const processedDir = path.isAbsolute(config.uploadProcessedDir)
      ? config.uploadProcessedDir
      : path.resolve(__dirname, '..', '..', config.uploadProcessedDir);
    const fullPath = path.join(processedDir, filename);
    try {
      await fs.unlink(fullPath);
    } catch (err) {
      // Ignore file-not-found errors during cleanup
    }
  }
}

/**
 * Cloudinary Storage Provider
 * Uploads processed WebP files to Cloudinary.
 */
class CloudinaryStorageProvider {
  async upload(filePath, filename) {
    try {
      const buffer = await fs.readFile(filePath);
      // 'uploads/' is an allowed prefix in the backend's cloudinary.service.js
      const folder = 'uploads/processed';
      const result = await cloudinaryService.uploadFile(
        buffer,
        filename,
        'image/webp',
        folder,
        'image'
      );
      
      return {
        url: result.secure_url || result.url,
        publicId: result.public_id
      };
    } catch (err) {
      throw ApiError.internal(`Cloudinary storage upload failed: ${err.message}`);
    }
  }

  async delete(publicId) {
    try {
      await cloudinaryService.destroy(publicId, 'image');
    } catch (err) {
      // Log or ignore errors during deletion
    }
  }
}

/**
 * Replaceable Storage Service Factory
 */
class StorageService {
  constructor() {
    const providerType = (config.storageProvider || 'local').toLowerCase();
    
    if (providerType === 'cloudinary') {
      this.provider = new CloudinaryStorageProvider();
    } else {
      this.provider = new LocalStorageProvider();
    }
  }

  /**
   * Upload processed file to the selected storage provider
   * @param {string} filePath - Absolute path to the processed WebP file
   * @param {string} filename - Processed file name
   * @returns {Promise<{ url: string, publicId: string }>}
   */
  async upload(filePath, filename) {
    return this.provider.upload(filePath, filename);
  }

  /**
   * Delete file from the selected storage provider
   * @param {string} id - filename or publicId of the resource
   */
  async delete(id) {
    return this.provider.delete(id);
  }
}

module.exports = new StorageService();
