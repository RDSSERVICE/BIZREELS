const Listing = require('../models/Listing');
const Category = require('../models/Category');
const User = require('../models/User');
const slugify = require('slugify');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { notTestFilter } = require('../utils/helpers');

const MAX_IMAGES = 10;
const MAX_REEL_DURATION = 30.0;

const MAX_VARIANTS = 5;
const MAX_VARIANT_OPTIONS = 20;
const MAX_FEATURES = 8;
const MAX_TAGS = 15;
const MAX_FEATURE_LEN = 200;
const MAX_TAG_LEN = 40;
const MAX_VARIANT_NAME_LEN = 32;
const MAX_OPTION_LEN = 40;

const normalizeVariants = (variants) => {
  if (!variants) return [];
  if (!Array.isArray(variants)) {
    throw ApiError.unprocessable('variants must be a list');
  }
  if (variants.length > MAX_VARIANTS) {
    throw ApiError.unprocessable(`Too many variants (${variants.length} > ${MAX_VARIANTS})`);
  }

  const allowedTypes = new Set(['size', 'color', 'material', 'tier', 'custom']);
  const out = [];

  for (const v of variants) {
    if (!v || typeof v !== 'object') continue;
    const name = String(v.name || '').trim().slice(0, MAX_VARIANT_NAME_LEN);
    if (!name) continue;

    let vtype = String(v.type || 'custom').toLowerCase().trim();
    if (!allowedTypes.has(vtype)) {
      vtype = 'custom';
    }

    const optsRaw = v.options || [];
    if (!Array.isArray(optsRaw)) {
      throw ApiError.unprocessable('variant.options must be a list');
    }
    if (optsRaw.length > MAX_VARIANT_OPTIONS) {
      throw ApiError.unprocessable(`Too many options (${optsRaw.length} > ${MAX_VARIANT_OPTIONS})`);
    }
    const opts = optsRaw
      .map(o => String(o || '').trim().slice(0, MAX_OPTION_LEN))
      .filter(Boolean);

    const pricesIn = v.prices || null;
    let pricesOut = null;
    if (pricesIn && typeof pricesIn === 'object' && !Array.isArray(pricesIn)) {
      pricesOut = {};
      const keys = Object.keys(pricesIn).slice(0, MAX_VARIANT_OPTIONS);
      for (const k of keys) {
        const val = pricesIn[k];
        const priceVal = parseFloat(val);
        if (isNaN(priceVal)) {
          throw ApiError.unprocessable(`variant.prices[${k}] must be numeric`);
        }
        if (priceVal < 0) {
          throw ApiError.unprocessable('variant prices must be non-negative');
        }
        pricesOut[String(k).slice(0, MAX_OPTION_LEN)] = priceVal;
      }
    }

    let priceHint = v.price_hint_inr;
    if (priceHint !== undefined && priceHint !== null) {
      priceHint = parseFloat(priceHint);
      if (isNaN(priceHint)) {
        priceHint = null;
      } else if (priceHint < 0) {
        throw ApiError.unprocessable('price_hint_inr must be non-negative');
      }
    } else {
      priceHint = null;
    }

    const featuresRaw = v.features || [];
    if (!Array.isArray(featuresRaw)) {
      throw ApiError.unprocessable('variant.features must be a list');
    }
    const varFeatures = featuresRaw
      .slice(0, 5)
      .map(f => String(f || '').trim().slice(0, MAX_FEATURE_LEN))
      .filter(Boolean);

    out.push({
      name,
      type: vtype,
      options: opts,
      ...(pricesOut && { prices: pricesOut }),
      ...(priceHint !== null && { price_hint_inr: priceHint }),
      ...(varFeatures.length > 0 && { features: varFeatures }),
    });
  }

  return out;
};

const normalizeFeatures = (features) => {
  if (!features) return [];
  if (!Array.isArray(features)) {
    throw ApiError.unprocessable('features must be a list');
  }
  if (features.length > MAX_FEATURES * 3) {
    throw ApiError.unprocessable(`Too many features (${features.length} > ${MAX_FEATURES * 3})`);
  }
  return features
    .map(f => String(f || '').trim().slice(0, MAX_FEATURE_LEN))
    .filter(Boolean)
    .slice(0, MAX_FEATURES);
};

