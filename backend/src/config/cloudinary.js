const cloudinary = require('cloudinary').v2;
const config = require('./index');
const logger = require('../utils/logger');

// Initialize Cloudinary if credentials are set
if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true,
  });
  logger.info('Cloudinary SDK configured successfully.', { service: 'media' });
} else {
  logger.warn('Cloudinary credentials missing. File uploads may fail.', { service: 'media' });
}

module.exports = cloudinary;
