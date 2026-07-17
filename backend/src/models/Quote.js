const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Quote Model
 * Represents a bid or quotation sent by a Vendor for a specific customer Requirement.
 */
const quoteSchema = new Schema(
  {
    requirement: {
      type: Schema.Types.ObjectId,
      ref: 'Requirement',
      required: true,
      index: true,
    },
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    price: {
      type: Number,
      required: [true, 'Bid/Quote price is required.'],
      min: 0,
    },
    notes: {
      type: String,
      maxlength: 1000,
      trim: true,
    },
    estimatedDelivery: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid'],
      default: 'unpaid',
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Compound Index to prevent duplicate bids by same vendor on same requirement
quoteSchema.index({ requirement: 1, vendor: 1 }, { unique: true });

// Query middleware to exclude soft deleted entries
quoteSchema.pre(/^find/, function () {
  if (this.getOptions()?.includeSoftDeleted) return;
  this.where({ isDeleted: { $ne: true } });
});

module.exports = mongoose.model('Quote', quoteSchema);
