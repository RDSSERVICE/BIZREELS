const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const ApiError = require('../utils/ApiError');

// Ensure upload directories exist
const tempDir = path.isAbsolute(config.uploadTempDir)
  ? config.uploadTempDir
  : path.resolve(__dirname, '..', '..', config.uploadTempDir);

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Setup storage engine for temporary files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `temp-${uniqueSuffix}${ext}`);
  }
});

// Define allowed mime types and extensions
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/jpg']);
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const fileFilter = (req, file, cb) => {
  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(
      ApiError.badRequest('Unsupported file type. Only JPEG, JPG, PNG, and WebP are allowed. (GIF, SVG, PDF, etc. are rejected.)'),
      false
    );
  }

  // Double check extension to prevent MIME-type spoofing
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(
      ApiError.badRequest('Invalid file extension. Only .jpg, .jpeg, .png, and .webp extensions are allowed.'),
      false
    );
  }

  cb(null, true);
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxUploadSize,
  }
});

/**
 * Express middleware to handle a single file upload.
 * It wraps multer to handle validation and size limit errors gracefully.
 * @param {string} fieldName - The form field name containing the file
 */
const uploadSingleImage = (fieldName) => {
  const uploadMiddleware = upload.single(fieldName);
  
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            const limitMb = (config.maxUploadSize / (1024 * 1024)).toFixed(1);
            return next(ApiError.badRequest(`File too large. Maximum upload size is ${limitMb}MB.`));
          }
          return next(ApiError.badRequest(`Upload error: ${err.message}`));
        }
        return next(err);
      }
      next();
    });
  };
};

module.exports = {
  uploadSingleImage,
  tempDir
};
