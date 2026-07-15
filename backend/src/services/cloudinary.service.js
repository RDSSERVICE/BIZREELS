const path = require('path');
const fs = require('fs');
const uuid = require('uuid');
const config = require('../config');
const settingsService = require('./settings.service');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const UPLOADS_DIR = path.resolve(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/jpg']);
const ALLOWED_VIDEO_TYPES = new Set(['video/mp4', 'video/quicktime', 'video/webm']);

const isDevMode = () => {
  return settingsService.getBool('cloudinary', 'dev_mode', 'CLOUDINARY_DEV_MODE', false);
};

const hasCredentials = () => {
  return !!(
    settingsService.getValue('cloudinary', 'cloud_name', 'CLOUDINARY_CLOUD_NAME') &&
    settingsService.getValue('cloudinary', 'api_key', 'CLOUDINARY_API_KEY') &&
    settingsService.getValue('cloudinary', 'api_secret', 'CLOUDINARY_API_SECRET')
  );
};

const getCloudinarySDK = () => {
  if (!hasCredentials()) {
    throw new Error(
      'Cloudinary keys missing. Set CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET or enable CLOUDINARY_DEV_MODE=true for local development.'
    );
  }
  const cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: settingsService.getValue('cloudinary', 'cloud_name', 'CLOUDINARY_CLOUD_NAME'),
    api_key: settingsService.getValue('cloudinary', 'api_key', 'CLOUDINARY_API_KEY'),
    api_secret: settingsService.getValue('cloudinary', 'api_secret', 'CLOUDINARY_API_SECRET'),
    secure: true,
  });
  return cloudinary;
};

const ALLOWED_FOLDER_PREFIXES = ['users/', 'listings/', 'uploads/'];

const validateFolder = (folder) => {
  if (!folder) {
    throw ApiError.badRequest('Invalid folder path');
  }
  const isAllowed = ALLOWED_FOLDER_PREFIXES.some(prefix => folder.startsWith(prefix));
  if (!isAllowed) {
    throw ApiError.badRequest('Invalid folder path');
  }
  return folder;
};

const signUpload = (folder, resourceType = 'image') => {
  folder = validateFolder(folder);
  if (isDevMode() || !hasCredentials()) {
    return {
      mode: 'proxy',
      mock: true,
      folder,
      resource_type: resourceType,
    };
  }

  const cloudinary = getCloudinarySDK();
  const timestamp = Math.round(new Date().getTime() / 1000);
  const params = { timestamp, folder };
  const signature = cloudinary.utils.api_sign_request(
    params,
    settingsService.getValue('cloudinary', 'api_secret', 'CLOUDINARY_API_SECRET')
  );

  return {
    mode: 'signed',
    mock: false,
    signature,
    timestamp,
    api_key: settingsService.getValue('cloudinary', 'api_key', 'CLOUDINARY_API_KEY'),
    cloud_name: settingsService.getValue('cloudinary', 'cloud_name', 'CLOUDINARY_CLOUD_NAME'),
    folder,
    resource_type: resourceType,
  };
};

const devWrite = (fileBytes, filename, folder, resourceType) => {
  const ext = path.extname(filename).toLowerCase() || (resourceType === 'video' ? '.mp4' : '.jpg');
  const publicId = `${folder.replace(/\/$/, '')}/${uuid.v4()}`;
  const fsName = publicId.replace(/\//g, '__') + ext;
  const fsPath = path.join(UPLOADS_DIR, fsName);

  fs.writeFileSync(fsPath, fileBytes);

  return {
    mock: true,
    url: `/api/uploads/${fsName}`,
    secure_url: `/api/uploads/${fsName}`,
    public_id: publicId,
    width: null,
    height: null,
    resource_type: resourceType,
    duration: null,
    format: ext.replace(/^\./, ''),
  };
};

const uploadFile = async (fileBytes, filename, contentType, folder, resourceType = 'image') => {
  folder = validateFolder(folder);

  // Validate size/type
  if (resourceType === 'image') {
    if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
      throw ApiError.badRequest(`Unsupported image type: ${contentType}`);
    }
    if (fileBytes.length > MAX_IMAGE_BYTES) {
      throw ApiError.badRequest('Image exceeds 10MB limit');
    }
  } else if (resourceType === 'video') {
    if (!ALLOWED_VIDEO_TYPES.has(contentType)) {
      throw ApiError.badRequest(`Unsupported video type: ${contentType}`);
    }
    if (fileBytes.length > MAX_VIDEO_BYTES) {
      throw ApiError.badRequest('Video exceeds 50MB limit');
    }
  } else {
    throw ApiError.badRequest(`Unknown resource_type: ${resourceType}`);
  }

  if (isDevMode() || !hasCredentials()) {
    return devWrite(fileBytes, filename, folder, resourceType);
  }

  return new Promise((resolve, reject) => {
    const cloudinary = getCloudinarySDK();
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          logger.error('Cloudinary stream upload error:', error.message);
          return reject(ApiError.internal('Cloudinary upload failed'));
        }
        resolve({
          mock: false,
          url: result.secure_url,
          secure_url: result.secure_url,
          public_id: result.public_id,
          width: result.width,
          height: result.height,
          resource_type: result.resource_type,
          duration: result.duration,
          format: result.format,
        });
      }
    );
    stream.end(fileBytes);
  });
};

const destroy = async (publicId, resourceType = 'image') => {
  if (isDevMode() || !hasCredentials()) {
    const fsNameBase = publicId.replace(/\//g, '__');
    const files = fs.readdirSync(UPLOADS_DIR);
    for (const f of files) {
      if (f.startsWith(fsNameBase)) {
        try {
          fs.unlinkSync(path.join(UPLOADS_DIR, f));
        } catch {}
      }
    }
    return;
  }

  try {
    const cloudinary = getCloudinarySDK();
    await new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true }, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    });
  } catch (exc) {
    logger.warn(`Cloudinary destroy failed for ${publicId}: ${exc.message}`);
  }
};

module.exports = {
  isDevMode,
  signUpload,
  uploadFile,
  destroy,
};