const normalizeTags = (tags) => {
  if (!tags) return [];
  let tagList = tags;
  if (typeof tags === 'string') {
    tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
  }
  if (!Array.isArray(tagList)) {
    throw ApiError.unprocessable('tags must be a list');
  }
  if (tagList.length > MAX_TAGS * 3) {
    throw ApiError.unprocessable(`Too many tags (${tagList.length} > ${MAX_TAGS * 3})`);
  }
  return tagList
    .map(t => String(t || '').trim().slice(0, MAX_TAG_LEN))
    .filter(Boolean)
    .slice(0, MAX_TAGS);
};

const serializeListing = (doc) => {
  if (!doc) return null;
  const d = doc.toObject ? doc.toObject() : doc;
  const out = { ...d };
  if (out._id) {
    out.id = out._id.toString();
    delete out._id;
  }
  delete out.__v;
  if (out.vendor_id) out.vendor_id = out.vendor_id.toString();
  if (out.category_id) out.category_id = out.category_id.toString();
  if (out.sub_category_id) out.sub_category_id = out.sub_category_id.toString();
  delete out.is_deleted;
  return out;
};

const validateTypeFields = (type, body) => {
  if (type === 'new_product') {
    if (body.stock === undefined || body.stock === null || body.stock < 0) {
      throw ApiError.badRequest('new_product: stock (>=0) is required');
    }
    if (body.condition !== undefined && body.condition !== null) {
      throw ApiError.badRequest('new_product: condition must be omitted');
    }
  } else if (type === 'old_product') {
    if (!body.condition) {
      throw ApiError.badRequest('old_product: condition is required');
    }
    if (body.stock !== undefined && body.stock !== null) {
      throw ApiError.badRequest('old_product: stock must be omitted');
    }
  } else if (type === 'service') {
    if (!body.service_charges_type) {
      throw ApiError.badRequest('service: service_charges_type is required');
    }
    const invalidFields = ['stock', 'condition', 'warranty'];
    for (const f of invalidFields) {
      if (body[f] !== undefined && body[f] !== null) {
        throw ApiError.badRequest(`service: ${f} must be omitted`);
      }
    }
  } else {
    throw ApiError.badRequest(`Invalid listing type: ${type}`);
  }
};

const validatePrices = (price, offerPrice) => {
  if (price <= 0) {
    throw ApiError.badRequest('price must be > 0');
  }
  if (offerPrice !== undefined && offerPrice !== null && offerPrice >= price) {
    throw ApiError.badRequest('offer_price must be less than price');
  }
};

const validateLocation = (loc) => {
  const fields = ['area', 'city', 'pincode'];
  for (const f of fields) {
    if (!loc || !loc[f]) {
      throw ApiError.badRequest(`location.${f} is required`);
    }
  }
};

const validateMedia = (images, reel) => {
  if (images && images.length > MAX_IMAGES) {
    throw ApiError.badRequest(`Max ${MAX_IMAGES} images allowed`);
  }
  if (reel && reel.duration && reel.duration > MAX_REEL_DURATION) {
    throw ApiError.badRequest(`Reel duration must be <= ${MAX_REEL_DURATION}s`);
  }
};

const generateNextSlug = async (title) => {
  const base = slugify(title, { lower: true }).slice(0, 60) || 'listing';
  let slug = base;
  let i = 1;
  while (await Listing.findOne({ slug })) {
    i++;
    slug = `${base}-${i}`;
  }
  return slug;
};

