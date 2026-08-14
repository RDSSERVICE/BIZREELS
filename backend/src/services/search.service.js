const Listing = require('../models/Listing');
const Category = require('../models/Category');
const { SearchHistory } = require('../models/Misc');
const ApiError = require('../utils/ApiError');
const { serializeListing } = require('./listing.service');

const SORT_MAP = {
  recent: { _id: -1 },
  price_asc: { price: 1, _id: -1 },
  price_desc: { price: -1, _id: -1 },
};

const TYPE_FILTER = {
  products: ['new_product', 'old_product'],
  new_products: ['new_product'],
  old_products: ['old_product'],
  services: ['service'],
  all: null,
};

const searchListings = async ({
  q = null,
  category_id = null,
  sub_category_id = null,
  type = null,
  condition = null,
  price_min = null,
  price_max = null,
  is_negotiable = null,
  has_offer = null,
  lat = null,
  lng = null,
  radius_km = null,
  sort = 'recent',
  cursor = null,
  limit = 20,
  user_id = null,
} = {}) => {
  const query = { is_deleted: { $ne: true }, status: 'active' };

  if (category_id) {
    query.category_id = category_id;
  }
  if (sub_category_id) {
    query.sub_category_id = sub_category_id;
  }
  if (type) {
    const types = TYPE_FILTER[type] || [type];
    if (types) {
      query.type = { $in: types };
    }
  }
  if (condition) {
    query.condition = condition;
  }
  if (price_min !== null || price_max !== null) {
    const rng = {};
    if (price_min !== null) rng.$gte = parseFloat(price_min);
    if (price_max !== null) rng.$lte = parseFloat(price_max);
    query.price = rng;
  }
  if (is_negotiable !== null) {
    query.is_negotiable = is_negotiable;
  }
  if (has_offer) {
    query.offer_price = { $ne: null };
  }
  if (q) {
    query.$text = { $search: q };
  }

  // Log search query in background
  try {
    const filters = {};
    const optFilters = {
      category_id,
      sub_category_id,
      type,
      condition,
      price_min,
      price_max,
      is_negotiable,
      has_offer,
      lat,
      lng,
      radius_km,
      sort,
    };
    for (const key of Object.keys(optFilters)) {
      if (optFilters[key] !== null && optFilters[key] !== undefined) {
        filters[key] = optFilters[key];
      }
    }
    await SearchHistory.create({
      user_id,
      query: q || '',
      filters,
    });
  } catch {}

  if (cursor) {
    query._id = { $lt: cursor };
  }

  const sortSpec = SORT_MAP[sort] || SORT_MAP.recent;

  let docs = [];
  if (lat !== null && lng !== null && radius_km) {
    const pipeline = [
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          distanceField: 'distance_meters',
          maxDistance: parseFloat(radius_km) * 1000.0,
          query,
          spherical: true,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'vendor',
          foreignField: '_id',
          as: 'vendor',
        },
      },
      { $unwind: { path: '$vendor', preserveNullAndEmptyArrays: true } },
    ];
    docs = await Listing.aggregate(pipeline);
  } else {
    docs = await Listing.find(query)
      .populate('vendor')
      .lean();
  }

  // Calculate Vendor Priority Score and score-rank documents
  const scoredDocs = docs.map((d) => {
    const vendor = d.vendor || {};
    let vendorScore = 0;

    // 1. Subscription plan boost
    if (vendor.is_subscribed_verified) {
      vendorScore += 50;
    }
    const plan = vendor.subscription?.plan || '';
    if (plan.includes('Premium') || plan.includes('Gold') || plan.includes('Silver')) {
      vendorScore += 30;
    }
    // 2. Average rating
    if (vendor.rating_avg) {
      vendorScore += vendor.rating_avg * 10;
    }
    // 3. Followers count
    if (vendor.followersCount) {
      vendorScore += Math.min(20, vendor.followersCount * 0.5);
    }
    // 4. Response rate
    if (vendor.chat_response_rate) {
      vendorScore += vendor.chat_response_rate * 0.2;
    }

    return { doc: d, vendorScore };
  });

  // Sort by vendorScore desc, and fallback to sort spec if scores match
  scoredDocs.sort((a, b) => {
    if (b.vendorScore !== a.vendorScore) {
      return b.vendorScore - a.vendorScore;
    }

    if (sort === 'price_asc') {
      return (a.doc.price || 0) - (b.doc.price || 0);
    } else if (sort === 'price_desc') {
      return (b.doc.price || 0) - (a.doc.price || 0);
    } else {
      const dateA = a.doc.createdAt || a.doc.created_at || 0;
      const dateB = b.doc.createdAt || b.doc.created_at || 0;
      return new Date(dateB) - new Date(dateA);
    }
  });

  const sortedDocs = scoredDocs.map((x) => x.doc);
  const hasMore = sortedDocs.length > limit;
  const items = sortedDocs.slice(0, limit).map(serializeListing);

  return {
    items,
    next_cursor: hasMore && items.length > 0 ? items[items.length - 1].id : null,
    has_more: hasMore,
  };
};

const suggest = async (q, limit = 5) => {
  const qClean = String(q || '').trim().slice(0, 80);
  if (qClean.length < 2) {
    return { listings: [], categories: [] };
  }

  // Escape special regex chars
  const escaped = qClean.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const rx = { $regex: escaped, $options: 'i' };

  const listingDocs = await Listing.find(
    { title: rx, is_deleted: { $ne: true }, status: 'active' },
    { title: 1, slug: 1, images: 1, price: 1, offer_price: 1 }
  ).limit(limit);

  const catDocs = await Category.find(
    { name: rx, is_deleted: { $ne: true }, is_active: true },
    { name: 1, slug: 1, icon_url: 1, parent_id: 1 }
  ).limit(3);

  return {
    listings: listingDocs.map(l => ({
      title: l.title,
      slug: l.slug,
      image: l.images && l.images.length > 0 ? l.images[0].url : null,
      price: l.offer_price !== null ? l.offer_price : l.price,
    })),
    categories: catDocs.map(c => ({
      id: c._id.toString(),
      name: c.name,
      slug: c.slug,
      icon_url: c.icon_url,
      is_top_level: c.parent_id === null,
    })),
  };
};

module.exports = {
  searchListings,
  suggest,
};
