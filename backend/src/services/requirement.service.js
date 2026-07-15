const Requirement = require('../models/Requirement');
const Category = require('../models/Category');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const serializeRequirement = (doc) => {
  if (!doc) return null;
  const d = doc.toObject ? doc.toObject() : { ...doc };
  if (d._id) {
    d.id = d._id.toString();
    delete d._id;
  }
  const idFields = ['customer_id', 'category_id', 'sub_category_id'];
  for (const k of idFields) {
    if (d[k]) {
      d[k] = d[k].toString();
    }
  }
  delete d.is_deleted;
  delete d.__v;
  return d;
};

const create = async (customerId, body) => {
  if (!body.title || body.title.length < 3) {
    throw ApiError.badRequest('Title required');
  }
  if (!body.category_id) {
    throw ApiError.badRequest('Valid category_id required');
  }

  const loc = body.location || {};
  const fields = ['area', 'city', 'pincode'];
  for (const f of fields) {
    if (!loc[f]) {
      throw ApiError.badRequest(`location.${f} required`);
    }
  }

  if (loc.lat !== undefined && loc.lat !== null && loc.lng !== undefined && loc.lng !== null) {
    loc.geo = { type: 'Point', coordinates: [parseFloat(loc.lng), parseFloat(loc.lat)] };
  }

  const req = await Requirement.create({
    customer_id: customerId,
    title: String(body.title).trim(),
    description: body.description || null,
    category_id: body.category_id,
    sub_category_id: body.sub_category_id || null,
    budget_min: body.budget_min !== undefined && body.budget_min !== null ? parseFloat(body.budget_min) : null,
    budget_max: body.budget_max !== undefined && body.budget_max !== null ? parseFloat(body.budget_max) : null,
    photos: body.photos || [],
    video: body.video || null,
    location: loc,
    urgency: body.urgency || 'flexible',
    is_negotiable: body.is_negotiable !== false,
  });

  return serializeRequirement(req);
};

const listRequirements = async (filters, limit = 20, cursor = null) => {
  const q = { is_deleted: { $ne: true }, status: 'open' };

  if (filters.category_id) {
    q.category_id = filters.category_id;
  }
  if (filters.city) {
    const escaped = String(filters.city).trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const _city = escaped.slice(0, 80);
    q['location.city'] = { $regex: `^${_city}$`, $options: 'i' };
  }
  if (filters.urgency) {
    q.urgency = filters.urgency;
  }
  if (filters.budget_max) {
    q.$or = [
      { budget_max: null },
      { budget_max: { $lte: parseFloat(filters.budget_max) } },
    ];
  }
  if (filters.q) {
    q.$text = { $search: filters.q };
  }
  if (cursor) {
    q._id = { $lt: cursor };
  }

  const docs = await Requirement.find(q).sort({ _id: -1 }).limit(limit + 1);
  const hasMore = docs.length > limit;
  const sliced = docs.slice(0, limit);

  return {
    items: sliced.map(serializeRequirement),
    next_cursor: hasMore && sliced.length > 0 ? sliced[sliced.length - 1]._id.toString() : null,
    has_more: hasMore,
  };
};

const getById = async (reqId) => {
  const doc = await Requirement.findOne({ _id: reqId, is_deleted: { $ne: true } });
  if (!doc) {
    throw ApiError.notFound('Requirement not found');
  }
  const r = serializeRequirement(doc);

  // Attach customer info
  const cust = await User.findById(r.customer_id);
  if (cust) {
    r.customer = { id: cust._id.toString(), name: cust.name, profile_pic: cust.profile_pic };
  }

  const cat = r.category_id ? await Category.findOne({ _id: r.category_id, is_deleted: { $ne: true } }) : null;
  if (cat) {
    r.category = { id: cat._id.toString(), name: cat.name, slug: cat.slug };
  }

  return r;
};

const incrementViews = async (reqId) => {
  await Requirement.updateOne({ _id: reqId }, { $inc: { views_count: 1 } });
};

const update = async (reqId, customerId, body) => {
  const doc = await Requirement.findOne({ _id: reqId, is_deleted: { $ne: true } });
  if (!doc) {
    throw ApiError.notFound('Requirement not found');
  }
  if (doc.customer_id !== customerId) {
    throw ApiError.forbidden('Not yours');
  }

  const allowed = ['title', 'description', 'budget_min', 'budget_max', 'photos', 'video', 'location', 'urgency', 'is_negotiable'];
  const clean = {};
  for (const k of allowed) {
    if (body[k] !== undefined) clean[k] = body[k];
  }

  if (clean.location) {
    const loc = clean.location;
    if (loc.lat !== undefined && loc.lat !== null && loc.lng !== undefined && loc.lng !== null) {
      loc.geo = { type: 'Point', coordinates: [parseFloat(loc.lng), parseFloat(loc.lat)] };
    }
  }

  if (Object.keys(clean).length === 0) {
    throw ApiError.badRequest('No updatable fields');
  }

  const updated = await Requirement.findOneAndUpdate(
    { _id: reqId },
    { $set: clean },
    { new: true }
  );

  return serializeRequirement(updated);
};

const softDelete = async (reqId, customerId) => {
  const doc = await Requirement.findById(reqId);
  if (!doc) {
    throw ApiError.notFound('Not found');
  }
  if (doc.customer_id !== customerId) {
    throw ApiError.forbidden('Not yours');
  }
  await Requirement.updateOne({ _id: reqId }, { $set: { is_deleted: true } });
};

const closeRequirement = async (reqId, customerId) => {
  const doc = await Requirement.findById(reqId);
  if (!doc) {
    throw ApiError.notFound('Not found');
  }
  if (doc.customer_id !== customerId) {
    throw ApiError.forbidden('Not yours');
  }
  const updated = await Requirement.findOneAndUpdate(
    { _id: reqId },
    { $set: { status: 'closed' } },
    { new: true }
  );
  return serializeRequirement(updated);
};

const myPosted = async (customerId) => {
  const docs = await Requirement.find({ customer_id: customerId, is_deleted: { $ne: true } })
    .sort({ _id: -1 })
    .limit(100);
  return docs.map(serializeRequirement);
};

module.exports = {
  create,
  listRequirements,
  getById,
  incrementViews,
  update,
  softDelete,
  closeRequirement,
  myPosted,
};
