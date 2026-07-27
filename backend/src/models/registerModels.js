/**
 * Model Registration Bootstrap
 * 
 * Eagerly requires all Mongoose model files so that every model is registered
 * before any route handler or populate() call runs.
 * 
 * This file should be required ONCE during server startup, right after
 * the database connection is established.
 */

// Core models (order matters: models referenced by others should come first)
require('./User');
require('./Listing');
require('./Reel');
require('./ReelLike');
require('./Review');
require('./Notification');
require('./Order');
require('./Inquiry');
require('./Follow');
require('./Comment');
require('./Category');
require('./Conversation');
require('./Message');
require('./Chat');
require('./HireRequest');
require('./Quote');
require('./Offer');
require('./Deal');
require('./Requirement');
require('./WalletTransaction');
require('./Analytics');
require('./AuditLog');
require('./AILog');
require('./RefreshToken');
require('./OTP');
require('./OtpRequest');
require('./LiveStream');
require('./Interaction');
require('./Proposal');

// Multi-model files (these use registerOrReuse, safe to load after standalone models)
require('./Admin');
require('./Misc');
require('./Phase4');

const mongoose = require('mongoose');
const logger = require('../utils/logger');

const registeredModels = Object.keys(mongoose.models);
logger.info(`Mongoose models registered: ${registeredModels.length} [${registeredModels.join(', ')}]`, { service: 'models' });
