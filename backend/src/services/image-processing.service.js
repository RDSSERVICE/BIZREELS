const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

// Ensure processed uploads directory exists
const processedDir = path.isAbsolute(config.uploadProcessedDir)
  ? config.uploadProcessedDir
  : path.resolve(__dirname, '..', '..', config.uploadProcessedDir);

if (!fs.existsSync(processedDir)) {
  fs.mkdirSync(processedDir, { recursive: true });
}

class ImageProcessingService {
  /**
   * Process and compress image to WebP format.
   * Resizes only if the image width exceeds config.maxImageWidth.
   * Auto-rotates based on EXIF orientation.
   * Removes unnecessary metadata.
   * 
   * @param {string} inputPath - Absolute path to the raw uploaded file
   * @param {string} outputPath - Absolute path to save the processed file
   * @returns {Promise<{ width: number, height: number, size: number, format: string }>}
   */
  async processImage(inputPath, outputPath) {
    try {
      // 1. Auto-rotate based on EXIF metadata first, so we work with the correct orientation
      const pipeline = sharp(inputPath).rotate();
      
      // Get the orientation-corrected metadata
      const metadata = await pipeline.metadata();
      
      // 2. Conditionally resize if width exceeds the limit while maintaining aspect ratio
      const maxWidth = config.maxImageWidth;
      if (metadata.width && metadata.width > maxWidth) {
        pipeline.resize({
          width: maxWidth,
          fit: 'inside', // Preserves aspect ratio, fits inside the box
          withoutEnlargement: true // Never scale up smaller images
        });
      }
      
      // 3. Convert to WebP with configured options, removing metadata by default (no .withMetadata() call)
      pipeline.webp({
        quality: config.webpQuality,
        effort: 6, // Maximum compression effort (0-6)
      });

      // 4. Save to the processed output path
      const info = await pipeline.toFile(outputPath);
      
      return {
        width: info.width,
        height: info.height,
        size: info.size,
        format: info.format
      };
    } catch (err) {
      logger.error('Sharp image processing error:', err);
      
      // Customize error message for better user feedback
      if (err.message && err.message.includes('Input buffer contains unsupported image format')) {
        throw ApiError.badRequest('Failed to process image. Unsupported or corrupted image file.');
      }
      
      throw ApiError.badRequest(`Image processing failed: ${err.message}`);
    }
  }
}

module.exports = new ImageProcessingService();
module.exports.processedDir = processedDir;