const createListing = async (vendorId, body) => {
  const type = body.type;
  validateTypeFields(type, body);
  validatePrices(body.price, body.offer_price);
  const location = body.location || {};
  validateLocation(location);
  validateMedia(body.images || [], body.reel);

  if (!body.category_id) {
    throw ApiError.badRequest('Valid category_id required');
  }
  const cat = await Category.findOne({ _id: body.category_id, is_deleted: { $ne: true } });
  if (!cat) {
    throw ApiError.badRequest('Category not found');
  }

  if (body.sub_category_id) {
    const sub = await Category.findOne({ _id: body.sub_category_id, is_deleted: { $ne: true } });
    if (!sub || sub.parent_id !== body.category_id) {
      throw ApiError.badRequest('sub_category_id must be a child of category_id');
    }
  }

  if (location.lat !== undefined && location.lat !== null && location.lng !== undefined && location.lng !== null) {
    location.geo = { type: 'Point', coordinates: [parseFloat(location.lng), parseFloat(location.lat)] };
  }

  const slug = await generateNextSlug(body.title);

  const listing = await Listing.create({
    vendor_id: vendorId,
    type,
    title: String(body.title).trim(),
    slug,
    description: body.description,
    category_id: body.category_id,
    sub_category_id: body.sub_category_id,
    price: parseFloat(body.price),
    offer_price: body.offer_price !== undefined && body.offer_price !== null ? parseFloat(body.offer_price) : null,
    is_negotiable: !!body.is_negotiable,
    bulk_price: body.bulk_price !== undefined && body.bulk_price !== null ? parseFloat(body.bulk_price) : null,
    stock: body.stock !== undefined && body.stock !== null ? parseInt(body.stock, 10) : null,
    condition: body.condition || null,
    warranty: body.warranty || null,
    service_charges_type: body.service_charges_type || null,
    experience_years: body.experience_years !== undefined && body.experience_years !== null ? parseInt(body.experience_years, 10) : null,
    service_area_km: body.service_area_km !== undefined && body.service_area_km !== null ? parseFloat(body.service_area_km) : null,
    images: body.images || [],
    reel: body.reel || null,
    location,
    tags: normalizeTags(body.tags),
    short_description: body.short_description || null,
    features: normalizeFeatures(body.features),
    variants: normalizeVariants(body.variants),
  });

  try {
    const referralService = require('./referral.service');
    await referralService.maybeAwardOnListing(vendorId);
  } catch (err) {
    logger.error('Failed to trigger referral award on first listing:', err.message);
  }

  return serializeListing(listing);
};

const listListings = async (filters, limit = 20, cursor = null) => {
  const q = { is_deleted: { $ne: true }, is_takendown: { $ne: true }, ...notTestFilter() };

  const validFilters = ['type', 'category_id', 'sub_category_id', 'vendor_id', 'status'];
  for (const k of validFilters) {
    const v = filters[k];
    if (v) {
      q[k] = v;
    }
  }

  if (!filters.include_inactive) {
    q.status = 'active';
  }

  if (filters.q) {
    q.$text = { $search: filters.q };
  }

  if (cursor) {
    q._id = { $lt: cursor };
  }

  const total = cursor ? null : await Listing.countDocuments(q);
  const docs = await Listing.find(q)
    .sort({ _id: -1 })
    .limit(limit + 1);

  const hasMore = docs.length > limit;
  const items = docs.slice(0, limit).map(serializeListing);

  return {
    items,
    next_cursor: hasMore && items.length > 0 ? items[items.length - 1].id : null,
    has_more: hasMore,
    total,
  };
};

const getBySlug = async (slug, incrViews = true) => {
  const doc = await Listing.findOne({ slug, is_deleted: { $ne: true } });
  if (!doc) {
    throw ApiError.notFound('Listing not found');
  }

  const result = serializeListing(doc);

  // Attach vendor basic info
  const vendor = await User.findById(result.vendor_id);
  if (vendor) {
    result.vendor = {
      id: vendor._id.toString(),
      name: vendor.name,
      profile_pic: vendor.profile_pic,
    };
  }

  // Attach category names
  const cat = await Category.findOne({ _id: result.category_id, is_deleted: { $ne: true } });
  if (cat) {
    result.category = { id: cat._id.toString(), name: cat.name, slug: cat.slug };
  }

  if (result.sub_category_id) {
    const sub = await Category.findOne({ _id: result.sub_category_id, is_deleted: { $ne: true } });
    if (sub) {
      result.sub_category = { id: sub._id.toString(), name: sub.name, slug: sub.slug };
    }
  }

  return result;
};

const incrementViews = async (slug) => {
  const doc = await Listing.findOneAndUpdate(
    { slug },
    { $inc: { views_count: 1 } },
    { new: true }
  );

  if (doc) {
    try {
      const eventService = require('./event.service');
      await eventService.emit({
        listing_id: doc._id.toString(),
        vendor_id: doc.vendor_id ? doc.vendor_id.toString() : null,
        event_type: 'view',
        user_id: null,
        meta: { slug },
      });
    } catch (err) {
      logger.error('Failed to emit view event:', err.message);
    }
  }
};

const getByIdForOwner = async (listingId, vendorId, isUserAdmin = false) => {
  const doc = await Listing.findOne({ _id: listingId, is_deleted: { $ne: true } });
  if (!doc) {
    throw ApiError.notFound('Listing not found');
  }
  if (!isUserAdmin && doc.vendor_id !== vendorId) {
    throw ApiError.forbidden('Not your listing');
  }
  return doc;
};

