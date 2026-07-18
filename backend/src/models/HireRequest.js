const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * HireRequest Model
 * Tracks contract/job proposals submitted by Vendors to content Creators.
 */
const hireRequestSchema = new Schema(
  {
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Project title is required.'],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: [true, 'Campaign details are required.'],
      trim: true,
      maxlength: 1500,
    },
    budget: {
      type: Number,
      required: [true, 'Proposed budget cost is required.'],
      min: 1,
    },
    deliveryDays: {
      type: Number,
      required: [true, 'Delivery timeframe in days is required.'],
      min: 1,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed'],
      default: 'pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid'],
      default: 'unpaid',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
hireRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('HireRequest', hireRequestSchema);
