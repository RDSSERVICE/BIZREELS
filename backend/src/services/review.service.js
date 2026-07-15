const { Review } = require('../models/Phase4');
const Listing = require('../models/Listing');
const Deal = require('../models/Deal');
const User = require('../models/User');
const Interaction = require('../models/Interaction');
const notificationService = require('./notification.service');
const walletService = require('./wallet.service');
const ApiError = require('../utils/ApiError');

const serializeReview = (doc) => {
  if (!doc) return null;
  const d = doc.toObject ? doc.toObject() : { ...doc };
  if (d._id) {
    d.id = d._id.toString();
    delete d._id;
  }
  const idFields = ['reviewer_id', 'target_id', 'listing_id', 'deal_id'];
  for (const k of idFields) {
    if (d[k]) {
      d[k] = d[k].toString();
    }
  }
  delete d.is_deleted;
  delete d.__v;
  return d;
};

const createReview = async (reviewerId, body) => {
  const rating = parseInt(body.rating, 10);
  if (![1, 2, 3, 4, 5].includes(rating)) {
    throw ApiError.badRequest('rating must be 1-5');
  }
  if (!['vendor', 'listing', 'service'].includes(body.target_type)) {
    throw ApiError.badRequest('invalid target_type');
  }
  if (!body.target_id) {
    throw ApiError.badRequest('invalid target_id');
  }

  const existing = await Review.findOne({
    reviewer_id: reviewerId,
    target_type: body.target_type,
    target_id: body.target_id,
    is_deleted: { $ne: true },
  });
  if (existing) {
    throw ApiError.badRequest('You already reviewed this. PATCH to update.');
  }

  let isVerifiedPurchase = false;
  const dealId = body.deal_id;
  if (dealId) {
    const deal = await Deal.findById(dealId);
    if (!deal) {
      throw ApiError.notFound('Deal not found');
    }
    if (deal.status !== 'completed') {
      throw ApiError.forbidden('Deal is not completed');
    }
    if (reviewerId !== deal.buyer_id.toString() && reviewerId !== deal.seller_id.toString()) {
      throw ApiError.forbidden('Only deal participants can post a verified review');
    }
    isVerifiedPurchase = true;
  } else if (body.target_type === 'listing' || body.target_type === 'service') {
    throw ApiError.forbidden('deal_id required for listing/service reviews');
  }

  const doc = await Review.create({
    reviewer_id: reviewerId,
    target_type: body.target_type,
    target_id: body.target_id,
    listing_id: body.listing_id || null,
    deal_id: body.deal_id || null,
    rating,
    comment: body.comment || null,
    images: body.images || [],
    videos: (body.videos || []).slice(0, 2),
    is_verified_purchase: isVerifiedPurchase,
    helpful_count: 0,
    reply: null,
  });

  // Update vendor's rating if target is vendor
  if (body.target_type === 'vendor') {
    const agg = await Review.aggregate([
      { $match: { target_type: 'vendor', target_id: body.target_id, is_deleted: { $ne: true } } },
      { $group: { _id: null, avg: { $avg: '$rating' }, n: { $sum: 1 } } },
    ]);
    if (agg.length > 0) {
      await User.updateOne(
        { _id: body.target_id },
        { $set: { rating_avg: Math.round(agg[0].avg * 100) / 100, rating_count: agg[0].n } }
      );
    }
    await notificationService.create(
      body.target_id,
      'review',
      `New ${rating}★ review`,
      (body.comment || '').slice(0, 120),
      {},
      `/vendor/${body.target_id}`
    );
  } else if (['listing', 'service'].includes(body.target_type)) {
    const listing = await Listing.findById(body.target_id);
    if (listing && listing.vendor_id) {
      const vendorId = listing.vendor_id.toString();
      if (vendorId !== reviewerId) {
        await notificationService.create(
          vendorId,
          'review',
          `New ${rating}★ review on your listing`,
          (body.comment || listing.title || '').slice(0, 120),
          {},
          `/listing/${listing.slug || body.target_id}`
        );
      }
    }
  }

  if (isVerifiedPurchase) {
    await walletService.earnCredits(
      reviewerId,
      walletService.CREDIT_RULES.verified_purchase_review,
      'Verified purchase review',
      'review',
      doc._id.toString()
    );
  }

  return serializeReview(doc);
};

