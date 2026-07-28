const mongoose = require('mongoose');
const Listing = require('../models/Listing');
const Category = require('../models/Category');
const CommissionConfig = require('../models/CommissionConfig.model');
const CommissionHistory = require('../models/CommissionHistory.model');
const LeadBoostConfig = require('../models/LeadBoostConfig.model');
const GSTConfig = require('../models/GSTConfig.model');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const cache = require('../utils/cache');

const DEFAULT_RATE = 5.0; // 5% default

// Inline Commission model definition for backward compatibility
const commissionSchema = new mongoose.Schema({
  deal_id: { type: String, required: true },
  vendor_id: { type: String, required: true },
  buyer_id: { type: String, required: true },
  listing_id: { type: String, default: null },
  category_id: { type: String, default: null },
  deal_amount_inr: { type: Number, required: true },
  amount_paise: { type: Number, required: true },
  rate: { type: Number, required: true },
  status: { type: String, enum: ['accrued', 'paid_out'], default: 'accrued' },
  paid_out_at: { type: String, default: null },
  is_deleted: { type: Boolean, default: false },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

let Commission;
try {
  Commission = mongoose.model('Commission');
} catch {
  Commission = mongoose.model('Commission', commissionSchema, 'commissions');
}

/**
 * CommissionService
 * Manages platform commissions, creator/listing commissions, GST, lead/boost configurations, and audit logging.
 */
class CommissionService {

  // ─── Commission Resolving ─────────────────────────────────

  async resolveRate(categoryId) {
    if (categoryId) {
      const catConfig = await CommissionConfig.findOne({ config_type: 'category', category_id: categoryId, is_active: true });
      if (catConfig) return catConfig.rate / 100; // stored as e.g. 8 for 8%
    }
    const globalConfig = await CommissionConfig.findOne({ config_type: 'global' });
    return globalConfig ? globalConfig.rate / 100 : DEFAULT_RATE / 100;
  }

  async accrueOnDealComplete(deal) {
    if (!deal) return null;
    const dealId = (deal._id || deal.id).toString();

    const existing = await Commission.findOne({ deal_id: dealId, is_deleted: { $ne: true } });
    if (existing) return null;

    const amount = parseInt(deal.final_amount || deal.current_offer || deal.initial_offer || 0, 10);
    if (amount <= 0) return null;

    let catId = null;
    const lid = deal.listing_id;
    if (lid) {
      const lst = await Listing.findById(lid);
      if (lst && lst.category_id) {
        catId = lst.category_id.toString();
      }
    }

    const rate = await this.resolveRate(catId);
    const commissionPaise = Math.round(amount * rate * 100);

    const doc = await Commission.create({
      deal_id: dealId,
      vendor_id: (deal.seller_id || '').toString(),
      buyer_id: (deal.buyer_id || '').toString(),
      listing_id: lid ? lid.toString() : null,
      category_id: catId,
      deal_amount_inr: amount,
      amount_paise: commissionPaise,
      rate,
      status: 'accrued',
    });

    return doc.toObject();
  }

  // ─── Configurations & Settings Getters ────────────────────

  async getFullConfig() {
    const cacheKey = 'commission:fullconfig';
    const cached = await cache.getCache(cacheKey);
    if (cached) return cached;

    const [configs, leadBoostDoc, gstDoc] = await Promise.all([
      CommissionConfig.find({}).lean(),
      LeadBoostConfig.findOne({ key: 'singleton' }),
      GSTConfig.findOne({ key: 'singleton' }),
    ]);

    let leadBoost = leadBoostDoc ? (leadBoostDoc.toObject ? leadBoostDoc.toObject() : leadBoostDoc) : null;
    if (!leadBoost) {
      const created = await LeadBoostConfig.create({ key: 'singleton' });
      leadBoost = created.toObject();
    }

    let gst = gstDoc ? (gstDoc.toObject ? gstDoc.toObject() : gstDoc) : null;
    if (!gst) {
      const created = await GSTConfig.create({ key: 'singleton' });
      gst = created.toObject();
    }

    const result = {
      commissions: configs.map(c => ({
        id: c._id.toString(),
        config_type: c.config_type,
        category_id: c.category_id,
        category_name: c.category_name,
        rate: c.rate,
        is_active: c.is_active,
        description: c.description,
      })),
      lead_boost: {
        lead_cost_credits: leadBoost.lead_cost_credits,
        featured_listing_credits: leadBoost.featured_listing_credits,
        reel_boost_credits: leadBoost.reel_boost_credits,
        ai_promotion_credits: leadBoost.ai_promotion_credits,
        ad_charge_credits: leadBoost.ad_charge_credits,
      },
      gst: {
        gst_percentage: gst.gst_percentage,
        hsn_codes: gst.hsn_codes,
        tax_rules: gst.tax_rules,
      },
    };

    await cache.setCache(cacheKey, result, 86400); // cache for 24h
    return result;
  }

  // ─── Set Configurations (Admin) ───────────────────────────

  async updateCommissionConfig({ config_type, category_id, rate, reason, admin_id, admin_name, ip }) {
    if (rate < 0 || rate > 100) throw ApiError.badRequest('Rate must be between 0 and 100 percent');
    if (!reason) throw ApiError.badRequest('Reason for configuration change is required');

    let oldRate = DEFAULT_RATE;
    let query = { config_type };
    if (config_type === 'category') {
      if (!category_id) throw ApiError.badRequest('Category ID is required for category configurations');
      query.category_id = category_id;
    }

    let config = await CommissionConfig.findOne(query);
    if (config) {
      oldRate = config.rate;
      config.rate = rate;
      await config.save();
    } else {
      let categoryName = null;
      if (category_id) {
        const cat = await Category.findById(category_id).lean();
        categoryName = cat?.name || null;
      }
      config = await CommissionConfig.create({
        config_type,
        category_id,
        category_name: categoryName,
        rate,
      });
    }

    // Write audit trail
    await CommissionHistory.create({
      config_type,
      category_id: category_id?.toString() || null,
      category_name: config.category_name,
      old_rate: oldRate,
      new_rate: rate,
      admin_id,
      admin_name,
      reason,
      ip_address: ip,
    });

    this._emitUpdate(['CommissionConfig', 'CommissionHistory']);
    return config;
  }

  async updateLeadBoostConfig(data, { reason, admin_id, admin_name, ip }) {
    if (!reason) throw ApiError.badRequest('Reason is required');

    const config = await LeadBoostConfig.findOne({ key: 'singleton' }) || new LeadBoostConfig({ key: 'singleton' });
    
    // Log history for each updated rate
    const fields = ['lead_cost_credits', 'featured_listing_credits', 'reel_boost_credits', 'ai_promotion_credits', 'ad_charge_credits'];
    for (const f of fields) {
      if (data[f] !== undefined && data[f] !== config[f]) {
        await CommissionHistory.create({
          config_type: `lead_boost_${f}`,
          old_rate: config[f],
          new_rate: data[f],
          admin_id,
          admin_name,
          reason: `Lead/Boost setting update: ${reason}`,
          ip_address: ip,
        });
        config[f] = data[f];
      }
    }
    await config.save();
    this._emitUpdate(['LeadBoostConfig', 'CommissionHistory']);
    return config;
  }

  async updateGSTConfig(data, { reason, admin_id, admin_name, ip }) {
    if (!reason) throw ApiError.badRequest('Reason is required');
    const config = await GSTConfig.findOne({ key: 'singleton' }) || new GSTConfig({ key: 'singleton' });

    if (data.gst_percentage !== undefined && data.gst_percentage !== config.gst_percentage) {
      await CommissionHistory.create({
        config_type: 'gst_rate',
        old_rate: config.gst_percentage,
        new_rate: data.gst_percentage,
        admin_id,
        admin_name,
        reason: `GST rate update: ${reason}`,
        ip_address: ip,
      });
      config.gst_percentage = data.gst_percentage;
    }
    if (data.hsn_codes) config.hsn_codes = data.hsn_codes;
    if (data.tax_rules) config.tax_rules = data.tax_rules;

    await config.save();
    this._emitUpdate(['GSTConfig', 'CommissionHistory']);
    return config;
  }

  // ─── Listing & Audit History ──────────────────────────────

  async listCommissions(status = null, vendorId = null, limit = 50) {
    const q = { is_deleted: { $ne: true } };
    if (status) q.status = status;
    if (vendorId) q.vendor_id = vendorId;

    const docs = await Commission.find(q).sort({ _id: -1 }).limit(limit);
    return {
      items: docs.map(this._serializeCommission),
      count: docs.length,
    };
  }

  async getAuditTrail({ page = 1, limit = 25 }) {
    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      CommissionHistory.find({}).sort({ created_at: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      CommissionHistory.countDocuments({}),
    ]);

    return {
      items: items.map(h => ({
        id: h._id.toString(),
        config_type: h.config_type,
        category_name: h.category_name,
        old_rate: h.old_rate,
        new_rate: h.new_rate,
        admin_name: h.admin_name || 'System Admin',
        reason: h.reason,
        ip_address: h.ip_address,
        created_at: h.created_at,
      })),
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      total_pages: Math.ceil(total / parseInt(limit)),
    };
  }

  async getAnalytics(periodDays = 30) {
    const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
    const totalCommissions = await Commission.aggregate([
      { $match: { is_deleted: { $ne: true }, created_at: { $gte: since } } },
      { $group: { _id: '$status', total: { $sum: '$amount_paise' }, count: { $sum: 1 } } },
    ]);

    const stats = {};
    let totalEarned = 0;
    for (const r of totalCommissions) {
      stats[r._id] = { total_paise: r.total, count: r.count };
      totalEarned += r.total;
    }

    // Trend analysis (e.g. daily for last 7 days)
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d.setHours(0,0,0,0)).toISOString();
      const end = new Date(d.setHours(23,59,59,999)).toISOString();

      const agg = await Commission.aggregate([
        { $match: { is_deleted: { $ne: true }, created_at: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$amount_paise' } } },
      ]);

      trend.push({
        date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        commission: (agg[0]?.total || 0) / 100,
      });
    }

    return {
      period_days: periodDays,
      total_earned_inr: Math.round(totalEarned / 100),
      stats,
      trend,
    };
  }

  async markPaid(commissionId) {
    const now = new Date().toISOString();
    const updated = await Commission.findOneAndUpdate(
      { _id: commissionId, is_deleted: { $ne: true } },
      { $set: { status: 'paid_out', paid_out_at: now } },
      { returnDocument: 'after' }
    );

    this._emitUpdate(['AdminCommissions']);
    return this._serializeCommission(updated);
  }

  // ─── Set Rates (Retro-compatibility helpers) ──────────────

  async setGlobalRate(rate) {
    const updated = await this.updateCommissionConfig({
      config_type: 'global',
      rate: rate * 100, // converted to e.g. 5
      reason: 'Legacy API configuration sync',
      admin_id: 'legacy_api',
    });
    return { global_rate: updated.rate / 100 };
  }

  async setCategoryRate(categoryId, rate) {
    const updated = await this.updateCommissionConfig({
      config_type: 'category',
      category_id: categoryId,
      rate: rate * 100,
      reason: 'Legacy API configuration sync',
      admin_id: 'legacy_api',
    });
    return { category_id: categoryId, rate: updated.rate / 100 };
  }

  async summary(periodDays = 30) {
    const res = await this.getAnalytics(periodDays);
    return {
      period_days: periodDays,
      total_earned_inr: res.total_earned_inr,
      by_status: res.stats,
    };
  }

  // ─── Helpers ──────────────────────────────────────────────

  _serializeCommission(c) {
    if (!c) return null;
    return {
      id: c._id.toString(),
      deal_id: c.deal_id,
      vendor_id: c.vendor_id,
      buyer_id: c.buyer_id,
      listing_id: c.listing_id,
      category_id: c.category_id,
      deal_amount_inr: c.deal_amount_inr,
      amount_paise: c.amount_paise,
      amount_inr: Math.round((c.amount_paise || 0) / 100 * 100) / 100,
      rate: c.rate,
      status: c.status,
      created_at: c.created_at,
      paid_out_at: c.paid_out_at,
    };
  }

  _emitUpdate(tags) {
    try {
      const cache = require('../utils/cache');
      cache.deleteCache('commission:fullconfig');
    } catch (err) {}
    try {
      const { emitToAdmin } = require('../sockets');
      emitToAdmin('admin:update', { tags });
    } catch (err) {}
  }
}

const serviceInstance = new CommissionService();

// Export as both instance (module.exports = instance) and properties for backward compatibility
module.exports = {
  accrueOnDealComplete: serviceInstance.accrueOnDealComplete.bind(serviceInstance),
  listCommissions: serviceInstance.listCommissions.bind(serviceInstance),
  summary: serviceInstance.summary.bind(serviceInstance),
  markPaid: serviceInstance.markPaid.bind(serviceInstance),
  setGlobalRate: serviceInstance.setGlobalRate.bind(serviceInstance),
  setCategoryRate: serviceInstance.setCategoryRate.bind(serviceInstance),
  
  // New service instance methods exports
  getFullConfig: serviceInstance.getFullConfig.bind(serviceInstance),
  updateCommissionConfig: serviceInstance.updateCommissionConfig.bind(serviceInstance),
  updateLeadBoostConfig: serviceInstance.updateLeadBoostConfig.bind(serviceInstance),
  updateGSTConfig: serviceInstance.updateGSTConfig.bind(serviceInstance),
  getAuditTrail: serviceInstance.getAuditTrail.bind(serviceInstance),
  getAnalytics: serviceInstance.getAnalytics.bind(serviceInstance),
};
