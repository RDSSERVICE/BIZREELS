const { SubscriptionPlan, Coupon } = require('../models/Admin');
const UserSubscription = require('../models/UserSubscription.model');
const SubscriptionInvoice = require('../models/SubscriptionInvoice.model');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * SubscriptionAdminService
 * Complete subscription management for admin panel.
 */
class SubscriptionAdminService {

  // ─── Plan CRUD ────────────────────────────────────────────

  async listPlans(filters = {}) {
    const q = { is_deleted: { $ne: true } };
    if (filters.user_type) {
      q.$or = [
        { target_role: filters.user_type },
        { user_type: filters.user_type }
      ];
    }
    if (filters.is_active !== undefined) q.is_active = filters.is_active === 'true' || filters.is_active === true;
    if (filters.is_archived !== undefined) q.is_archived = filters.is_archived === 'true';
    
    const plans = await SubscriptionPlan.find(q).sort({ sort_order: 1, price_inr: 1 });
    return { items: plans.map(this._serializePlan) };
  }

  async createPlan(data) {
    if (data.user_type && !data.target_role) {
      data.target_role = data.user_type;
    } else if (data.target_role && !data.user_type) {
      data.user_type = data.target_role;
    }
    const plan = await SubscriptionPlan.create(data);
    this._emitUpdate(['SubscriptionPlans']);
    return this._serializePlan(plan);
  }

  async updatePlan(id, data) {
    if (data.user_type) {
      data.target_role = data.user_type;
    } else if (data.target_role) {
      data.user_type = data.target_role;
    }
    const plan = await SubscriptionPlan.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' });
    if (!plan) throw ApiError.notFound('Plan not found');
    this._emitUpdate(['SubscriptionPlans']);
    return this._serializePlan(plan);
  }

  async deletePlan(id) {
    await SubscriptionPlan.updateOne({ _id: id }, { $set: { is_deleted: true } });
    this._emitUpdate(['SubscriptionPlans']);
    return { ok: true };
  }

  async activatePlan(id) {
    await SubscriptionPlan.updateOne({ _id: id }, { $set: { is_active: true, is_archived: false } });
    this._emitUpdate(['SubscriptionPlans']);
    return { ok: true };
  }

  async deactivatePlan(id) {
    await SubscriptionPlan.updateOne({ _id: id }, { $set: { is_active: false } });
    this._emitUpdate(['SubscriptionPlans']);
    return { ok: true };
  }

  async archivePlan(id) {
    await SubscriptionPlan.updateOne({ _id: id }, { $set: { is_archived: true, is_active: false } });
    this._emitUpdate(['SubscriptionPlans']);
    return { ok: true };
  }

  async duplicatePlan(id) {
    const original = await SubscriptionPlan.findById(id).lean();
    if (!original) throw ApiError.notFound('Plan not found');
    delete original._id;
    delete original.__v;
    original.title = `${original.title} (Copy)`;
    original.is_active = false;
    const newPlan = await SubscriptionPlan.create(original);
    this._emitUpdate(['SubscriptionPlans']);
    return this._serializePlan(newPlan);
  }

  // ─── User Subscriptions ───────────────────────────────────

  async listUserSubscriptions({ page = 1, limit = 25, status, user_role, search }) {
    const q = { is_deleted: { $ne: true } };
    if (status) q.status = status;
    if (user_role) q.user_role = user_role;
    if (search) {
      const escaped = String(search).trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      q.$or = [
        { user_id: { $regex: escaped, $options: 'i' } },
        { user_name: { $regex: escaped, $options: 'i' } },
        { plan_name: { $regex: escaped, $options: 'i' } },
      ];
    }

    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      UserSubscription.find(q).sort({ _id: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      UserSubscription.countDocuments(q),
    ]);

    return {
      items: items.map(this._serializeUserSub),
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      total_pages: Math.ceil(total / parseInt(limit)),
    };
  }

  async cancelSubscription(subId, adminId, reason) {
    const sub = await UserSubscription.findById(subId);
    if (!sub) throw ApiError.notFound('Subscription not found');
    
    await UserSubscription.updateOne({ _id: subId }, {
      $set: { status: 'cancelled', cancelled_at: new Date(), cancelled_reason: reason || 'Cancelled by admin', auto_renewal: false },
    });
    
    await User.updateOne({ _id: sub.user_id }, { $set: { is_subscribed_verified: false } });
    this._emitUpdate(['UserSubscriptions', 'AdminOverview']);
    this._notifyUser(sub.user_id, 'Your subscription has been cancelled', reason);
    return { ok: true };
  }

