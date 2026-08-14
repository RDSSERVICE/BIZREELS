const express = require('express');
const mongoose = require('mongoose');
const { requestPerformanceLogger, performanceLocalStorage } = require('./middleware/performance');

// Register Mongoose Query Profiling Plugin BEFORE compiling any schemas/models
mongoose.plugin((schema) => {
  schema.pre(['find', 'findOne', 'countDocuments', 'aggregate', 'findOneAndUpdate', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany'], function() {
    this._queryStartTime = process.hrtime();
  });
  
  schema.post(['find', 'findOne', 'countDocuments', 'aggregate', 'findOneAndUpdate', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany'], function(res) {
    if (this._queryStartTime) {
      const diff = process.hrtime(this._queryStartTime);
      const durationMs = (diff[0] * 1e3 + diff[1] * 1e-6);
      const context = performanceLocalStorage.getStore();
      if (context) {
        context.dbQueryCount++;
        context.dbQueryTime += durationMs;
      }
    }
  });
});

const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { apiLimiter } = require('./middleware/rateLimiter');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const passport = require('passport');
const config = require('./config');
const configurePassport = require('./config/passport');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const ApiError = require('./utils/ApiError');
const logger = require('./utils/logger');

const app = express();

app.set('trust proxy', true);

app.use(requestPerformanceLogger);

// Connection Keep-Alive & Cache-Control headers configuration
app.use((req, res, next) => {
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=65, max=1000');
  
  if (req.method === 'GET' && (req.url.startsWith('/uploads') || req.url.startsWith('/processed') || req.url.match(/\.(jpg|jpeg|png|gif|ico|css|js|woff|woff2)$/))) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

// ══════════════════════════════════════════════════════════════
// SECURITY MIDDLEWARE
// ══════════════════════════════════════════════════════════════

// Helmet — set security HTTP headers (disable CSP for Swagger UI compatibility)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// CORS — allow cross-origin from any frontend domain
const corsOptions = {
  origin: (origin, callback) => {
    // Allow any origin or requests with no origin (e.g. mobile apps, curl, server-to-server)
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
};

app.use(cors(corsOptions));

// Rate Limiting — prevent brute force & DDoS
app.use('/api', apiLimiter);

// ══════════════════════════════════════════════════════════════
// BODY PARSING & COMPRESSION
// ══════════════════════════════════════════════════════════════

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

// ══════════════════════════════════════════════════════════════
// LOGGING
// ══════════════════════════════════════════════════════════════

// Morgan HTTP request logging → pipes into Winston
const morganStream = {
  write: (message) => logger.http(message.trim(), { service: 'http' }),
};
app.use(
  morgan(':method :url :status :res[content-length] - :response-time ms', {
    stream: morganStream,
    skip: (req) => req.url === '/api/v1/health',
  })
);

// ══════════════════════════════════════════════════════════════
// PASSPORT
// ══════════════════════════════════════════════════════════════

configurePassport();
app.use(passport.initialize());

// ══════════════════════════════════════════════════════════════
// STATIC FILES & API ROUTES
// ══════════════════════════════════════════════════════════════

const path = require('path');
const processedDir = path.isAbsolute(config.uploadProcessedDir)
  ? config.uploadProcessedDir
  : path.resolve(__dirname, '..', config.uploadProcessedDir);

const uploadsDir = path.resolve(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsDir));
app.use('/api/uploads', express.static(uploadsDir));
app.use('/api/v1/uploads', express.static(uploadsDir));

app.use('/uploads/processed', express.static(processedDir));
app.use('/api/v1/uploads/processed', express.static(processedDir));

const authRoutes = require('./routes/authRoutes');

// Aliases for authentication routes (e.g. /auth/google, /auth/google/callback)
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);

// ══════════════════════════════════════════════════════════════
// SWAGGER API DOCUMENTATION (WITH AUTO ROUTE DISCOVERY)
// ══════════════════════════════════════════════════════════════
const { swaggerUi, serve, getSwaggerSpec } = require('./config/swagger.config');

const serveSwaggerUI = (req, res, next) => {
  const dynamicSpec = getSwaggerSpec(req.app);
  return swaggerUi.setup(dynamicSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'BizReels API Documentation',
  })(req, res, next);
};

app.use('/api-docs', serve, serveSwaggerUI);
app.use('/docs', serve, serveSwaggerUI);

app.get(['/api-docs.json', '/docs.json'], (req, res) => {
  const dynamicSpec = getSwaggerSpec(req.app);
  res.setHeader('Content-Type', 'application/json');
  res.send(dynamicSpec);
});

// Root health check & favicon handlers
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'BizReels Backend API is running',
    version: '1.0.0',
    documentation: '/api-docs',
    timestamp: new Date().toISOString(),
  });
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

// Mount API routes across /api/v1, /api, /v1, and root for seamless compatibility
app.use('/api/v1', routes);
app.use('/api', routes);
app.use('/v1', routes);
app.use('/', routes);

// ══════════════════════════════════════════════════════════════
// 404 HANDLER
// ══════════════════════════════════════════════════════════════

app.use((req, res, next) => {
  next(ApiError.notFound(`Cannot ${req.method} ${req.originalUrl}`));
});

// ══════════════════════════════════════════════════════════════
// GLOBAL ERROR HANDLER
// ══════════════════════════════════════════════════════════════

app.use(errorHandler);

module.exports = app;
