const mongoose = require('mongoose');
const Listing = require('../models/Listing');
const { PlatformSettings } = require('../models/Misc');
const ApiError = require('../utils/ApiError');

const DEFAULT_RATE = 0.05;

// Define Commission Schema inline
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

const resolveRate = async (categoryId) => {
  const doc = await PlatformSettings.findOne({ key: 'singleton' });
  const val = doc ? doc.value || {} : {};
  const rules = val.commission_rules || {};

  if (categoryId && rules.per_category && rules.per_category[categoryId] !== undefined) {
    try {
      return parseFloat(rules.per_category[categoryId]);
    } catch {}
  }
  try {
    return parseFloat(rules.global_rate !== undefined ? rules.global_rate : DEFAULT_RATE);
  } catch {
    return DEFAULT_RATE;
  }
};

const accrueOnDealComplete = async (deal) => {
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

  const rate = await resolveRate(catId);
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
};

const serializeCommission = (c) => {
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
};

const listCommissions = async (status = null, vendorId = null, limit = 50) => {
  const q = { is_deleted: { $ne: true } };
  if (status) {
    q.status = status;
  }
  if (vendorId) {
    q.vendor_id = vendorId;
  }
  const docs = await Commission.find(q).sort({ _id: -1 }).limit(limit);
  return {
    items: docs.map(serializeCommission),
    count: docs.length,
  };
};

const summary = async (periodDays = 30) => {
  const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
  const pipeline = [
    { $match: { is_deleted: { $ne: true }, created_at: { $gte: since } } },
    { $group: { _id: '$status', total: { $sum: '$amount_paise' }, count: { $sum: 1 } } },
  ];
  const rows = await Commission.aggregate(pipeline);
  const agg = {};
  let totalPaise = 0;
  for (const r of rows) {
    agg[r._id] = { total_paise: r.total, count: r.count };
    totalPaise += r.total;
  }

  return {
    period_days: periodDays,
    total_earned_inr: Math.round(totalPaise / 100 * 100) / 100,
    by_status: agg,
  };
};

const markPaid = async (commissionId) => {
  const now = new Date().toISOString();
  const updated = await Commission.findOneAndUpdate(
    { _id: commissionId, is_deleted: { $ne: true } },
    { $set: { status: 'paid_out', paid_out_at: now } },
    { returnDocument: 'after' }
  );
  return serializeCommission(updated);
};

const setGlobalRate = async (rate) => {
  if (rate < 0 || rate > 1) {
    throw ApiError.badRequest('rate must be between 0 and 1');
  }
  const doc = await PlatformSettings.findOne({ key: 'singleton' });
  const val = doc ? doc.value || {} : {};
  if (!val.commission_rules) {
    val.commission_rules = {};
  }
  val.commission_rules.global_rate = rate;
  val.commission_rules.updated_at = new Date().toISOString();

  await PlatformSettings.updateOne(
    { key: 'singleton' },
    { $set: { value: val } },
    { upsert: true }
  );
  return { global_rate: rate };
};

const setCategoryRate = async (categoryId, rate) => {
  if (rate < 0 || rate > 1) {
    throw ApiError.badRequest('rate must be between 0 and 1');
  }
  const doc = await PlatformSettings.findOne({ key: 'singleton' });
  const val = doc ? doc.value || {} : {};
  if (!val.commission_rules) {
    val.commission_rules = {};
  }
  if (!val.commission_rules.per_category) {
    val.commission_rules.per_category = {};
  }
  val.commission_rules.per_category[categoryId] = rate;
  val.commission_rules.updated_at = new Date().toISOString();

  await PlatformSettings.updateOne(
    { key: 'singleton' },
    { $set: { value: val } },
    { upsert: true }
  );
  return { category_id: categoryId, rate };
};

module.exports = {
  accrueOnDealComplete,
  listCommissions,
  summary,
  markPaid,
  setGlobalRate,
  setCategoryRate,
};
