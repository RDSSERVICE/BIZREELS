const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema({
  requirement_id: { type: String, required: true, index: true },
  vendor_id: { type: String, required: true, index: true },
  message: { type: String, required: true },
  quoted_price: { type: Number, default: null },
  attachments: { type: [mongoose.Schema.Types.Mixed], default: [] },
  status: { type: String, enum: ['sent', 'shortlisted', 'rejected', 'accepted'], default: 'sent' },
  is_deleted: { type: Boolean, default: false },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

module.exports = mongoose.model('Proposal', proposalSchema, 'proposals');
