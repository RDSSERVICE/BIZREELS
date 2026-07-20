const { Report } = require('../models/Misc');
const Listing = require('../models/Listing');
const User = require('../models/User');
const { Review } = require('../models/Phase4');
const ApiError = require('../utils/ApiError');

const VALID_TARGETS = new Set(['listing', 'user', 'review', 'message']);
const VALID_REASONS = new Set(['spam', 'offensive', 'scam', 'wrong_category', 'other']);
const VALID_ACTIONS = new Set(['takedown', 'warn', 'ban', 'none']);

const serializeReport = (d) => {
  if (!d) return null;
  const out = d.toObject ? d.toObject() : { ...d };
  if (out._id) {
    out.id = out._id.toString();
    delete out._id;
  }
  return out;
};

const createReport = async (reporterId, body) => {
  if (!VALID_TARGETS.has(body.target_type)) {
    throw ApiError.badRequest(`target_type must be in ${Array.from(VALID_TARGETS).sort().join(', ')}`);
  }
  if (!VALID_REASONS.has(body.reason)) {
    throw ApiError.badRequest(`reason must be in ${Array.from(VALID_REASONS).sort().join(', ')}`);
  }
  const targetId = body.target_id || '';
  if (['listing', 'user', 'review', 'message'].includes(body.target_type)) {
    if (!targetId) {
      throw ApiError.badRequest('target_id must be a valid id');
    }
  }

  const doc = await Report.create({
    reporter_id: reporterId,
    target_type: body.target_type,
    target_id: targetId,
    reason: body.reason,
    description: String(body.description || '').slice(0, 1000),
    status: 'open',
    resolved_by: null,
    resolved_at: null,
    resolution_action: null,
    resolution_note: null,
  });

  return serializeReport(doc);
};

const hydrateTargets = async (items) => {
  const listingIds = [];
  const userIds = [];
  const reviewIds = [];

  for (const r of items) {
    const tid = r.target_id;
    if (!tid) continue;
    if (r.target_type === 'listing') {
      listingIds.push(tid);
    } else if (r.target_type === 'user') {
      userIds.push(tid);
    } else if (r.target_type === 'review') {
      reviewIds.push(tid);
    }
  }

  const listingsMap = {};
  if (listingIds.length > 0) {
    const listings = await Listing.find({ _id: { $in: listingIds } }, { title: 1, slug: 1, is_takendown: 1 });
    for (const li of listings) {
      listingsMap[li._id.toString()] = li;
    }
  }

  const usersMap = {};
  if (userIds.length > 0) {
    const users = await User.find({ _id: { $in: userIds } }, { name: 1, phone: 1, is_banned: 1 });
    for (const u of users) {
      usersMap[u._id.toString()] = u;
    }
  }

  const reviewsMap = {};
  if (reviewIds.length > 0) {
    const reviews = await Review.find({ _id: { $in: reviewIds } }, { rating: 1, comment: 1 });
    for (const rv of reviews) {
      reviewsMap[rv._id.toString()] = rv;
    }
  }

  for (const r of items) {
    const tid = r.target_id;
    r.target_label = null;
    r.target_link = null;

    if (r.target_type === 'listing' && listingsMap[tid]) {
      const li = listingsMap[tid];
      r.target_label = li.title || '(untitled listing)';
      r.target_link = `/listing/${li.slug || tid}`;
      r.target_status = li.is_takendown ? 'taken_down' : 'active';
    } else if (r.target_type === 'user' && usersMap[tid]) {
      const u = usersMap[tid];
      r.target_label = u.name || u.phone || '(unnamed user)';
      r.target_link = `/vendor/${tid}`;
      r.target_status = u.is_banned ? 'banned' : 'active';
    } else if (r.target_type === 'review' && reviewsMap[tid]) {
      const rv = reviewsMap[tid];
      r.target_label = `${rv.rating || '?'}★ · ${(rv.comment || '').slice(0, 60)}`;
    }
  }

  return items;
};

const listReports = async (status = null, targetType = null, cursor = null, limit = 20) => {
  const q = {};
  if (status) {
    q.status = status;
  }
  if (targetType) {
    q.target_type = targetType;
  }
  if (cursor) {
    q._id = { $lt: cursor };
  }

  const docs = await Report.find(q).sort({ _id: -1 }).limit(limit + 1);
  const hasMore = docs.length > limit;
  const sliced = docs.slice(0, limit);
  const items = sliced.map(serializeReport);

  const hydrated = await hydrateTargets(items);

  return {
    items: hydrated,
    next_cursor: hasMore && hydrated.length > 0 ? hydrated[hydrated.length - 1].id : null,
    has_more: hasMore,
  };
};

const resolveReport = async (rid, adminId, action, note) => {
  if (!VALID_ACTIONS.has(action)) {
    throw ApiError.badRequest(`action must be in ${Array.from(VALID_ACTIONS).sort().join(', ')}`);
  }

  const rep = await Report.findById(rid);
  if (!rep) {
    throw ApiError.notFound('Report not found');
  }

  const now = new Date().toISOString();

  // Apply action side-effects
  if (action === 'takedown' && rep.target_type === 'listing') {
    await Listing.updateOne(
      { _id: rep.target_id },
      { $set: { is_takendown: true, status: 'paused', updated_at: now } }
    );
  } else if (action === 'ban' && rep.target_type === 'user') {
    await User.updateOne(
      { _id: rep.target_id },
      { $set: { is_banned: true, is_active: false, updated_at: now } }
    );
  }

  const updated = await Report.findOneAndUpdate(
    { _id: rid },
    {
      $set: {
        status: 'resolved',
        resolved_by: adminId,
        resolved_at: now,
        resolution_action: action,
        resolution_note: note,
        updated_at: now,
      },
    },
    { returnDocument: 'after' }
  );

  return serializeReport(updated);
};

const dismissReport = async (rid, adminId, reason = null) => {
  const rep = await Report.findById(rid);
  if (!rep) {
    throw ApiError.notFound('Report not found');
  }

  const now = new Date().toISOString();
  const updated = await Report.findOneAndUpdate(
    { _id: rid },
    {
      $set: {
        status: 'dismissed',
        resolved_by: adminId,
        resolved_at: now,
        resolution_action: 'none',
        resolution_note: reason,
        updated_at: now,
      },
    },
    { returnDocument: 'after' }
  );

  return serializeReport(updated);
};

const openCount = async () => {
  return await Report.countDocuments({ status: 'open' });
};

module.exports = {
  createReport,
  listReports,
  resolveReport,
  dismissReport,
  openCount,
};
