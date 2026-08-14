const Listing = require('../models/Listing');
const User = require('../models/User');
const Reel = require('../models/Reel');
const followService = require('./follow.service');
const { serializeListing } = require('./listing.service');
const { notTestFilter } = require('../utils/helpers');

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

module.exports = { buildFeed };