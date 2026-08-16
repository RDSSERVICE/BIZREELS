const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Order Model
 * Tracks product purchases and service order requests.
 */
const orderSchema = new Schema(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    listing: {
      type: Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
      index: true,
    },
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'rejected', 'refunded'],
      default: 'pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid'],
      default: 'unpaid',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['wallet', 'vendor_upi', 'vendor_qr', 'vendor_bank', 'cod', 'vendor_payment', 'upi', 'qr', 'bank_transfer', 'cash'],
      default: 'vendor_upi',
    },
    paymentDetails: {
      type: Schema.Types.Mixed,
      default: null,
    },
    deliveryStatus: {
      type: String,
      enum: ['pending', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'pending',
    },
    expectedDeliveryDate: {
      type: Date,
      default: null,
    },
    address: {
      type: String,
      required: true,
    },
    bookingDate: {
      type: String,
      default: '',
    },
    bookingTime: {
      type: String,
      default: '',
    },
    scheduledVisitTime: {
      type: Date,
      default: null,
    },
    cancellationPolicySnapshot: {
      freeCancellationHours: { type: Number, default: 24 },
      withinWindowHours: { type: Number, default: 24 },
      withinWindowRefundPercent: { type: Number, default: 50 },
      afterVisitRefundPercent: { type: Number, default: 0 },
      cancellationPolicy: { type: String, default: '' },
    },
    refundAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    refundPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ createdAt: -1 });

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
