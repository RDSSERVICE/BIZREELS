const mongoose = require('mongoose');

const otpRequestSchema = new mongoose.Schema({
  phone: { type: String, required: true, index: true },
  otp_hash: { type: String, required: true },
  purpose: { type: String, default: 'login' },
  verified: { type: Boolean, default: false },
  attempts: { type: Number, default: 0 },
  expires_at: { type: Date, required: true, index: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

// TTL index: auto-delete expired OTPs
otpRequestSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OtpRequest', otpRequestSchema, 'otp_requests');
