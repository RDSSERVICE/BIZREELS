const Listing = require('../models/Listing');
const User = require('../models/User');
const Reel = require('../models/Reel');
const followService = require('./follow.service');
const { serializeListing } = require('./listing.service');
const { notTestFilter } = require('../utils/helpers');
const cache = require('../utils/cache');

const TYPE_FILTER = {
  all: null,
  products: ['new_product', 'old_product'],
  new_products: ['new_product'],
  old_products: ['old_product'],
  services: ['service'],
  reels: null,
};

const buildFeed = async ({
  type = 'all',
  lat = null,
  lng = null,
  radius_km = 10.0,
  cursor = null,
  limit = 20,
  user_id = null,
  reels_only = false,
  radiusKm = null,
  userId = null,
  reelsOnly = false
} = {}) => {
  const finalUserId = user_id || userId;
  const finalRadiusKm = radiusKm !== null ? radiusKm : radius_km;
  const finalReelsOnly = reels_only || reelsOnly;

  // If type is 'all' and not reelsOnly, we fetch both Reels and Listings
  const fetchReels = finalReelsOnly || type === 'all' || type === 'reels';
  const fetchListings = !finalReelsOnly && type !== 'reels';

  const qListings = { isDeleted: { $ne: true }, status: 'published', ...notTestFilter() };
  const qReels = { isDeleted: { $ne: true }, status: 'published', ...notTestFilter() };

  const poolSize = Math.max(limit * 5, 40);
  let listingDocs = [];
  let reelDocs = [];

  // Query Listings
  if (fetchListings) {
    if (lat !== null && lng !== null && finalRadiusKm) {
      try {
        const pipeline = [
          {
            $geoNear: {
              near: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
              distanceField: 'distance_meters',
              maxDistance: parseFloat(finalRadiusKm) * 1000.0,
              query: qListings,
              spherical: true,
            },
          },
          { $sort: { _id: -1 } },
          { $limit: poolSize },
        ];
        listingDocs = await Listing.aggregate(pipeline);
      } catch (err) {
        listingDocs = await Listing.find(qListings).sort({ _id: -1 }).limit(poolSize).lean();
      }
    } else {
      listingDocs = await Listing.find(qListings).sort({ _id: -1 }).limit(poolSize).lean();
    }
  }

  // Query Reels
  if (fetchReels) {
    if (lat !== null && lng !== null && finalRadiusKm) {
      try {
        const pipeline = [
          {
            $geoNear: {
              near: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
              distanceField: 'distance_meters',
              maxDistance: parseFloat(finalRadiusKm) * 1000.0,
              query: qReels,
              spherical: true,
            },
          },
          { $sort: { _id: -1 } },
          { $limit: poolSize },
        ];
        reelDocs = await Reel.aggregate(pipeline);
      } catch (err) {
        reelDocs = await Reel.find(qReels).sort({ _id: -1 }).limit(poolSize).lean();
      }
    } else {
      reelDocs = await Reel.find(qReels).sort({ _id: -1 }).limit(poolSize).lean();
    }
  }

  // Combine and label them
  const combined = [];
  for (const doc of listingDocs) {
    combined.push({
      postType: 'listing',
      d: doc,
      createdAt: doc.createdAt || doc.created_at || new Date(0),
    });
  }
  for (const doc of reelDocs) {
    combined.push({
      postType: 'reel',
      d: doc,
      createdAt: doc.createdAt || doc.created_at || new Date(0),
    });
  }

  // Following set
  const followingSet = new Set();
  if (finalUserId) {
    const ids = await followService.followingIds(finalUserId);
    for (const id of ids) {
      followingSet.add(id.toString());
    }
  }

  const now = new Date();
  const scored = [];
  for (const item of combined) {
    const d = item.d;
    const dist = d.distance_meters;
    const distKm = dist !== undefined && dist !== null ? dist / 1000.0 : null;

    // Scoring logic
    let score = 0.0;
    const created = item.createdAt;
    if (created && (now - new Date(created) < 24 * 60 * 60 * 1000)) {
      score += 20;
    }
    if (distKm !== null) {
      score += Math.max(0.0, 30.0 - distKm);
    }
    const vendorId = (item.postType === 'reel' ? d.creator : d.vendor)?.toString();
    if (vendorId && followingSet.has(vendorId)) {
      score += 15;
    }
    if (item.postType === 'reel') {
      score += 10;
    }
    if (d.isBoosted || d.boostExpiresAt) {
      score += 25;
    }
    scored.push({ score, item });
  }

  // Sort by score desc, then createdAt desc
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.item.createdAt) - new Date(a.item.createdAt);
  });

  // Pagination
  let chosen = [];
  if (cursor) {
    let found = false;
    const filtered = [];
    for (const s of scored) {
      const itemId = String(s.item.d._id);
      if (itemId === cursor) {
        found = true;
        continue;
      }
      if (found) {
        filtered.push(s.item);
      }
    }
    chosen = found ? filtered.slice(0, limit) : scored.map(s => s.item).slice(0, limit);
  } else {
    chosen = scored.map(s => s.item).slice(0, limit);
  }

  // Populate vendor/creator details
  const resultItems = [];
  for (const item of chosen) {
    const d = item.d;
    const serialized = item.postType === 'listing' ? serializeListing(d) : { ...d, id: d._id.toString() };
    serialized.postType = item.postType;
    if (d.distance_meters !== undefined) {
      serialized.distance_meters = d.distance_meters;
    }
    resultItems.push(serialized);
  }

  // Populate vendor info
  const listingVendorIds = resultItems.filter(r => r.postType === 'listing' && r.vendor).map(r => r.vendor.toString());
  const reelCreatorIds = resultItems.filter(r => r.postType === 'reel' && r.creator).map(r => r.creator.toString());
  const allUserIds = Array.from(new Set([...listingVendorIds, ...reelCreatorIds]));

  if (allUserIds.length > 0) {
    const users = await User.find({ _id: { $in: allUserIds } })
      .select('name profile_pic avatarUrl')
      .lean();
    const umap = {};
    for (const u of users) {
      umap[u._id.toString()] = u;
    }
    for (const r of resultItems) {
      const uId = r.postType === 'listing' ? r.vendor?.toString() : r.creator?.toString();
      const u = umap[uId];
      if (u) {
        const userObj = {
          id: u._id.toString(),
          _id: u._id.toString(),
          name: u.name,
          profile_pic: u.profile_pic || u.avatarUrl,
          avatarUrl: u.avatarUrl || u.profile_pic,
        };
        if (r.postType === 'listing') {
          r.vendor = userObj;
        } else {
          r.creator = userObj;
        }
      }
    }
  }

  // Populate viewer interactions
  if (finalUserId && resultItems.length > 0) {
    const interactionService = require('./interaction.service');
    const state = await interactionService.userInteractionState(finalUserId, resultItems.map(r => r.id));
    for (const r of resultItems) {
      r.viewer_state = state[r.id] || { liked: false, saved: false };
    }
  }

  return {
    items: resultItems,
    next_cursor: chosen.length === limit ? String(chosen[chosen.length - 1].d._id) : null,
    has_more: chosen.length === limit,
  };
};

