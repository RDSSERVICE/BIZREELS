const mongoose = require('mongoose');

const newsletterSubscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'unsubscribed'],
      default: 'active',
      index: true,
    },
    source: {
      type: String,
      default: 'footer',
    },
    ip_address: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

newsletterSubscriberSchema.index({ created_at: -1 });

module.exports =
  mongoose.models.NewsletterSubscriber ||
  mongoose.model('NewsletterSubscriber', newsletterSubscriberSchema, 'newsletter_subscribers');
