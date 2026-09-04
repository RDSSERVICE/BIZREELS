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
    itemTotal: {
      type: Number,
      default: 0,
    },
    couponCode: {
      type: String,
      default: null,
      trim: true,
    },
    couponDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    shippingCharges: {
      type: Number,
      default: 0,
      min: 0,
    },
    shippingDetails: {
      type: Schema.Types.Mixed,
      default: null,
    },
    pincode: {
      type: String,
      default: '',
      trim: true,
    },
    trackingNumber: {
      type: String,
      default: '',
      trim: true,
    },
    idempotencyKey: {
      type: String,
      default: null,
      sparse: true,
      index: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'completed', 'cancelled', 'rejected', 'refunded'],
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
      enum: ['pending', 'shipped', 'out_for_delivery', 'delivered', 'completed', 'cancelled'],
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
    itemSnapshot: {
      title: { type: String, default: '' },
      sku: { type: String, default: '' },
      unitPrice: { type: Number, default: 0 },
      images: { type: [String], default: [] },
      variantDetails: { type: Schema.Types.Mixed, default: null },
      vendorShopName: { type: String, default: '' },
      vendorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
      category: { type: String, default: '' },
      listingType: { type: String, default: 'product' },
    },
    shiprocketDetails: {
      orderId: { type: String, default: null },
      shipmentId: { type: String, default: null },
      awbCode: { type: String, default: null },
      courierCompanyId: { type: Number, default: null },
      courierName: { type: String, default: null },
      labelUrl: { type: String, default: null },
      invoiceUrl: { type: String, default: null },
      pickupScheduledDate: { type: Date, default: null },
      pickupTokenNumber: { type: String, default: null },
      syncStatus: {
        type: String,
        enum: ['not_applicable', 'pending', 'synced', 'shipping_sync_failed'],
        default: 'pending',
      },
      lastSyncError: { type: String, default: null },
      syncAttempts: { type: Number, default: 0 },
      trackingStatus: { type: String, default: null },
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ listing: 1, scheduledVisitTime: 1 });

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
