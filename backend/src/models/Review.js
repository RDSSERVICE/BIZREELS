const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Review Model
 * Stores ratings and reviews left by users (e.g. Customers reviewing Vendors/Listings,
 * or Vendors reviewing Creators).
 */
const reviewSchema = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // The target vendor or creator being reviewed
    targetUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    // The target listing being reviewed (if applicable)
    targetListing: {
      type: Schema.Types.ObjectId,
      ref: 'Listing',
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required.'],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: 1000,
      trim: true,
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
reviewSchema.index({ targetUser: 1, isDeleted: 1, createdAt: -1 });
reviewSchema.index({ targetListing: 1, isDeleted: 1, createdAt: -1 });
// Compound index to prevent duplicate reviews by the same author on the same listing
reviewSchema.index({ author: 1, targetListing: 1 }, { unique: true, sparse: true });

// Query middleware to exclude soft-deleted reviews by default
reviewSchema.pre(/^find/, function () {
  if (this.getOptions()?.includeSoftDeleted) return;
  this.where({ isDeleted: { $ne: true } });
});

// Post-save hook to dynamically recalculate average rating for vendors/listings
reviewSchema.post('save', async function () {
  const Review = this.constructor;
  
  // 1. Recalculate listing rating if targetListing exists
  if (this.targetListing) {
    const listingStats = await Review.aggregate([
      { $match: { targetListing: this.targetListing, isDeleted: false } },
      {
        $group: {
          _id: '$targetListing',
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    if (listingStats.length > 0) {
      await mongoose.model('Listing').findByIdAndUpdate(this.targetListing, {
        rating: Math.round(listingStats[0].avgRating * 10) / 10,
        totalReviews: listingStats[0].totalReviews,
      });
    }
  }

  // 2. Recalculate user (vendor/creator) rating if targetUser exists
  if (this.targetUser) {
    const userStats = await Review.aggregate([
      { $match: { targetUser: this.targetUser, isDeleted: false } },
      {
        $group: {
          _id: '$targetUser',
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    if (userStats.length > 0) {
      const targetUserDoc = await mongoose.model('User').findById(this.targetUser);
      if (targetUserDoc) {
        if (targetUserDoc.roles.includes('vendor') && targetUserDoc.vendorProfile) {
          targetUserDoc.vendorProfile.rating = Math.round(userStats[0].avgRating * 10) / 10;
          targetUserDoc.vendorProfile.totalReviews = userStats[0].totalReviews;
        } else if (targetUserDoc.roles.includes('creator') && targetUserDoc.creatorProfile) {
          targetUserDoc.creatorProfile.rating = Math.round(userStats[0].avgRating * 10) / 10;
          targetUserDoc.creatorProfile.totalReviews = userStats[0].totalReviews;
        }
        await targetUserDoc.save();
      }
    }
  }
});

module.exports = mongoose.model('Review', reviewSchema);
