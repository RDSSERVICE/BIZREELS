const multer = require('multer');
const ApiError = require('../utils/ApiError');

/**
 * Configure Multer in-memory storage.
 * Keeps file contents as buffer in memory before sending to CDN.
 */
const storage = multer.memoryStorage();

/**
 * Filter files by mime-types.
 */
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm'];

  if (file.fieldname === 'video') {
    if (allowedVideoTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(ApiError.badRequest('Invalid video format. Supported formats: MP4, MOV, WEBM.'), false);
    }
  } else if (file.fieldname === 'image' || file.fieldname === 'thumbnail') {
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(ApiError.badRequest('Invalid image format. Supported formats: JPEG, PNG, WEBP.'), false);
    }
  } else {
    // Default filter for generic uploads
    cb(null, true);
  }
};

/**
 * Multer upload middleware instances
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // max 50MB
  },
});

module.exports = upload;
