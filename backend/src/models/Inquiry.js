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
      required: true,
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
      enum: ['pending', 'replied', 'closed'],
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

inquirySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Inquiry', inquirySchema);
