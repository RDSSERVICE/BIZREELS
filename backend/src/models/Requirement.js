const mongoose = require('mongoose');

const requirementSchema = new mongoose.Schema({
  customer_id: { type: String, index: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  description: { type: String, default: null },
  category_id: { type: String, default: 'General' },
  category: { type: String, default: 'General' },
  requirementType: { type: String, enum: ['product', 'service'], default: 'product' },
  type: { type: String, enum: ['product', 'service'], default: 'product' },
  sub_category_id: { type: String, default: null },
  subcategory: { type: String, default: null },
  budget: { type: Number, default: 0 },
  budget_min: { type: Number, default: null },
  budget_max: { type: Number, default: null },
  quantity: { type: Number, default: 1 },
  deadline: { type: Date, default: null },
  photos: { type: [mongoose.Schema.Types.Mixed], default: [] },
  video: { type: mongoose.Schema.Types.Mixed, default: null },
  location: {
    area: { type: String, default: 'Local' },
    city: { type: String, default: 'Delhi' },
    district: { type: String, default: null },
    state: { type: String, default: null },
    pincode: { type: String, default: '110001' },
  },
  address: { type: String, default: null },
  targetDistance: { type: Number, default: null },
  otherConditions: { type: String, default: null },
  urgency: { type: String, default: 'flexible' },
  is_negotiable: { type: Boolean, default: true },
  expires_at: { type: String, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
  status: { type: String, default: 'Pending', index: true },
  assignedVendorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  vendorsViewed: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  vendorsResponded: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  totalVendorsMatched: { type: Number, default: 0 },
  totalVendorsNotified: { type: Number, default: 0 },
  acceptedProposalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote' },
  closedAt: { type: Date, default: null },
  proposals_count: { type: Number, default: 0 },
  quotesCount: { type: Number, default: 0 },
  views_count: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
  is_deleted: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },

  // ── New Fields: Detailed Specs, Delivery, Conditions ──────────
  detailedSpecifications: { type: String, default: null },
  expectedDeliveryDate: { type: Date, default: null },
  expectedDeliveryTime: { type: String, default: null },

  // Product condition (new/used/refurbished/other)
  productCondition: { type: String, enum: ['new', 'used', 'refurbished', 'other', null], default: null },
  customProductCondition: { type: String, default: null },

  // Service model (onsite/remote/hybrid/other)
  serviceModel: { type: String, enum: ['onsite', 'remote', 'hybrid', 'other', null], default: null },
  customServiceModel: { type: String, default: null },

  // Custom category/subcategory (for "Other" option)
  customCategory: { type: String, default: null },
  customSubcategory: { type: String, default: null },

  // ── Admin Approval Workflow ──────────────────────────────────
  approvalStatus: {
    type: String,
    enum: ['pending_approval', 'approved', 'rejected'],
    default: 'approved',
    index: true,
  },
  adminRejectionReason: { type: String, default: null },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  approvedAt: { type: Date, default: null },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

requirementSchema.index({ is_deleted: 1, isDeleted: 1 });
requirementSchema.index({ customer_id: 1, customer: 1 });
requirementSchema.index({ assignedVendorIds: 1 });
requirementSchema.index({ category: 1 });
requirementSchema.index({ 'location.city': 1 });
requirementSchema.index({ assignedVendorIds: 1, status: 1, isDeleted: 1 });
requirementSchema.index({ approvalStatus: 1, status: 1 });
requirementSchema.index({ title: 'text', description: 'text' }, { name: 'req_text' });

module.exports = mongoose.models.Requirement || mongoose.model('Requirement', requirementSchema, 'requirements');