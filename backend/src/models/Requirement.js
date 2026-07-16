const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Requirement Model
 * Represents a customer query or requirement post for products/services.
 * Matched to local vendors using geospatial queries.
 */
const requirementSchema = new Schema(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Requirement title is required.'],
      trim: true,
      maxlength: 120,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Requirement details are required.'],
      maxlength: 1500,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    budget: {
      type: Number,
      required: [true, 'Estimated budget is required.'],
      min: 0,
    },
    deadline: {
      type: Date,
      required: [true, 'Fulfillment deadline is required.'],
      index: true,
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
    status: {
      type: String,
      enum: ['open', 'closed', 'completed'],
      default: 'open',
      index: true,
    },
    quotesCount: {
      type: Number,
      default: 0,
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
requirementSchema.index({ location: '2dsphere' });
requirementSchema.index({ createdAt: -1 });

// Query middleware to exclude soft deleted entries
requirementSchema.pre(/^find/, function (next) {
  if (this.getOptions().includeSoftDeleted) return next();
  this.where({ isDeleted: { $ne: true } });
  next();
});

module.exports = mongoose.model('Requirement', requirementSchema);
