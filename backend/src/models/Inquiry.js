const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Inquiry Model
 * Logs customer enquiries to local vendors regarding specific listings.
 */
const inquirySchema = new Schema(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    listing: {
      type: Schema.Types.ObjectId,
      ref: 'Listing',
      default: null,
      index: true,
    },
    reel: {
      type: Schema.Types.ObjectId,
      ref: 'Reel',
      default: null,
      index: true,
    },
    message: {
      type: String,
      required: [true, 'Enquiry message is required.'],
      maxlength: 1000,
      trim: true,
    },
    status: {
      type: String,
      enum: ['sent', 'viewed', 'replied', 'closed'],
      default: 'sent',
      index: true,
    },
    replyMessage: {
      type: String,
      maxlength: 1000,
      trim: true,
      default: null,
    },
    repliedAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

inquirySchema.index({ createdAt: -1 });

// Query middleware to exclude soft deleted entries
inquirySchema.pre(/^find/, function () {
  if (this.getOptions()?.includeSoftDeleted) return;
  this.where({ isDeleted: { $ne: true } });
});

module.exports = mongoose.models.Inquiry || mongoose.model('Inquiry', inquirySchema);
