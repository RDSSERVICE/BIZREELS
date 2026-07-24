const mongoose = require('mongoose');

const redemptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  redeemedAt: { type: Date, default: Date.now },
  orderId: { type: mongoose.Schema.Types.ObjectId },
  discountAmount: { type: Number, required: true }
}, { _id: false });

const offerSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  code: { type: String, uppercase: true, trim: true, sparse: true },
  targetRoles: { 
    type: [String], 
    enum: ['vendor', 'creator', 'customer'], 
    default: ['customer'],
    required: true
  },
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue: { type: Number, required: true },
  minOrderAmount: { type: Number, default: 0 },
  maxDiscountLimit: { type: Number, default: null },
  usageLimit: { type: Number, default: null },
  perUserLimit: { type: Number, default: 1 },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  timezone: { type: String, default: 'Asia/Kolkata' },
  duration: { type: String },
  status: { 
    type: String, 
    enum: ['Draft', 'Scheduled', 'Active', 'Expired', 'Disabled'], 
    default: 'Draft',
    index: true
  },
  priority: { type: Number, default: 0 },
  terms: { type: String, default: '' },
  image: { type: String, default: null },
  applicableCategories: { type: [String], default: [] },
  applicableProducts: { type: [String], default: [] },
  applicableServices: { type: [String], default: [] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  usedCount: { type: Number, default: 0 },
  recipientCount: { type: Number, default: 0 },
  analytics: {
    viewsCount: { type: Number, default: 0 },
    clicksCount: { type: Number, default: 0 }
  },
  redemptions: [redemptionSchema],
  notificationStatus: {
    sent: { type: Boolean, default: false },
    sentAt: { type: Date, default: null },
    deliveryRate: { type: Number, default: 0 }
  },
  isDeleted: { type: Boolean, default: false, index: true }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Calculate duration and transition status on save
offerSchema.pre('save', function (next) {
  const now = new Date();

  // 1. Calculate duration string
  if (this.startTime && this.endTime) {
    const diffMs = this.endTime.getTime() - this.startTime.getTime();
    if (diffMs > 0) {
      const diffMins = Math.floor(diffMs / 60000);
      const days = Math.floor(diffMins / 1440);
      const hours = Math.floor((diffMins % 1440) / 60);
      const mins = diffMins % 60;
      let durationStr = '';
      if (days > 0) durationStr += `${days}d `;
      if (hours > 0) durationStr += `${hours}h `;
      if (mins > 0 || durationStr === '') durationStr += `${mins}m`;
      this.duration = durationStr.trim();
    } else {
      this.duration = '0m';
    }
  }

  // 2. Automatically set status based on start/end times if not Draft or Disabled
  if (this.status !== 'Draft' && this.status !== 'Disabled') {
    if (this.startTime > now) {
      this.status = 'Scheduled';
    } else if (this.startTime <= now && this.endTime > now) {
      this.status = 'Active';
    } else if (this.endTime <= now) {
      this.status = 'Expired';
    }
  }

  next();
});

// Indexes for performance
offerSchema.index({ targetRoles: 1, status: 1 });
offerSchema.index({ startTime: 1, endTime: 1 });

module.exports = mongoose.model('Offer', offerSchema);