const getHomeTrendingFeed = async () => {
  try {
    const cached = await cache.getCache('feed:home_trending');
    if (cached) return cached;

    const defaultTrending = [
      { num: '01', img: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800&h=1050&fit=crop&q=85', title: 'Premium Office Chair', sub: 'ErgoComfort Pro', meta: '1.2K views · 86 leads', id: null },
      { num: '02', img: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=1050&fit=crop&q=85', title: 'Digital Marketing Service', sub: 'Grow Your Brand Online', meta: '980 views · 64 leads', id: null },
      { num: '03', img: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=1050&fit=crop&q=85', title: 'Solar Rooftop System', sub: 'Save Electricity Bills', meta: '875 views · 59 leads', id: null },
      { num: '04', img: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=800&h=1050&fit=crop&q=85', title: 'Modern Modular Kitchen', sub: 'Designs That Inspire', meta: '765 views · 51 leads', id: null },
      { num: '05', img: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&h=1050&fit=crop&q=85', title: 'Corporate Gift Hampers', sub: 'For Every Occasion', meta: '680 views · 48 leads', id: null },
      { num: '06', img: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&h=1050&fit=crop&q=85', title: 'Luxury Bridal Makeup', sub: 'Glow Studio', meta: '610 views · 42 leads', id: null },
      { num: '07', img: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=1050&fit=crop&q=85', title: 'Luxury Fleet Rental', sub: 'Prestige Cars', meta: '590 views · 39 leads', id: null },
      { num: '08', img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=1050&fit=crop&q=85', title: 'Commercial Interior Design', sub: 'Apex Architects', meta: '540 views · 35 leads', id: null }
    ];

    const defaultFeatured = [
      { badge: 'Featured', img: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800&h=1050&fit=crop&q=85', views: '2.1K', title: 'ErgoComfort Pro Premium Office Chair', category: 'Furniture', id: null },
      { badge: null, img: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&h=1050&fit=crop&q=85', views: '1.8K', title: 'Social Media Growth Service', category: 'Digital Marketing', id: null },
      { badge: null, img: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=1050&fit=crop&q=85', views: '3.4K', title: 'Solar Rooftop System 3kW On-Grid', category: 'Energy', id: null },
      { badge: 'Hot Deal', img: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=800&h=1050&fit=crop&q=85', views: '1.5K', title: 'Custom Italian Modular Kitchen', category: 'Home & Living', id: null },
      { badge: 'Popular', img: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&h=1050&fit=crop&q=85', views: '2.9K', title: 'Premium Festive Gift Hampers', category: 'Corporate Gifts', id: null }
    ];

    const categoryService = require('./category.service');

    // Run independent database queries in parallel
    const [listings, featuredBoosted, totalVendors, totalListings, categoriesList] = await Promise.all([
      Listing.find({
        status: { $in: ['published', 'active'] },
        isDeleted: { $ne: true },
        ...notTestFilter()
      })
        .sort({ views: -1, orders_count: -1, _id: -1 })
        .limit(15)
        .populate('vendor', 'name business_name profile_pic avatarUrl')
        .lean(),

      Listing.find({
        status: { $in: ['published', 'active'] },
        isDeleted: { $ne: true },
        isBoosted: true,
        ...notTestFilter()
      })
        .sort({ views: -1, _id: -1 })
        .limit(10)
        .lean(),

      User.countDocuments({ $or: [{ role: 'vendor' }, { roles: 'vendor' }], is_deleted: { $ne: true } }),
      Listing.countDocuments({ status: { $in: ['published', 'active'] }, isDeleted: { $ne: true } }),
      categoryService.listCategories({ only_top_level: true }).catch(() => [])
    ]);

    let featured = featuredBoosted || [];
    if (featured.length < 5) {
      const needed = 10 - featured.length;
      const extra = await Listing.find({
        status: { $in: ['published', 'active'] },
        isDeleted: { $ne: true },
        _id: { $nin: featured.map(f => f._id) },
        ...notTestFilter()
      })
        .sort({ views: -1, rating: -1, _id: -1 })
        .limit(needed)
        .lean();
      featured = [...featured, ...(extra || [])];
    }

    const trendingProducts = (listings || []).map((l, index) => ({
      id: l._id.toString(),
      num: String(index + 1).padStart(2, '0'),
      img: (l.images && l.images[0]) || (l.serviceDetails && l.serviceDetails.coverImage) || defaultTrending[index % defaultTrending.length]?.img,
      title: l.title,
      sub: l.shortDescription || l.subcategory || l.category || (l.vendor ? (l.vendor.business_name || l.vendor.name) : 'Verified Vendor'),
      meta: `${(l.views || 0).toLocaleString()} views · ${(l.orders_count || l.saves_count || 0)} leads`,
      price: l.price || l.salePrice || 0,
      category: l.category
    }));

    if (trendingProducts.length < 5) {
      while (trendingProducts.length < 8) {
        const idx = trendingProducts.length;
        trendingProducts.push(defaultTrending[idx % defaultTrending.length]);
      }
    }

    const featuredCards = (featured || []).map((f, index) => {
      const viewCount = f.views || 0;
      const formattedViews = viewCount >= 1000 ? `${(viewCount / 1000).toFixed(1)}K` : `${viewCount}`;
      return {
        id: f._id.toString(),
        badge: f.isBoosted ? 'Featured' : (index === 0 ? 'Top Pick' : null),
        img: (f.images && f.images[0]) || (f.serviceDetails && f.serviceDetails.coverImage) || defaultFeatured[index % defaultFeatured.length]?.img,
        views: formattedViews,
        title: f.title,
        category: f.category || defaultFeatured[index % defaultFeatured.length]?.category || 'Marketplace'
      };
    });

    if (featuredCards.length < 3) {
      while (featuredCards.length < 5) {
        const idx = featuredCards.length;
        featuredCards.push(defaultFeatured[idx % defaultFeatured.length]);
      }
    }

    const result = {
      trendingProducts,
      featuredCards,
      stats: [
        { number: totalVendors > 0 ? `${totalVendors.toLocaleString()}+` : '12K+', label: 'Businesses' },
        { number: '2.4M+', label: 'Leads Generated' },
        { number: totalListings > 0 ? `${totalListings.toLocaleString()}+` : '8.7M+', label: 'Products & Services' },
        { number: '₹350Cr+', label: 'Business Generated' }
      ],
      categories: categoriesList && categoriesList.length > 0 ? categoriesList : []
    };

    // Store in cache for 60 seconds
    await cache.setCache('feed:home_trending', result, 60);

    return result;
  } catch (err) {
    console.error('Error fetching home trending feed:', err);
    throw err;
  }
};

module.exports = { buildFeed, getHomeTrendingFeed };