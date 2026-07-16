const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * AuditLog Model
 * Immutable log of all critical actions for compliance and debugging.
 */
const auditLogSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
      enum: [
        'USER_REGISTER',
        'USER_LOGIN',
        'USER_LOGOUT',
        'USER_UPDATE',
        'USER_DELETE',
        'ROLE_SWITCH',
        'ROLE_ADD',
        'PASSWORD_CHANGE',
        'PASSWORD_RESET',
        'OTP_REQUEST',
        'OTP_VERIFY',
        'TOKEN_REFRESH',
        'TOKEN_REVOKE',
        'VENDOR_PROFILE_CREATE',
        'CREATOR_PROFILE_CREATE',
        'LISTING_CREATE',
        'LISTING_UPDATE',
        'LISTING_DELETE',
        'ORDER_CREATE',
        'ORDER_UPDATE',
        'PAYMENT_CREATE',
        'PAYMENT_REFUND',
        'SUBSCRIPTION_CHANGE',
        'WALLET_RECHARGE',
        'WALLET_WITHDRAW',
        'ADMIN_ACTION',
      ],
    },
    entity: {
      type: String, // e.g., 'User', 'Product', 'Order'
    },
    entityId: {
      type: Schema.Types.ObjectId,
    },
    description: String,
    metadata: {
      type: Schema.Types.Mixed, // Additional context
    },
    ipAddress: String,
    userAgent: String,
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Immutable: no updates
  }
);

// Compound indexes for efficient querying
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 }); // For time-based queries

module.exports = mongoose.model('AuditLog', auditLogSchema);
