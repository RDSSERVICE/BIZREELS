const dotenv = require('dotenv');
const path = require('path');

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  // ── Server ──────────────────────────────────────────────
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  clientUrl: process.env.CLIENT_URL || '*',
  corsOrigin: process.env.CORS_ORIGIN || '*',

  // ── MongoDB ─────────────────────────────────────────────
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/bizreels',
  dbName: process.env.DB_NAME || 'bizreels',

  // ── Redis ───────────────────────────────────────────────
  redis: {
    enabled: process.env.REDIS_ENABLED === 'true',
    url: process.env.REDIS_URL || '',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    tls: process.env.REDIS_TLS === 'true',
  },

  // ── JWT ─────────────────────────────────────────────────
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  // ── Google OAuth ────────────────────────────────────────
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/v1/auth/google/callback',
  },

  // ── Cloudinary ──────────────────────────────────────────
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  // ── OTP & SMS / WhatsApp (Twilio) ───────────────────────
  otp: {
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 10,
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS, 10) || 5,
    cooldownSeconds: parseInt(process.env.OTP_COOLDOWN_SECONDS, 10) || 60,
  },
  sms: {
    provider: process.env.SMS_PROVIDER || 'mock', // 'twilio' or 'mock'
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID || '',
      senderId: process.env.TWILIO_SENDER_ID || 'BZREEL',
      dltTemplateId: process.env.TWILIO_DLT_TEMPLATE_ID || '1277178706040137501',
      dltPeId: process.env.TWILIO_DLT_PE_ID || '',
    },
  },
  whatsapp: {
    provider: process.env.WHATSAPP_PROVIDER || process.env.SMS_PROVIDER || 'mock', // 'twilio' or 'mock'
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      from: process.env.TWILIO_WHATSAPP_FROM || '', // e.g. 'whatsapp:+14155238886' or business sender
      contentSid: process.env.TWILIO_WHATSAPP_CONTENT_SID || '', // Twilio Content API template SID
    },
  },

  // ── Resend Email ─────────────────────────────────────────
  resend: {
    apiKey: process.env.RESEND_API_KEY || '',
    fromEmail: process.env.RESEND_FROM_EMAIL || 'BizReels <onboarding@resend.dev>',
  },

  // ── Upload & Image Processing ───────────────────────────
  uploadTempDir: process.env.UPLOAD_TEMP_DIR || 'uploads/temp',
  uploadProcessedDir: process.env.UPLOAD_PROCESSED_DIR || 'uploads/processed',
  maxUploadSize: parseInt(process.env.MAX_UPLOAD_SIZE, 10) || 10 * 1024 * 1024, // 10MB
  maxImageWidth: parseInt(process.env.MAX_IMAGE_WIDTH, 10) || 1920,
  webpQuality: parseInt(process.env.WEBP_QUALITY, 10) || 80,
  storageProvider: process.env.STORAGE_PROVIDER || 'local',

  // ── Rate Limiting ───────────────────────────────────────
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // requests per window
  },
};

// Validate critical environment variables in production
if (config.env === 'production') {
  const required = ['MONGODB_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

module.exports = config;