const listReviews = async (targetType, targetId, sort = 'recent', cursor = null, limit = 20) => {
  const q = { target_type: targetType, target_id: targetId, is_deleted: { $ne: true } };
  if (cursor) {
    q._id = { $lt: cursor };
  }

  const sortSpecMap = {
    recent: { _id: -1 },
    helpful: { helpful_count: -1, _id: -1 },
    rating_high: { rating: -1, _id: -1 },
    rating_low: { rating: 1, _id: -1 },
  };
  const sortSpec = sortSpecMap[sort] || { _id: -1 };

  const docs = await Review.find(q).sort(sortSpec).limit(limit + 1);
  const hasMore = docs.length > limit;
  const sliced = docs.slice(0, limit);

  // Attach reviewer basic info
  const rids = Array.from(new Set(sliced.map(d => d.reviewer_id)));
  const users = rids.length > 0 ? await User.find({ _id: { $in: rids } }) : [];
  const umap = {};
  for (const u of users) {
    umap[u._id.toString()] = u;
  }

  const items = sliced.map(d => {
    const item = serializeReview(d);
    const u = umap[item.reviewer_id] || {};
    item.reviewer = {
      id: item.reviewer_id,
      name: u.name || null,
      profile_pic: u.profile_pic || null,
    };
    return item;
  });

  return {
    items,
    next_cursor: hasMore && items.length > 0 ? items[items.length - 1].id : null,
    has_more: hasMore,
  };
};

const summary = async (targetType, targetId) => {
  const agg = await Review.aggregate([
    { $match: { target_type: targetType, target_id: targetId, is_deleted: { $ne: true } } },
    { $group: { _id: '$rating', n: { $sum: 1 } } },
  ]);

  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;
  let totalRating = 0;
  for (const row of agg) {
    dist[row._id] = row.n;
    total += row.n;
    totalRating += row._id * row.n;
  }

  const vp = await Review.countDocuments({
    target_type: targetType,
    target_id: targetId,
    is_deleted: { $ne: true },
    is_verified_purchase: true,
  });

  return {
    avg_rating: total ? Math.round((totalRating / total) * 100) / 100 : 0.0,
    total_reviews: total,
    distribution: dist,
    verified_purchase_count: vp,
  };
};

const replyToReview = async (reviewId, replierId, text) => {
  const r = await Review.findOne({ _id: reviewId, is_deleted: { $ne: true } });
  if (!r) {
    throw ApiError.notFound('Review not found');
  }

  let ok = (r.target_type === 'vendor' && r.target_id === replierId);
  if (!ok && r.listing_id) {
    const listing = await Listing.findById(r.listing_id);
    if (listing && listing.vendor_id.toString() === replierId) {
      ok = true;
    }
  }
  if (!ok) {
    throw ApiError.forbidden('Only the reviewed vendor can reply');
  }

  const reply = { text: String(text).trim().slice(0, 500), replied_at: new Date().toISOString() };
  await Review.updateOne({ _id: reviewId }, { $set: { reply, updated_at: new Date().toISOString() } });
  return { ok: true, reply };
};

const updateReview = async (reviewId, reviewerId, body) => {
  const r = await Review.findById(reviewId);
  if (!r || r.reviewer_id !== reviewerId) {
    throw ApiError.forbidden('Not your review');
  }

  const allowed = ['rating', 'comment', 'images', 'videos'];
  const clean = {};
  for (const k of allowed) {
    if (body[k] !== undefined) clean[k] = body[k];
  }
  if (clean.rating !== undefined) {
    const rating = parseInt(clean.rating, 10);
    if (![1, 2, 3, 4, 5].includes(rating)) {
      throw ApiError.badRequest('invalid rating');
    }
    clean.rating = rating;
  }
  clean.updated_at = new Date().toISOString();

  const updated = await Review.findOneAndUpdate({ _id: reviewId }, { $set: clean }, { new: true });
  return serializeReview(updated);
};

const softDeleteReview = async (reviewId, reviewerId, isUserAdmin = false) => {
  const r = await Review.findById(reviewId);
  if (!r) {
    throw ApiError.notFound('Not found');
  }
  if (!isUserAdmin && r.reviewer_id !== reviewerId) {
    throw ApiError.forbidden('Not yours');
  }
  await Review.updateOne({ _id: reviewId }, { $set: { is_deleted: true } });
};

const toggleHelpful = async (reviewId, userId) => {
  const r = await Review.findOne({ _id: reviewId, is_deleted: { $ne: true } });
  if (!r) {
    throw ApiError.notFound('Review not found');
  }
  if (r.reviewer_id === userId) {
    throw ApiError.forbidden("You can't mark your own review helpful");
  }

  const existing = await Interaction.findOne({
    user_id: userId,
    review_id: reviewId,
    type: 'helpful',
  });

  let marked = false;
  if (existing) {
    await Interaction.deleteOne({ _id: existing._id });
    await Review.updateOne({ _id: reviewId }, { $inc: { helpful_count: -1 } });
    marked = false;
  } else {
    try {
      await Interaction.create({
        user_id: userId,
        review_id: reviewId,
        type: 'helpful',
      });
    } catch {}
    await Review.updateOne({ _id: reviewId }, { $inc: { helpful_count: 1 } });
    marked = true;
  }

  const updated = await Review.findById(reviewId).select('helpful_count');
  return { ok: true, marked_helpful: marked, helpful_count: parseInt(updated.helpful_count || 0, 10) };
};

module.exports = {
  createReview,
  listReviews,
  summary,
  replyToReview,
  updateReview,
  softDeleteReview,
  toggleHelpful,
};
