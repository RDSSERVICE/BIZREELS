const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Listing Model
 * Represents Products or Services listed by Vendors on the marketplace.
 * Integrated with 2dsphere geo-indexing for location-based discovery.
 */
const listingSchema = new Schema(
  {
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['product', 'service'],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Listing title is required.'],
      trim: true,
      maxlength: 150,
      index: true,
    },
    description: {
      type: String,
      maxlength: 2000,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    subcategory: {
      type: String,
      index: true,
    },
    price: {
      type: Number,
      required: [true, 'Base price is required.'],
      min: 0,
    },
    salePrice: {
      type: Number,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    condition: {
      type: String,
      enum: ['new', 'refurbished', 'used', 'not_applicable'],
      default: 'not_applicable',
    },
    images: {
      type: [String],
      default: [],
    },
    videos: {
      type: [String],
      default: [],
    },
    variants: [
      {
        name: String,
        priceAdjustment: { type: Number, default: 0 },
        sku: String,
        stock: { type: Number, default: -1 }, // -1 means infinite/unlimited
        image: { type: String, default: null },
        imageUrl: { type: String, default: null },
      },
    ],
    shortDescription: {
      type: String,
      maxlength: 300,
      trim: true,
    },
    stock: {
      type: Number,
      default: 1,
    },
    actualPrice: {
      type: Number,
      default: 0,
    },
    sellingPrice: {
      type: Number,
      default: 0,
    },
    labels: [
      {
        key: String,
        value: String,
      },
    ],
    offers: [
      {
        title: String,
        discountPct: Number,
        couponCode: String,
        validTill: String,
        description: String,
        is_active: { type: Boolean, default: true },
      },
    ],
    // Expanded Service Details Schema
    serviceDetails: {
      serviceType: { type: String, default: 'On-site' },
      priceType: { type: String, default: 'Fixed Price' },
      minOrderValue: { type: Number, default: 0 },
      durationText: { type: String, default: '1 Hour' },
      serviceArea: { type: String, default: '' },
      state: { type: String, default: '' },
      city: { type: String, default: '' },
      pincode: { type: String, default: '' },
      homeVisitAvailable: { type: Boolean, default: true },
      maxTravelDistanceKm: { type: Number, default: 10 },
      workingDays: { type: [String], default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
      workingHours: { type: String, default: '09:00 AM - 08:00 PM' },
      emergencyService24x7: { type: Boolean, default: false },
      advanceBookingRequired: { type: Boolean, default: false },
      coverImage: { type: String, default: '' },
      galleryImages: { type: [String], default: [] },
      contactSettings: {
        chat: { type: Boolean, default: true },
        call: { type: Boolean, default: true },
        whatsapp: { type: Boolean, default: true },
        callbackRequest: { type: Boolean, default: true },
      },
      leadSettings: {
        acceptLead: { type: Boolean, default: true },
        instantChat: { type: Boolean, default: true },
        callOnly: { type: Boolean, default: false },
        callbackOnly: { type: Boolean, default: false },
        quoteRequest: { type: Boolean, default: true },
      },
      policies: {
        cancellationPolicy: { type: String, default: 'Free cancellation up to 2 hours before appointment.' },
        refundPolicy: { type: String, default: 'Full refund if cancelled within policy guidelines.' },
        termsAndConditions: { type: String, default: 'Standard service agreement terms apply.' },
      },
    },
    // Extended product fields
    sku: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    unit: {
      type: String,
      default: 'piece',
    },
    minOrderQty: {
      type: Number,
      default: 1,
      min: 1,
    },
    warranty: {
      type: String,
      trim: true,
    },
    returnPolicy: {
      type: String,
      trim: true,
    },
    shippingDetails: {
      weight: { type: String },
      dimensions: { type: String },
      freeShipping: { type: Boolean, default: false },
      estimatedDays: { type: Number, default: 5 },
    },
    gst: {
      type: String,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    // Engagement & analytics counters
    views: {
      type: Number,
      default: 0,
    },
    uniqueVisitors: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    saves_count: {
      type: Number,
      default: 0,
    },
    orders_count: {
      type: Number,
      default: 0,
    },
    shares: {
      type: Number,
      default: 0,
    },
    revenue: {
      type: Number,
      default: 0,
    },
    // Inventory management
    lowStockThreshold: {
      type: Number,
      default: 5,
    },
    // Timestamps
    publishedAt: Date,
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
      address: String,
      city: String,
      state: String,
      pincode: String,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    isBoosted: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ['published', 'draft', 'hidden', 'out_of_stock'],
      default: 'published',
      index: true,
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

// Indexes
listingSchema.index({ location: '2dsphere' });
listingSchema.index({ category: 1, type: 1, isDeleted: 1 });
listingSchema.index({ price: 1 });
listingSchema.index({ rating: -1 });
listingSchema.index({ views: -1 });
listingSchema.index({ orders_count: -1 });
listingSchema.index({ vendor: 1, status: 1, isDeleted: 1 });

// Helper to recursively check for base64 data strings safely
const hasBase64 = (obj) => {
  if (!obj) return false;
  try {
    const str = typeof obj === 'object' ? JSON.stringify(obj) : String(obj);
    return /data:[^;]+;base64,/.test(str);
  } catch (err) {
    return false;
  }
};

// Pre-validate hook to block base64 strings in listing fields
listingSchema.pre('validate', function () {
  if (
    hasBase64(this.images) ||
    hasBase64(this.videos) ||
    hasBase64(this.variants) ||
    hasBase64(this.serviceDetails)
  ) {
    throw new Error('Uploading base64 files directly to MongoDB is not permitted. Please upload files via /api/v1/upload/image first.');
  }
});

// Query middleware to exclude soft deleted entries
listingSchema.pre(/^find/, function () {
  if (this.getOptions()?.includeSoftDeleted) return;
  this.where({ isDeleted: { $ne: true } });
});

module.exports = mongoose.models.Listing || mongoose.model('Listing', listingSchema);