const updateListing = async (listingId, vendorId, body, isUserAdmin = false) => {
  const doc = await getByIdForOwner(listingId, vendorId, isUserAdmin);
  const allowed = [
    'title', 'description', 'price', 'offer_price', 'is_negotiable', 'bulk_price',
    'stock', 'condition', 'warranty', 'service_charges_type', 'experience_years',
    'service_area_km', 'images', 'reel', 'location', 'tags', 'status',
    'short_description', 'features', 'variants',
  ];

  const clean = {};
  for (const k of allowed) {
    if (body[k] !== undefined) clean[k] = body[k];
  }

  if (clean.variants !== undefined) {
    clean.variants = normalizeVariants(clean.variants);
  }
  if (clean.features !== undefined) {
    clean.features = normalizeFeatures(clean.features);
  }
  if (clean.tags !== undefined) {
    clean.tags = normalizeTags(clean.tags);
  }

  if (clean.price !== undefined || clean.offer_price !== undefined) {
    const price = clean.price !== undefined ? clean.price : doc.price;
    const offer = clean.offer_price !== undefined ? clean.offer_price : doc.offer_price;
    validatePrices(price, offer);
  }

  if (clean.images !== undefined || clean.reel !== undefined) {
    validateMedia(clean.images || doc.images, clean.reel || doc.reel);
  }

  if (clean.location !== undefined) {
    const loc = clean.location;
    validateLocation(loc);
    if (loc.lat !== undefined && loc.lat !== null && loc.lng !== undefined && loc.lng !== null) {
      loc.geo = { type: 'Point', coordinates: [parseFloat(loc.lng), parseFloat(loc.lat)] };
    }
  }

  if (clean.status !== undefined && !['active', 'paused', 'sold', 'expired'].includes(clean.status)) {
    throw ApiError.badRequest('Invalid status');
  }

  if (Object.keys(clean).length === 0) {
    throw ApiError.badRequest('No updatable fields');
  }

  const oldPrice = doc.price;
  const oldOffer = doc.offer_price;
  const oldStock = doc.stock;

  const updated = await Listing.findOneAndUpdate(
    { _id: listingId },
    { $set: clean },
    { new: true }
  );

  // Watcher notifications trigger
  try {
    const newPrice = updated.price;
    const newOffer = updated.offer_price;
    const newStock = updated.stock;

    const priceDropped = (
      (typeof newPrice === 'number' && typeof oldPrice === 'number' && newPrice < oldPrice) ||
      (newOffer !== null && (oldOffer === null || newOffer < oldOffer))
    );

    const backInStock = (typeof oldStock === 'number' && oldStock === 0 &&
                         typeof newStock === 'number' && newStock > 0);

    if (priceDropped || backInStock) {
      const watcherNotifyService = require('./watch.service'); // Note watch.service has watcher functions
      // We can defer or invoke asynchronously
      watcherNotifyService.notifyWatchers({
        listingId,
        title: updated.title,
        slug: updated.slug,
        effectivePrice: newOffer !== null ? newOffer : newPrice,
        event: priceDropped ? 'price_drop' : 'back_in_stock',
      }).catch(err => logger.error('watcher notification error:', err.message));
    }
  } catch (err) {
    logger.error('watcher_notify trigger failed:', err.message);
  }

  return serializeListing(updated);
};

const setStatus = async (listingId, vendorId, status, isUserAdmin = false) => {
  if (!['active', 'paused', 'sold', 'expired'].includes(status)) {
    throw ApiError.badRequest('Invalid status');
  }
  return await updateListing(listingId, vendorId, { status }, isUserAdmin);
};

const softDelete = async (listingId, vendorId, isUserAdmin = false) => {
  await getByIdForOwner(listingId, vendorId, isUserAdmin);
  await Listing.updateOne(
    { _id: listingId },
    { $set: { is_deleted: true, is_active: false } }
  );
};

const listByVendor = async (vendorId) => {
  const docs = await Listing.find({ vendor_id: vendorId, is_deleted: { $ne: true } }).sort({ _id: -1 });
  return docs.map(serializeListing);
};

module.exports = {
  serializeListing,
  createListing,
  listListings,
  getBySlug,
  incrementViews,
  getByIdForOwner,
  updateListing,
  setStatus,
  softDelete,
  listByVendor,
};
