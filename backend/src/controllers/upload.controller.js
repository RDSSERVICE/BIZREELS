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
 * Controller to handle file/image uploading, WebP conversion/document handling, compression and storage.
 * Ensures temporary files are deleted after execution regardless of success or failure.
 */
const uploadImage = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(ApiError.badRequest('No file provided for upload.'));
  }

  const rawFilePath = req.file.path;
  const originalExt = path.extname(req.file.originalname || '').toLowerCase() || '.jpg';
  const isDocument = originalExt === '.pdf' || originalExt === '.doc' || originalExt === '.docx' || (req.file.mimetype && req.file.mimetype.includes('pdf'));
  
  const uniqueName = isDocument ? `${uuid.v4()}${originalExt}` : `${uuid.v4()}.webp`;
  const processedFilePath = path.join(processedDir, uniqueName);

  let isProcessedFileCreated = false;
  let uploadResult = null;
  let processResult = { width: null, height: null, size: req.file.size || 0, format: originalExt.replace('.', '') };

  try {
    if (isDocument) {
      // 1a. For documents (PDF, DOC), copy raw file directly to processed directory
      await fs.copyFile(rawFilePath, processedFilePath);
      isProcessedFileCreated = true;
    } else {
      // 1b. For images, process using Sharp (auto-rotate, smart resize, convert to WebP, remove EXIF)
      try {
        processResult = await imageProcessingService.processImage(rawFilePath, processedFilePath);
        isProcessedFileCreated = true;
      } catch (sharpErr) {
        // Fallback: If Sharp fails (e.g. unprocessable format), copy raw file directly
        const rawUniqueName = `${uuid.v4()}${originalExt}`;
        const fallbackPath = path.join(processedDir, rawUniqueName);
        await fs.copyFile(rawFilePath, fallbackPath);
        isProcessedFileCreated = true;
        uploadResult = await storageService.upload(fallbackPath, rawUniqueName);
        
        return res.status(201).json({
          success: true,
          message: 'File uploaded successfully',
          filename: rawUniqueName,
          url: uploadResult.url,
          secure_url: uploadResult.url,
          size: req.file.size,
          format: originalExt.replace('.', ''),
          data: {
            url: uploadResult.url,
            filename: rawUniqueName
          }
        });
      }
    }

    // 2. Upload to storage provider (LocalStorage or CloudinaryStorage)
    uploadResult = await storageService.upload(processedFilePath, uniqueName);

    // 3. Return response with both top-level 'url' and nested 'data.url' for client compatibility
    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      filename: uniqueName,
      url: uploadResult.url,
      secure_url: uploadResult.url,
      size: processResult.size,
      format: processResult.format,
      dimensions: {
        width: processResult.width,
        height: processResult.height
      },
      data: {
        url: uploadResult.url,
        filename: uniqueName
      }
    });

  } catch (err) {
    if (isProcessedFileCreated) {
      try {
        await fs.unlink(processedFilePath);
      } catch (cleanupErr) {
        // Silent catch
      }
    }
    throw err;
  } finally {
    // Always delete the raw temporary file uploaded by Multer
    try {
      await fs.unlink(rawFilePath);
    } catch (cleanupErr) {
      // Silent catch
    }

    // If using a remote storage provider (e.g. Cloudinary), clean up local processed file
    if (isProcessedFileCreated && (config.storageProvider || 'local').toLowerCase() !== 'local') {
      try {
        await fs.unlink(processedFilePath);
      } catch (cleanupErr) {
        // Silent catch
      }
    }
  }
});

module.exports = {
  uploadImage
};