  async extendSubscription(subId, days, adminId) {
    const sub = await UserSubscription.findById(subId);
    if (!sub) throw ApiError.notFound('Subscription not found');
    
    const currentExpiry = new Date(sub.expiry_date);
    const newExpiry = new Date(currentExpiry.getTime() + days * 24 * 60 * 60 * 1000);
    
    await UserSubscription.updateOne({ _id: subId }, {
      $set: { expiry_date: newExpiry, status: 'active' },
    });
    
    this._emitUpdate(['UserSubscriptions']);
    this._notifyUser(sub.user_id, `Your subscription has been extended by ${days} days`, '');
    return { ok: true, new_expiry: newExpiry };
  }

  async renewSubscription(subId, adminId) {
    const sub = await UserSubscription.findById(subId);
    if (!sub) throw ApiError.notFound('Subscription not found');
    
    const plan = await SubscriptionPlan.findById(sub.plan_id);
    const durationDays = plan?.duration_days || 30;
    const newExpiry = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    
    await UserSubscription.updateOne({ _id: subId }, {
      $set: { expiry_date: newExpiry, status: 'active', start_date: new Date() },
      $inc: { renewed_count: 1 },
    });
    
    await User.updateOne({ _id: sub.user_id }, { $set: { is_subscribed_verified: true } });
    this._emitUpdate(['UserSubscriptions', 'AdminOverview']);
    this._notifyUser(sub.user_id, 'Your subscription has been renewed', '');
    return { ok: true, new_expiry: newExpiry };
  }

  // ─── Coupon CRUD ──────────────────────────────────────────

  async listCoupons(filters = {}) {
    const q = { is_deleted: { $ne: true } };
    if (filters.applicable_to) q.applicable_to = filters.applicable_to;
    if (filters.is_active !== undefined) q.is_active = filters.is_active === 'true' || filters.is_active === true;
    
    const coupons = await Coupon.find(q).sort({ _id: -1 });
    return {
      items: coupons.map(c => ({
        id: c._id.toString(),
        code: c.code,
        type: c.type,
        value: c.value,
        max_discount_inr: c.max_discount_inr,
        max_discount_amount: c.max_discount_amount,
        min_order_inr: c.min_order_inr,
        min_purchase_amount: c.min_purchase_amount,
        usage_limit: c.usage_limit,
        used_count: c.used_count,
        applicable_to: c.applicable_to,
        user_type_restriction: c.user_type_restriction,
        plan_restriction: c.plan_restriction,
        valid_from: c.valid_from || c.start_date,
        valid_until: c.valid_until || c.end_date,
        is_active: c.is_active,
        description: c.description,
        created_at: c.created_at,
      })),
    };
  }

  async createCoupon(data) {
    const coupon = await Coupon.create(data);
    this._emitUpdate(['Coupons']);
    return coupon;
  }

  async updateCoupon(id, data) {
    const coupon = await Coupon.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' });
    if (!coupon) throw ApiError.notFound('Coupon not found');
    this._emitUpdate(['Coupons']);
    return coupon;
  }

  async deleteCoupon(id) {
    await Coupon.updateOne({ _id: id }, { $set: { is_deleted: true } });
    this._emitUpdate(['Coupons']);
    return { ok: true };
  }

  async toggleCoupon(id) {
    const coupon = await Coupon.findById(id);
    if (!coupon) throw ApiError.notFound('Coupon not found');
    coupon.is_active = !coupon.is_active;
    await coupon.save();
    this._emitUpdate(['Coupons']);
    return { ok: true, is_active: coupon.is_active };
  }

  // ─── Invoices ─────────────────────────────────────────────

  async listInvoices({ page = 1, limit = 25, search, payment_status }) {
    const q = { is_deleted: { $ne: true } };
    if (payment_status) q.payment_status = payment_status;
    if (search) {
      const escaped = String(search).trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      q.$or = [
        { invoice_number: { $regex: escaped, $options: 'i' } },
        { user_name: { $regex: escaped, $options: 'i' } },
        { user_id: { $regex: escaped, $options: 'i' } },
      ];
    }

    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      SubscriptionInvoice.find(q).sort({ _id: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      SubscriptionInvoice.countDocuments(q),
    ]);

    return {
      items: items.map(inv => ({
        id: inv._id.toString(),
        invoice_number: inv.invoice_number,
        user_id: inv.user_id,
        user_name: inv.user_name,
        plan_name: inv.plan_name,
        billing_cycle: inv.billing_cycle,
        base_amount: inv.base_amount,
        discount_amount: inv.discount_amount,
        gst_percentage: inv.gst_percentage,
        gst_amount: inv.gst_amount,
        total_amount: inv.total_amount,
        payment_status: inv.payment_status,
        coupon_code: inv.coupon_code,
        pdf_generated: inv.pdf_generated,
        created_at: inv.created_at,
      })),
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      total_pages: Math.ceil(total / parseInt(limit)),
    };
  }

