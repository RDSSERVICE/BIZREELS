const express = require('express');
const multer = require('multer');
const { requireAuth } = require('../middleware/auth.middleware');
const cloudinaryService = require('../services/cloudinary.service');
const { catchAsync } = require('../utils/helpers');
const ApiError = require('../utils/ApiError');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/sign', requireAuth, catchAsync(async (req, res) => {
  const { folder = 'listings/misc', resource_type = 'image' } = req.body;
  try {
    const result = cloudinaryService.signUpload(folder, resource_type);
    res.json(result);
  } catch (err) {
    throw ApiError.badRequest(err.message);
  }
}));

router.post('/upload', requireAuth, upload.single('file'), catchAsync(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('No file uploaded');
  }
  const folder = req.body.folder || 'listings/misc';
  const resourceType = req.body.resource_type || 'image';

  try {
    const result = await cloudinaryService.uploadFile(
      req.file.buffer,
      req.file.originalname || 'upload',
      req.file.mimetype || 'application/octet-stream',
      folder,
      resourceType
    );
    res.json(result);
  } catch (err) {
    if (err.name === 'CloudinaryConfigError') {
      return res.status(503).json({ message: err.message });
    }
    throw ApiError.badRequest(err.message);
  }
}));

module.exports = router;
