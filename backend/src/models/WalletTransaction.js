const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * WalletTransaction Model
 * Maintains the double-entry bookkeeping transactions for user wallets.
 */
const walletTransactionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'payment', 'refund'],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Transaction amount is required.'],
      min: 0.01,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    referenceId: {
      type: String,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 250,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
walletTransactionSchema.index({ createdAt: -1 });

module.exports = mongoose.models.WalletTransaction || mongoose.model('WalletTransaction', walletTransactionSchema);
