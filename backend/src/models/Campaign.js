const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Campaign Model
 * Represents a brand collaboration/campaign agreement between a Vendor and a Creator.
 * Tracks specific deliverables, timeline milestones, budget payments, submissions, and status.
 */
const campaignSchema = new Schema(
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
    hireRequest: {
      type: Schema.Types.ObjectId,
      ref: 'HireRequest',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Campaign title is required.'],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      required: [true, 'Campaign description is required.'],
      trim: true,
      maxlength: 2000,
    },
    productService: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
    deliverables: {
      type: [String],
      default: [],
    },
    numReels: {
      type: Number,
      default: 0,
      min: 0,
    },
    numPosts: {
      type: Number,
      default: 0,
      min: 0,
    },
    budget: {
      type: Number,
      required: [true, 'Campaign budget is required.'],
      min: 1,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    deadline: {
      type: Date,
      default: null,
    },
    attachments: {
      type: [String],
      default: [],
    },
    specialInstructions: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'negotiation', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    submissionUrls: [
      {
        url: { type: String, required: true },
        type: { type: String, enum: ['reel', 'post', 'image', 'video'], default: 'reel' },
        uploadedAt: { type: Date, default: Date.now },
        caption: { type: String, default: '' },
      }
    ],
    vendorReview: {
      type: Schema.Types.ObjectId,
      ref: 'Review',
      default: null,
    },
    creatorReview: {
      type: Schema.Types.ObjectId,
      ref: 'Review',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

campaignSchema.index({ createdAt: -1 });

module.exports = mongoose.models.Campaign || mongoose.model('Campaign', campaignSchema);