  async generateInvoicePDF(invoiceId) {
    const PDFDocument = require('pdfkit');
    const inv = await SubscriptionInvoice.findById(invoiceId).lean();
    if (!inv) throw ApiError.notFound('Invoice not found');

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('BizReels', 50, 50);
      doc.fontSize(10).font('Helvetica').text('Invoice', 450, 50, { align: 'right' });
      doc.fontSize(8).text(`#${inv.invoice_number}`, 450, 65, { align: 'right' });
      doc.text(`Date: ${new Date(inv.created_at).toLocaleDateString('en-IN')}`, 450, 78, { align: 'right' });

      doc.moveTo(50, 100).lineTo(550, 100).stroke();

      // Bill To
      doc.fontSize(10).font('Helvetica-Bold').text('Bill To:', 50, 115);
      doc.fontSize(9).font('Helvetica').text(inv.user_name || 'Customer', 50, 130);
      doc.text(`User ID: ${inv.user_id}`, 50, 143);
      if (inv.user_email) doc.text(`Email: ${inv.user_email}`, 50, 156);

      // Table Header
      const tableTop = 190;
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Description', 50, tableTop);
      doc.text('Qty', 300, tableTop, { width: 50, align: 'center' });
      doc.text('Rate', 360, tableTop, { width: 80, align: 'right' });
      doc.text('Amount', 450, tableTop, { width: 100, align: 'right' });
      
      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      // Item
      const itemY = tableTop + 25;
      doc.font('Helvetica');
      doc.text(`${inv.plan_name} (${inv.billing_cycle})`, 50, itemY);
      doc.text('1', 300, itemY, { width: 50, align: 'center' });
      doc.text(`₹${inv.base_amount}`, 360, itemY, { width: 80, align: 'right' });
      doc.text(`₹${inv.base_amount}`, 450, itemY, { width: 100, align: 'right' });

      // Totals
      const totalsY = itemY + 40;
      doc.moveTo(350, totalsY).lineTo(550, totalsY).stroke();
      
      doc.text('Subtotal:', 350, totalsY + 10, { width: 100, align: 'right' });
      doc.text(`₹${inv.subtotal}`, 450, totalsY + 10, { width: 100, align: 'right' });
      
      if (inv.discount_amount > 0) {
        doc.text('Discount:', 350, totalsY + 25, { width: 100, align: 'right' });
        doc.text(`-₹${inv.discount_amount}`, 450, totalsY + 25, { width: 100, align: 'right' });
      }
      
      doc.text(`GST (${inv.gst_percentage}%):`, 350, totalsY + 40, { width: 100, align: 'right' });
      doc.text(`₹${inv.gst_amount}`, 450, totalsY + 40, { width: 100, align: 'right' });
      
      doc.moveTo(350, totalsY + 55).lineTo(550, totalsY + 55).stroke();
      doc.font('Helvetica-Bold');
      doc.text('Total:', 350, totalsY + 62, { width: 100, align: 'right' });
      doc.text(`₹${inv.total_amount}`, 450, totalsY + 62, { width: 100, align: 'right' });

      // Footer
      doc.fontSize(8).font('Helvetica').text(`HSN Code: ${inv.hsn_code || '998314'}`, 50, 700);
      doc.text('Payment Status: ' + inv.payment_status.toUpperCase(), 50, 712);
      doc.text('This is a computer-generated invoice.', 50, 730);

      doc.end();
    });
  }

  // ─── Revenue Summary ──────────────────────────────────────

  async getRevenueSummary() {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisYearStart = new Date(now.getFullYear(), 0, 1);

    const [
      totalActive, totalExpired, monthlyRevenue, yearlyRevenue,
      renewalCount, cancelCount, planDistribution
    ] = await Promise.all([
      UserSubscription.countDocuments({ status: 'active', is_deleted: { $ne: true } }),
      UserSubscription.countDocuments({ status: 'expired', is_deleted: { $ne: true } }),
      SubscriptionInvoice.aggregate([
        { $match: { payment_status: 'paid', created_at: { $gte: thisMonthStart.toISOString() }, is_deleted: { $ne: true } } },
        { $group: { _id: null, total: { $sum: '$total_amount' }, count: { $sum: 1 } } },
      ]),
      SubscriptionInvoice.aggregate([
        { $match: { payment_status: 'paid', created_at: { $gte: thisYearStart.toISOString() }, is_deleted: { $ne: true } } },
        { $group: { _id: null, total: { $sum: '$total_amount' }, count: { $sum: 1 } } },
      ]),
      UserSubscription.countDocuments({ renewed_count: { $gte: 1 }, is_deleted: { $ne: true } }),
      UserSubscription.countDocuments({ status: 'cancelled', is_deleted: { $ne: true } }),
      UserSubscription.aggregate([
        { $match: { status: 'active', is_deleted: { $ne: true } } },
        { $group: { _id: '$plan_name', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const totalSubs = totalActive + totalExpired + cancelCount;

    // Monthly revenue trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const agg = await SubscriptionInvoice.aggregate([
        { $match: { payment_status: 'paid', created_at: { $gte: d.toISOString(), $lt: nextMonth.toISOString() }, is_deleted: { $ne: true } } },
        { $group: { _id: null, total: { $sum: '$total_amount' }, count: { $sum: 1 } } },
      ]);
      monthlyTrend.push({
        month: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        revenue: agg[0]?.total || 0,
        count: agg[0]?.count || 0,
      });
    }

    return {
      active_subscribers: totalActive,
      expired_subscribers: totalExpired,
      cancelled_subscribers: cancelCount,
      monthly_revenue: monthlyRevenue[0]?.total || 0,
      monthly_transactions: monthlyRevenue[0]?.count || 0,
      yearly_revenue: yearlyRevenue[0]?.total || 0,
      yearly_transactions: yearlyRevenue[0]?.count || 0,
      renewal_rate: totalSubs > 0 ? Math.round((renewalCount / totalSubs) * 100) : 0,
      cancellation_rate: totalSubs > 0 ? Math.round((cancelCount / totalSubs) * 100) : 0,
      top_plans: planDistribution.map(p => ({ name: p._id, count: p.count })),
      monthly_trend: monthlyTrend,
    };
  }

  // ─── Helpers ──────────────────────────────────────────────

  _serializePlan(p) {
    if (!p) return null;
    const obj = p.toObject ? p.toObject() : { ...p };
    return {
      id: (obj._id || obj.id).toString(),
      title: obj.title,
      description: obj.description,
      plan_type: obj.plan_type || 'basic',
      user_type: obj.user_type || obj.target_role || 'vendor',
      billing_cycle: obj.billing_cycle,
      price_inr: obj.price_inr,
      monthly_price: obj.monthly_price || obj.price_inr,
      quarterly_price: obj.quarterly_price || 0,
      half_yearly_price: obj.half_yearly_price || 0,
      yearly_price: obj.yearly_price || 0,
      discount_percentage: obj.discount_percentage || 0,
      duration_days: obj.duration_days || 30,
      features: obj.features,
      features_list: obj.features_list || [],
      target_role: obj.target_role || 'vendor',
      product_limit: obj.product_limit,
      service_limit: obj.service_limit,
      reels_limit: obj.reels_limit,
      leads_limit: obj.leads_limit,
      ai_credits: obj.ai_credits || 0,
      offer_creation_limit: obj.offer_creation_limit,
      max_listings: obj.max_listings,
      verification_badge: obj.verification_badge || false,
      verified_badge: obj.verified_badge !== false,
      priority_support: obj.priority_support || false,
      analytics_access: obj.analytics_access || false,
      priority_ranking: obj.priority_ranking || false,
      is_active: obj.is_active !== false,
      is_archived: obj.is_archived || false,
      sort_order: obj.sort_order || 0,
      created_at: obj.created_at,
    };
  }

  _serializeUserSub(s) {
    return {
      id: s._id.toString(),
      user_id: s.user_id,
      user_name: s.user_name,
      user_role: s.user_role,
      plan_id: s.plan_id,
      plan_name: s.plan_name,
      plan_type: s.plan_type,
      billing_cycle: s.billing_cycle,
      start_date: s.start_date,
      expiry_date: s.expiry_date,
      auto_renewal: s.auto_renewal,
      status: s.status,
      paid_amount: s.paid_amount,
      original_amount: s.original_amount,
      discount_amount: s.discount_amount,
      gst_amount: s.gst_amount,
      renewed_count: s.renewed_count || 0,
      created_at: s.created_at,
    };
  }

  _emitUpdate(tags) {
    try {
      if (tags && tags.includes('SubscriptionPlans')) {
        const cache = require('../utils/cache');
        // Clear all role-specific cache variants
        cache.deleteCache('subscription:plans');
        cache.deleteCache('subscription:plans:all');
        cache.deleteCache('subscription:plans:vendor');
        cache.deleteCache('subscription:plans:creator');
      }
    } catch (err) {}
    try {
      const { emitToAdmin, emitToRole } = require('../sockets');
      emitToAdmin('admin:update', { tags });
      emitToRole('vendor', 'subscription:updated', { updated: true });
      emitToRole('creator', 'subscription:updated', { updated: true });
    } catch (err) {}
  }

  _notifyUser(userId, title, message) {
    try {
      const notificationService = require('./notification.service');
      notificationService.create(userId, 'subscription', title, message || '', {}, '/subscriptions', null);
    } catch (err) {}
  }
}

module.exports = new SubscriptionAdminService();
