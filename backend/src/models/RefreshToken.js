const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  user_id: { type: String, required: true, index: true },
  token_hash: { type: String, required: true, index: true },
  revoked: { type: Boolean, default: false },
  expires_at: { type: Date, required: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

refreshTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema, 'refresh_tokens');
