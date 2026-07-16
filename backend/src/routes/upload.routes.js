const express = require('express');
const { uploadSingleImage } = require('../middleware/upload.middleware');
const { uploadImage } = require('../controllers/upload.controller');

const router = express.Router();

/**
 * Endpoint to handle image upload, compression to WebP, resizing and storage.
 * POST /api/upload/image
 * Form-data field: 'image'
 */
router.post('/image', uploadSingleImage('image'), uploadImage);

module.exports = router;
