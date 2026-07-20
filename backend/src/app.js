const express = require('express');
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

// ══════════════════════════════════════════════════════════════
// SECURITY MIDDLEWARE
// ══════════════════════════════════════════════════════════════

// Helmet — set security HTTP headers
app.use(helmet());

// CORS — allow frontend origin
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

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

app.use('/uploads/processed', express.static(processedDir));
app.use('/api/v1/uploads/processed', express.static(processedDir));

const authRoutes = require('./routes/authRoutes');

// Aliases for authentication routes (e.g. /auth/google, /auth/google/callback)
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);

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
