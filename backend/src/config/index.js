const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 8001,
  nodeEnv: process.env.NODE_ENV || 'development',

  // MongoDB
  mongoUri: process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/bizreels',
  dbName: process.env.DB_NAME || 'bizreels',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtAlgorithm: process.env.JWT_ALGORITHM || 'HS256',
  accessTokenMinutes: parseInt(process.env.ACCESS_TOKEN_MINUTES, 10) || 15,
  refreshTokenDays: parseInt(process.env.REFRESH_TOKEN_DAYS, 10) || 30,

  // CORS
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean),

  // MSG91 (OTP)
  msg91AuthKey: process.env.MSG91_AUTH_KEY,
  msg91TemplateId: process.env.MSG91_TEMPLATE_ID,
  msg91SenderId: process.env.MSG91_SENDER_ID,
  msg91DevMode: process.env.MSG91_DEV_MODE === 'true',

  // Cloudinary
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
  cloudinaryDevMode: process.env.CLOUDINARY_DEV_MODE === 'true',

  // Razorpay
  razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  razorpayDevMode: process.env.RAZORPAY_DEV_MODE === 'true',

  // Google
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleAiApiKey: process.env.GOOGLE_AI_API_KEY,

  // Admin
  adminPhone: process.env.ADMIN_PHONE || '9999999999',
  adminName: process.env.ADMIN_NAME || 'Admin',

  // Dev overrides
  allowDevAdminLogin: process.env.ALLOW_DEV_ADMIN_LOGIN === 'true',
  devAdminOverrideToken: process.env.DEV_ADMIN_OVERRIDE_TOKEN,

  // Upload and compression configurations
  uploadTempDir: process.env.UPLOAD_TEMP_DIR || 'uploads/temp',
  uploadProcessedDir: process.env.UPLOAD_PROCESSED_DIR || 'uploads/processed',
  maxUploadSize: parseInt(process.env.MAX_UPLOAD_SIZE, 10) || 10 * 1024 * 1024,
  maxImageWidth: parseInt(process.env.MAX_IMAGE_WIDTH, 10) || 1920,
  webpQuality: parseInt(process.env.WEBP_QUALITY, 10) || 80,
  storageProvider: process.env.STORAGE_PROVIDER || 'local',
};

module.exports = config;
