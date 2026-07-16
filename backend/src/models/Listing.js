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
      },
    ],
    // For services
    serviceAvailability: {
      slots: [
        {
          day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
          startTime: String, // HH:MM format
          endTime: String, // HH:MM format
        },
      ],
      durationMinutes: { type: Number, default: 60 },
    },
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

// Query middleware to exclude soft deleted entries
listingSchema.pre(/^find/, function (next) {
  if (this.getOptions().includeSoftDeleted) return next();
  this.where({ isDeleted: { $ne: true } });
  next();
});

module.exports = mongoose.model('Listing', listingSchema);
