const mongoose = require('mongoose');

/**
 * SubscriptionInvoice Model
 * Auto-generated invoices for subscription purchases.
 */

let invoiceCounter = 0;

const subscriptionInvoiceSchema = new mongoose.Schema({
  invoice_number: {
    type: String,
    unique: true,
    default: function() {
      const now = new Date();
      const yr = now.getFullYear();
      const seq = String(++invoiceCounter).padStart(5, '0');
      return `INV-${yr}-${seq}-${Date.now().toString(36).toUpperCase().slice(-4)}`;
    },
    index: true,
  },
  user_id: { type: String, required: true, index: true },
  user_name: { type: String, default: null },
  user_email: { type: String, default: null },
  subscription_id: { type: String, default: null },
  plan_id: { type: String, required: true },
  plan_name: { type: String, required: true },
  billing_cycle: { type: String, default: 'monthly' },
  // Amounts
  base_amount: { type: Number, required: true },
  discount_amount: { type: Number, default: 0 },
  coupon_code: { type: String, default: null },
  subtotal: { type: Number, required: true },
  gst_percentage: { type: Number, default: 18 },
  gst_amount: { type: Number, required: true },
  total_amount: { type: Number, required: true },
  // Payment
  payment_status: {
    type: String,
    enum: ['paid', 'pending', 'failed', 'refunded'],
    default: 'paid',
    index: true,
  },
  payment_id: { type: String, default: null },
  payment_method: { type: String, default: 'razorpay' },
  // PDF
  pdf_url: { type: String, default: null },
  pdf_generated: { type: Boolean, default: false },
  // Metadata
  billing_address: { type: mongoose.Schema.Types.Mixed, default: {} },
  hsn_code: { type: String, default: '998314' },
  email_sent: { type: Boolean, default: false },
  email_sent_at: { type: Date, default: null },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  is_deleted: { type: Boolean, default: false },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

subscriptionInvoiceSchema.index({ user_id: 1, created_at: -1 });
subscriptionInvoiceSchema.index({ created_at: -1 });

const registerOrReuse = (name, schema, collection) =>
  mongoose.models[name] || mongoose.model(name, schema, collection);

module.exports = registerOrReuse('SubscriptionInvoice', subscriptionInvoiceSchema, 'subscription_invoices');
