const path = require('path');
const fs = require('fs').promises;
const uuid = require('uuid');
const config = require('../config');
const imageProcessingService = require('../services/image-processing.service');
const { processedDir } = require('../services/image-processing.service');
const storageService = require('../services/storage.service');
const ApiError = require('../utils/ApiError');
const { catchAsync } = require('../utils/helpers');

/**
 * Controller to handle image uploading, WebP conversion, compression, resizing and storage.
 * Ensures temporary files are deleted after execution regardless of success or failure.
 */
const uploadImage = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(ApiError.badRequest('No image file provided.'));
  }

  const rawFilePath = req.file.path;
  const uniqueName = `${uuid.v4()}.webp`;
  const processedFilePath = path.join(processedDir, uniqueName);

  let isProcessedFileCreated = false;
  let uploadResult = null;

  try {
    // 1. Process the image using Sharp (auto-rotate, smart resize, convert to WebP, remove metadata)
    const processResult = await imageProcessingService.processImage(rawFilePath, processedFilePath);
    isProcessedFileCreated = true;

    // 2. Upload to storage provider (LocalStorage or CloudinaryStorage)
    uploadResult = await storageService.upload(processedFilePath, uniqueName);

    // 3. Return the response in the format requested by the client
    res.status(201).json({
      success: true,
      message: 'Image uploaded and compressed successfully',
      filename: uniqueName,
      url: uploadResult.url,
      size: processResult.size,
      format: processResult.format,
      dimensions: {
        width: processResult.width,
        height: processResult.height
      }
    });

  } catch (err) {
    // If upload fails after processed file was created, clean up the processed file immediately
    if (isProcessedFileCreated) {
      try {
        await fs.unlink(processedFilePath);
      } catch (cleanupErr) {
        // Silent catch for cleanup
      }
    }
    throw err;
  } finally {
    // 4. Always delete the raw temporary file uploaded by Multer
    try {
      await fs.unlink(rawFilePath);
    } catch (cleanupErr) {
      // Silent catch for cleanup
    }

    // 5. If using a remote storage provider (e.g. Cloudinary), delete local processed file as well
    if (isProcessedFileCreated && (config.storageProvider || 'local').toLowerCase() !== 'local') {
      try {
        await fs.unlink(processedFilePath);
      } catch (cleanupErr) {
        // Silent catch for cleanup
      }
    }
  }
});

module.exports = {
  uploadImage
};
