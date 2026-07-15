const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { optionalAuth } = require('./middleware/auth.middleware');
const { errorHandler } = require('./middleware/error.middleware');
const routes = require('./routes');
const ApiError = require('./utils/ApiError');
const User = require('./models/User');
const { KycDocument } = require('./models/Phase4');

const app = express();

// Configure CORS
const allowedOrigins = (process.env.CORS_ORIGINS || 'https://emergent-india-2.preview.emergentagent.com,http://localhost:3000')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// Raw body capture for signature verify
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: true }));

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self), interest-cohort=()');
  next();
});

// Serve public uploads and gate sensitive ones (SEC-003)
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.get('/api/uploads/:filename', optionalAuth, async (req, res, next) => {
  try {
    const { filename } = req.params;
    // Reject path traversal
    if (!/^[A-Za-z0-9._-]+$/.test(filename) || filename.includes('..')) {
      throw ApiError.badRequest('Invalid filename');
    }

    const filePath = path.join(uploadsDir, filename);
    if (!fs.existsSync(filePath)) {
      throw ApiError.notFound('File not found');
    }

    // Public uploads
    if (
      filename.startsWith('listings__') ||
      filename.startsWith('reels__') ||
      filename.startsWith('categories__')
    ) {
      return res.sendFile(filePath);
    }

    // Sensitive uploads: require authenticated user
    if (!req.userId) {
      throw ApiError.unauthorized('Authentication required');
    }

    const user = await User.findById(req.userId);
    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    // Admin role override
    if (user.roles && user.roles.includes('admin')) {
      return res.sendFile(filePath);
    }

    // KYC documents: check ownership
    if (filename.startsWith('users__kyc__')) {
      const rx = new RegExp(filename.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
      const owner = await KycDocument.findOne({
        user_id: req.userId,
        is_deleted: { $ne: true },
        $or: [{ doc_url: rx }, { selfie_url: rx }],
      });
      if (!owner) {
        throw ApiError.forbidden('Forbidden');
      }
      return res.sendFile(filePath);
    }

    // Fail closed
    throw ApiError.forbidden('Forbidden');
  } catch (err) {
    next(err);
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const msg91Service = require('./services/msg91.service');
  const cloudinaryService = require('./services/cloudinary.service');
  res.json({
    status: 'ok',
    service: 'emergent-backend',
    otp_dev_mode: msg91Service.isDevMode(),
    cloudinary_dev_mode: cloudinaryService.isDevMode(),
  });
});

// API Routes
app.use('/api/v1', routes);

// 404 Route handler
app.use((req, res, next) => {
  next(ApiError.notFound('API Route not found'));
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
