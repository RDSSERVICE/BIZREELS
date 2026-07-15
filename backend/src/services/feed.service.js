const Listing = require('../models/Listing');
const User = require('../models/User');
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

const getScore = (listing, distKm, followingSet, now) => {
  let s = 0.0;
  // Freshness < 24h
  const created = listing.created_at;
  if (created) {
    try {
      const c = new Date(created);
      if (now - c < 24 * 60 * 60 * 1000) {
        s += 20;
      }
    } catch {}
  }
  // Proximity (linear 30->0)
  if (distKm !== null && distKm !== undefined) {
    s += Math.max(0.0, 30.0 - distKm);
  }
  // Vendor follow boost
  if (listing.vendor_id && followingSet.has(listing.vendor_id.toString())) {
    s += 15;
  }
  // Has reel
  if (listing.reel) {
    s += 10;
  }
  // Has offer
  if (listing.offer_price !== null && listing.offer_price !== undefined) {
    s += 5;
  }
  // Boost
  const boostExp = listing.boost_expires_at;
  if (boostExp) {
    try {
      const bexp = new Date(boostExp);
      if (bexp > now) {
        s += 25;
      }
    } catch {}
  }
  return s;
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
} = {}) => {
  const q = { is_deleted: { $ne: true }, status: 'active', is_takendown: { $ne: true }, ...notTestFilter() };
  const types = TYPE_FILTER[type];
  if (types) {
    q.type = { $in: types };
  }
  if (reels_only || type === 'reels') {
    q.reel = { $ne: null };
  }

  const poolSize = Math.max(limit * 5, 40);
  let docs = [];

  if (lat !== null && lng !== null && radius_km) {
    try {
      // $geoNear via aggregation
      pipeline = [
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
            distanceField: 'distance_meters',
            maxDistance: parseFloat(radius_km) * 1000.0,
            query: q,
            spherical: true,
          },
        },
        { $sort: { _id: -1 } },
        { $limit: poolSize },
      ];
      docs = await Listing.aggregate(pipeline);
    } catch (err) {
      docs = await Listing.find(q).sort({ _id: -1 }).limit(poolSize);
    }
  } else {
    docs = await Listing.find(q).sort({ _id: -1 }).limit(poolSize);
  }

  // Following set
  const followingSet = new Set();
  if (user_id) {
    const ids = await followService.followingIds(user_id);
    for (const id of ids) {
      followingSet.add(id.toString());
    }
  }

  const now = new Date();
  const scored = [];
  for (const d of docs) {
    const dist = d.distance_meters;
    const distKm = dist !== undefined && dist !== null ? dist / 1000.0 : null;
    const score = getScore(d, distKm, followingSet, now);
    scored.push({ score, d });
  }

  // Sort by score desc, then _id desc
  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return String(b.d._id).localeCompare(String(a.d._id));
  });

  // Cursor-based pagination
  let chosen = [];
  if (cursor) {
    let found = false;
    const filtered = [];
    for (const item of scored) {
      if (String(item.d._id) === cursor) {
        found = true;
        continue;
      }
      if (found) {
        filtered.push(item.d);
      }
    }
    chosen = found ? filtered.slice(0, limit) : scored.map(item => item.d).slice(0, limit);
  } else {
    chosen = scored.map(item => item.d).slice(0, limit);
  }

  const resultItems = chosen.map(serializeListing);
  const vendorIds = Array.from(new Set(resultItems.map(r => r.vendor_id).filter(Boolean)));

  if (vendorIds.length > 0) {
    const vendors = await User.find({ _id: { $in: vendorIds } });
    const vmap = {};
    for (const v of vendors) {
      vmap[v._id.toString()] = v;
    }
    for (const r of resultItems) {
      const v = vmap[r.vendor_id];
      if (v) {
        r.vendor = {
          id: v._id.toString(),
          name: v.name,
          profile_pic: v.profile_pic,
        };
      }
    }
  }

  // Interaction state
  if (user_id && resultItems.length > 0) {
    const interactionService = require('./interaction.service');
    const state = await interactionService.userInteractionState(user_id, resultItems.map(r => r.id));
    for (const r of resultItems) {
      r.viewer_state = state[r.id] || { liked: false, saved: false };
    }
  }

  return {
    items: resultItems,
    next_cursor: chosen.length === limit ? String(chosen[chosen.length - 1]._id) : null,
    has_more: chosen.length === limit,
  };
};

module.exports = { buildFeed };
