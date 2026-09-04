const mongoose = require('mongoose');
const Interaction = require('../models/Interaction');
const Listing = require('../models/Listing');
const ReelLike = require('../models/ReelLike');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { serializeListing } = require('./listing.service');
const cache = require('../utils/cache');

const COUNT_FIELD = { like: 'likes_count', save: 'saves_count' };

const toggle = async (userId, listingId, type) => {
  if (type !== 'like' && type !== 'save') {
    throw ApiError.badRequest('Invalid interaction type');
  }

  const listing = await Listing.findOne({ _id: listingId, is_deleted: { $ne: true } });
  if (!listing) {
    throw ApiError.notFound('Listing not found');
  }

  const existing = await Interaction.findOne({ user_id: userId, listing_id: listingId, type });
  const field = COUNT_FIELD[type];
  let active = false;

  if (existing) {
    await Interaction.deleteOne({ _id: existing._id });
    if (type === 'like') {
      await Listing.updateOne({ _id: listingId }, { $inc: { likes: -1, likes_count: -1 } });
    } else {
      await Listing.updateOne({ _id: listingId }, { $inc: { [field]: -1 } });
    }
    active = false;
  } else {
    await Interaction.create({
      user_id: userId,
      listing_id: listingId,
      type,
    });
    if (type === 'like') {
      await Listing.updateOne({ _id: listingId }, { $inc: { likes: 1, likes_count: 1 } });
    } else {
      await Listing.updateOne({ _id: listingId }, { $inc: { [field]: 1 } });
    }
    active = true;
  }

  // Invalidate activity counts cache for user
  cache.deleteCache(`user:activity-counts:${userId}`).catch(() => {});

  const updated = await Listing.findById(listingId);
  const count = type === 'like' ? (updated.likes ?? updated.likes_count ?? 0) : (updated[field] || 0);
  return { active, count, type };
};

const myListingsByType = async (userId, type, limit = 50) => {
  if (type !== 'like' && type !== 'save') {
    throw ApiError.badRequest('Invalid type');
  }
  const inters = await Interaction.find({ user_id: userId, type }).sort({ _id: -1 }).limit(limit);
  if (inters.length === 0) {
    return [];
  }
  const ids = inters.map(i => i.listing_id);
  const listings = await Listing.find({ _id: { $in: ids }, is_deleted: { $ne: true } }).limit(limit);

  // Preserve interaction order
  const order = {};
  inters.forEach((item, idx) => {
    order[item.listing_id] = idx;
  });
  listings.sort((a, b) => {
    const idxA = order[a._id.toString()] !== undefined ? order[a._id.toString()] : 999;
    const idxB = order[b._id.toString()] !== undefined ? order[b._id.toString()] : 999;
    return idxA - idxB;
  });

  return listings.map(serializeListing);
};

const userInteractionState = async (userId, rawIds) => {
  if (!userId || !rawIds || rawIds.length === 0) {
    return {};
  }

  const stringIds = rawIds
    .map(id => (id ? (id.toString ? id.toString() : String(id)) : null))
    .filter(Boolean);

  if (stringIds.length === 0) return {};

  const objectIds = stringIds
    .filter(id => mongoose.Types.ObjectId.isValid(id))
    .map(id => new mongoose.Types.ObjectId(id));

  const uidStr = userId.toString ? userId.toString() : String(userId);
  const uidObj = mongoose.Types.ObjectId.isValid(uidStr) ? new mongoose.Types.ObjectId(uidStr) : null;

  const state = {};
  for (const id of stringIds) {
    state[id] = { liked: false, saved: false };
  }

  try {
    // 1. Fetch from Interaction collection (covers listings & reels)
    const interactionQuery = {
      $or: [
        { user_id: uidStr },
        ...(uidObj ? [{ user_id: uidObj }] : []),
      ],
      $and: [
        {
          $or: [
            { listing_id: { $in: stringIds } },
            { reel_id: { $in: stringIds } },
            ...(objectIds.length > 0 ? [{ listing_id: { $in: objectIds } }, { reel_id: { $in: objectIds } }] : []),
          ],
        },
      ],
    };

    // 2. Fetch ReelLikes
    const reelLikePromise = uidObj && objectIds.length > 0
      ? ReelLike.find({ userId: uidObj, reelId: { $in: objectIds } }).lean().catch(() => [])
      : Promise.resolve([]);

    // 3. Fetch User profile saved arrays
    const userProfilePromise = uidObj
      ? User.findById(uidObj).select('customerProfile.savedListings customerProfile.savedReels').lean().catch(() => null)
      : Promise.resolve(null);

    const [inters, reelLikes, userProfile] = await Promise.all([
      Interaction.find(interactionQuery).lean().catch(() => []),
      reelLikePromise,
      userProfilePromise,
    ]);

    // Mark from interactions
    for (const i of inters) {
      const targetId = (i.listing_id || i.reel_id)?.toString();
      if (targetId && state[targetId]) {
        if (i.type === 'like') {
          state[targetId].liked = true;
        } else if (i.type === 'save' || i.type === 'save_image' || i.type === 'save_reel') {
          state[targetId].saved = true;
        }
      }
    }

    // Mark from ReelLikes
    for (const rl of reelLikes) {
      const targetId = rl.reelId?.toString();
      if (targetId && state[targetId]) {
        state[targetId].liked = true;
      }
    }

    // Mark from User profile saved arrays
    if (userProfile?.customerProfile) {
      const savedListings = (userProfile.customerProfile.savedListings || []).map(id => id?.toString());
      const savedReels = (userProfile.customerProfile.savedReels || []).map(id => id?.toString());
      for (const lid of savedListings) {
        if (lid && state[lid]) state[lid].saved = true;
      }
      for (const rid of savedReels) {
        if (rid && state[rid]) state[rid].saved = true;
      }
    }
  } catch (err) {
    console.error('Error computing userInteractionState:', err);
  }

  return state;
};

module.exports = {
  toggle,
  myListingsByType,
  userInteractionState,
};