const Interaction = require('../models/Interaction');
const Listing = require('../models/Listing');
const ApiError = require('../utils/ApiError');
const { serializeListing } = require('./listing.service');

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
    await Listing.updateOne({ _id: listingId }, { $inc: { [field]: -1 } });
    active = false;
  } else {
    await Interaction.create({
      user_id: userId,
      listing_id: listingId,
      type,
    });
    await Listing.updateOne({ _id: listingId }, { $inc: { [field]: 1 } });
    active = true;
  }

  const updated = await Listing.findById(listingId);
  return { active, count: updated[field] || 0, type };
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

const userInteractionState = async (userId, listingIds) => {
  if (!userId || !listingIds || listingIds.length === 0) {
    return {};
  }
  const inters = await Interaction.find({
    user_id: userId,
    listing_id: { $in: listingIds },
  });
  const state = {};
  for (const lid of listingIds) {
    state[lid] = { liked: false, saved: false };
  }
  for (const i of inters) {
    if (state[i.listing_id]) {
      state[i.listing_id][`${i.type}d`] = true;
    }
  }
  return state;
};

module.exports = {
  toggle,
  myListingsByType,
  userInteractionState,
};
