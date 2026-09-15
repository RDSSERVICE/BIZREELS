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
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    cb(null, `temp-${uniqueSuffix}${ext}`);
  }
});

// Comprehensive list of allowed MIME types & extensions for images & verification documents
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/octet-stream' // Mobile upload fallback
]);

const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.gif', '.bmp', '.tiff', '.svg',
  '.pdf', '.doc', '.docx'
]);

const fileFilter = (req, file, cb) => {
  const mimeType = (file.mimetype || '').toLowerCase();
  const ext = path.extname(file.originalname || '').toLowerCase();

  // Allow if extension or mime type matches, or if image/* type
  if (ALLOWED_EXTENSIONS.has(ext) || ALLOWED_MIME_TYPES.has(mimeType) || mimeType.startsWith('image/')) {
    return cb(null, true);
  }

  return cb(
    ApiError.badRequest(`Unsupported file format (${file.originalname || 'file'}). Allowed: JPEG, PNG, WebP, HEIC, PDF, DOC, GIF.`),
    false
  );
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxUploadSize || 20 * 1024 * 1024,
  }
});

/**
 * Express middleware to handle single file uploads flexibly.
 * Works with any field name ('image', 'file', 'document', 'photo', 'avatar', 'media', etc.)
 * Sets req.file to the uploaded file.
 */
const uploadSingleImage = (defaultFieldName = 'image') => {
  const uploadMiddleware = upload.any();

  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            const limitMb = ((config.maxUploadSize || 20 * 1024 * 1024) / (1024 * 1024)).toFixed(1);
            return next(ApiError.badRequest(`File too large. Maximum upload size is ${limitMb}MB.`));
          }
          return next(ApiError.badRequest(`Upload error: ${err.message}`));
        }
        return next(err);
      }

      if (req.files && req.files.length > 0) {
        // Find file matching default field name or take first uploaded file
        req.file = req.files.find(f => f.fieldname === defaultFieldName) || req.files[0];
      }

      next();
    });
  };
};

module.exports = {
  uploadSingleImage,
  tempDir
};

