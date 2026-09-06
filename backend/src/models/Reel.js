const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Reel Model
 * Stores video references, metadata, geolocated coordinates, and counter tallies.
 */
const reelSchema = new Schema(
  {
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    videoUrl: {
      type: String,
      required: [true, 'Video URL is required.'],
    },
    thumbnailUrl: {
      type: String,
      default: '',
    },
    caption: {
      type: String,
      maxlength: 2200, // Instagram caption length limit
      trim: true,
    },
    hashtags: [{
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    }],
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
    },
    postType: {
      type: String,
      enum: ['product', 'service', 'shop', 'services', 'products'],
      default: 'product',
      index: true,
    },
    category: {
      type: String,
      default: 'General',
      index: true,
    },
    subcategory: {
      type: String,
      default: 'General',
      index: true,
    },
    postPurpose: {
      type: String,
      enum: ['General Promotion', 'Offer / Discount', 'Announcement', 'GENERAL', 'OFFER', 'ANNOUNCEMENT'],
      default: 'General Promotion',
    },
    targetListing: {
      type: Schema.Types.ObjectId,
      ref: 'Listing',
      default: null,
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    salePrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    sellingPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    promotionArea: {
      type: String,
      default: 'City Wide',
    },
    targetAudience: [{
      type: String,
    }],
    customAudience: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['published', 'scheduled', 'pending_ai_review', 'pending_admin_review', 'rejected', 'draft'],
      default: 'published',
      index: true,
    },
    mediaUrls: [{
      type: String,
    }],
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      default: 'video',
    },
    scheduledDate: {
      type: Date,
      default: null,
    },
    aiModeration: {
      passed: { type: Boolean, default: true },
      violationReason: { type: String, default: null },
      scannedAt: { type: Date, default: Date.now },
    },
    adminReview: {
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
      reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
      reviewedAt: { type: Date, default: null },
      comments: { type: String, default: null },
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    likesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isBoosted: {
      type: Boolean,
      default: false,
      index: true,
    },
    boostPlan: { type: String, default: null },
    boostExpiresAt: { type: Date, default: null },
    boostDurationDays: { type: Number, default: null },
    boostActivatedAt: { type: Date, default: null },
    boostCost: { type: Number, default: null },
    isDraft: {
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

// ── Indexes ───────────────────────────────────────────────
reelSchema.index({ 'location.coordinates': '2dsphere' });
reelSchema.index({ creator: 1, createdAt: -1 });
reelSchema.index({ creator: 1, isDeleted: 1, createdAt: -1 });
reelSchema.index({ hashtags: 1, createdAt: -1 });
reelSchema.index({ isDeleted: 1, status: 1, createdAt: -1 });

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

// Pre-validate hook to block base64 strings and local device file paths in Reels
reelSchema.pre('validate', function () {
  if (hasBase64(this.videoUrl) || hasBase64(this.thumbnailUrl) || hasBase64(this.mediaUrls)) {
    throw new Error('Uploading base64 files directly to MongoDB is not permitted. Please upload files via /api/v1/upload/image first.');
  }
  const isLocalDevicePath = (val) => typeof val === 'string' && (/file:\/\//i.test(val) || val.includes('/host.exp.exponent/') || val.includes('cache/ImagePicker'));
  if (isLocalDevicePath(this.videoUrl) || isLocalDevicePath(this.thumbnailUrl) || (Array.isArray(this.mediaUrls) && this.mediaUrls.some(isLocalDevicePath))) {
    throw new Error('Local device paths (file://) cannot be saved directly. Please upload files to cloud storage first.');
  }
});

// Query middleware to exclude soft-deleted reels by default
reelSchema.pre(/^find/, function () {
  if (this.getOptions()?.includeSoftDeleted) return;
  this.where({ isDeleted: { $ne: true } });
});

const sanitizeMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  if (/file:\/\//i.test(url) || url.includes('/host.exp.exponent/') || url.includes('cache/ImagePicker')) {
    return process.env.DEFAULT_FALLBACK_VIDEO_URL || '';
  }
  return url;
};

const sanitizeImageUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  if (/file:\/\//i.test(url) || url.includes('/host.exp.exponent/') || url.includes('cache/ImagePicker')) {
    return '';
  }
  return url;
};

reelSchema.pre('save', function (next) {
  if (this.videoUrl) this.videoUrl = sanitizeMediaUrl(this.videoUrl);
  if (this.thumbnailUrl) this.thumbnailUrl = sanitizeImageUrl(this.thumbnailUrl);
  next();
});

reelSchema.post(['find', 'findOne', 'findOneAndUpdate'], function (docs) {
  if (!docs) return;
  const sanitizeDoc = (doc) => {
    if (doc.videoUrl) doc.videoUrl = sanitizeMediaUrl(doc.videoUrl);
    if (doc.thumbnailUrl) doc.thumbnailUrl = sanitizeImageUrl(doc.thumbnailUrl);
  };
  if (Array.isArray(docs)) {
    docs.forEach(sanitizeDoc);
  } else {
    sanitizeDoc(docs);
  }
});

module.exports = mongoose.models.Reel || mongoose.model('Reel', reelSchema);
