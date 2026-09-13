const mongoose = require('mongoose');

/**
 * CallRecord Model
 * Tracks telephony call connections between customers and vendors via Exotel.
 */
const callRecordSchema = new mongoose.Schema(
  {
    vendor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    listing_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      default: null,
      index: true,
    },
    customer_phone: {
      type: String,
      required: true,
    },
    vendor_phone: {
      type: String,
      required: true,
    },
    exotel_call_sid: {
      type: String,
      index: true,
      default: null,
    },
    status: {
      type: String,
      enum: [
        'initiated',
        'ringing',
        'in-progress',
        'completed',
        'busy',
        'no-answer',
        'failed',
        'canceled',
      ],
      default: 'initiated',
      index: true,
    },
    start_time: {
      type: Date,
      default: Date.now,
    },
    connected_time: {
      type: Date,
      default: null,
    },
    end_time: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number,
      default: 0, // In seconds
    },
    is_charged: {
      type: Boolean,
      default: false,
      index: true,
    },
    credits_deducted: {
      type: Number,
      default: 0,
    },
    charged_at: {
      type: Date,
      default: null,
    },
    wallet_transaction_id: {
      type: String,
      default: null,
    },
    recording_url: {
      type: String,
      default: null,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

callRecordSchema.index({ vendor_id: 1, createdAt: -1 });

module.exports =
  mongoose.models.CallRecord ||
  mongoose.model('CallRecord', callRecordSchema, 'call_records');
