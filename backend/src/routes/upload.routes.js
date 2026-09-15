const express = require('express');
const { uploadSingleImage } = require('../middleware/upload.middleware');
const { uploadImage } = require('../controllers/upload.controller');

const router = express.Router();

/**
 * Endpoint to handle file/image upload, WebP compression, document handling & storage.
 * Form-data field can be 'image', 'file', 'document', 'photo', etc.
 */
router.post(['/image', '/file', '/document', '/media', '/'], uploadSingleImage('image'), uploadImage);

module.exports = router;

