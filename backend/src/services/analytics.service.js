const Listing = require('../models/Listing');
const User = require('../models/User');
const Deal = require('../models/Deal');
const { Review } = require('../models/Phase4');
const { ListingEvent } = require('../models/Misc');
const ApiError = require('../utils/ApiError');

const RANGE_DAYS = { '7d': 7, '30d': 30, '90d': 90, all: null };

const getRangeCutoffIso = (rangeKey) => {
  const days = RANGE_DAYS[rangeKey];
  if (!days) return null;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return cutoff.toISOString();
};

const overview = async (vendorId, rangeKey = '30d') => {
  const cutoff = getRangeCutoffIso(rangeKey);
  const evQ = { vendor_id: vendorId };
  if (cutoff) {
    evQ.created_at = { $gte: cutoff };
  }

  // Event counts by type
  const agg = await ListingEvent.aggregate([
    { $match: evQ },
    { $group: { _id: '$event_type', n: { $sum: 1 } } },
  ]);
  const counts = {};
  for (const row of agg) {
    counts[row._id] = row.n;
  }

  const totalViews = counts.view || 0;
  const chatsStarted = counts.chat_start || 0;
  const dealsStarted = counts.deal_start || 0;
  const dealsCompleted = counts.deal_complete || 0;
  const saves = counts.save || 0;
  const shares = counts.share || 0;
  const waClicks = counts.wa_click || 0;

  // Unique buyers
  const chatQ = { ...evQ, event_type: 'chat_start', user_id: { $ne: null } };
  const uniqueChatters = await ListingEvent.distinct('user_id', chatQ);
  const uniqueChattersCount = uniqueChatters.length;

  // Watchers count across vendor's active listings
  const watchersAgg = await Listing.aggregate([
    { $match: { vendor_id: vendorId, is_deleted: { $ne: true } } },
    { $project: { watchers_count: { $size: { $ifNull: ['$watchers', []] } } } },
    { $group: { _id: null, total: { $sum: '$watchers_count' } } },
  ]);
  const totalWatchers = watchersAgg.length > 0 ? watchersAgg[0].total : 0;
  const totalLeads = uniqueChattersCount + totalWatchers;

  // Deals by status
  const dealsAgg = await Deal.aggregate([
    { $match: { seller_id: vendorId } },
    { $group: { _id: '$status', n: { $sum: 1 } } },
  ]);
  const dealsByStatus = {};
  let totalDeals = 0;
  for (const row of dealsAgg) {
    dealsByStatus[row._id] = row.n;
    totalDeals += row.n;
  }

  // Reviews summary
  const revAgg = await Review.aggregate([
    { $match: { target_type: 'vendor', target_id: vendorId, is_deleted: { $ne: true } } },
    { $group: { _id: null, avg: { $avg: '$rating' }, n: { $sum: 1 } } },
  ]);

  // Listings summary
  const totalListings = await Listing.countDocuments({
    vendor_id: vendorId,
    is_deleted: { $ne: true },
    is_takendown: { $ne: true },
  });
  const activeListings = await Listing.countDocuments({
    vendor_id: vendorId,
    is_deleted: { $ne: true },
    is_takendown: { $ne: true },
    status: 'active',
  });

  // Conversion rates
  const viewToChat = totalViews ? Math.round((chatsStarted / totalViews) * 100 * 10) / 10 : 0.0;
  const chatToDeal = chatsStarted ? Math.round((dealsStarted / chatsStarted) * 100 * 10) / 10 : 0.0;
  const dealToComplete = dealsStarted ? Math.round((dealsCompleted / dealsStarted) * 100 * 10) / 10 : 0.0;

  return {
    range: rangeKey,
    kpis: {
      views: totalViews,
      chats_started: chatsStarted,
      unique_chatters: uniqueChattersCount,
      watchers: totalWatchers,
      leads: totalLeads,
      deals_started: dealsStarted,
      deals_completed: dealsCompleted,
      saves,
      shares,
      wa_clicks: waClicks,
      listings_total: totalListings,
      listings_active: activeListings,
    },
    deals_by_status: dealsByStatus,
    deals_total: totalDeals,
    conversion: {
      view_to_chat_pct: viewToChat,
      chat_to_deal_pct: chatToDeal,
      deal_to_complete_pct: dealToComplete,
    },
    reviews: {
      avg_rating: revAgg.length > 0 ? Math.round(revAgg[0].avg * 100) / 100 : 0.0,
      count: revAgg.length > 0 ? revAgg[0].n : 0,
    },
  };
};

const perListing = async (vendorId, rangeKey = '30d', sort = 'views', limit = 10) => {
  const cutoff = getRangeCutoffIso(rangeKey);
  const evQ = { vendor_id: vendorId };
  if (cutoff) {
    evQ.created_at = { $gte: cutoff };
  }

  // Aggregate events per listing_id
  const agg = await ListingEvent.aggregate([
    { $match: evQ },
    {
      $group: {
        _id: { listing_id: '$listing_id', type: '$event_type' },
        n: { $sum: 1 },
      },
    },
  ]);

  const countsByListing = {};
  for (const row of agg) {
    const lid = row._id.listing_id;
    const type = row._id.type;
    if (!countsByListing[lid]) {
      countsByListing[lid] = {};
    }
    countsByListing[lid][type] = row.n;
  }

  // Load listing meta
  const listingIds = Object.keys(countsByListing);
  const listings = listingIds.length > 0 ? await Listing.find({ _id: { $in: listingIds } }) : [];
  const lmap = {};
  for (const li of listings) {
    lmap[li._id.toString()] = li;
  }

  const items = [];
  for (const lid of listingIds) {
    const li = lmap[lid] || {};
    const ec = countsByListing[lid] || {};
    items.push({
      listing_id: lid,
      title: li.title || null,
      slug: li.slug || null,
      price: li.price || null,
      boost_expires_at: li.boost_expires_at || null,
      views: ec.view || 0,
      chats: ec.chat_start || 0,
      deals: ec.deal_start || 0,
      deals_completed: ec.deal_complete || 0,
      saves: ec.save || 0,
      shares: ec.share || 0,
      wa_clicks: ec.wa_click || 0,
    });
  }

  const sortKeys = { views: 'views', chats: 'chats', deals: 'deals', shares: 'shares' };
  const key = sortKeys[sort] || 'views';

  items.sort((a, b) => b[key] - a[key]);
  return { range: rangeKey, items: items.slice(0, limit) };
};

const timeseries = async (vendorId, rangeKey = '30d', metric = 'views') => {
  const metricMap = {
    views: 'view',
    chats: 'chat_start',
    deals: 'deal_start',
    deals_completed: 'deal_complete',
  };
  const evType = metricMap[metric] || 'view';
  const days = RANGE_DAYS[rangeKey] || 30;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const evQ = {
    vendor_id: vendorId,
    event_type: evType,
    created_at: { $gte: cutoff.toISOString() },
  };

  const agg = await ListingEvent.aggregate([
    { $match: evQ },
    {
      $project: {
        day: { $substr: ['$created_at', 0, 10] },
      },
    },
    { $group: { _id: '$day', n: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  const buckets = {};
  for (const row of agg) {
    buckets[row._id] = row.n;
  }

  const out = [];
  const startDay = new Date(cutoff);
  const endDay = new Date();
  const current = new Date(startDay);

  while (current <= endDay) {
    const key = current.toISOString().slice(0, 10);
    out.push({ date: key, value: buckets[key] || 0 });
    current.setDate(current.getDate() + 1);
  }

  return { metric, range: rangeKey, items: out };
};

const boostRoi = async (vendorId, listingId) => {
  const li = await Listing.findById(listingId);
  if (!li || li.vendor_id !== vendorId) {
    throw ApiError.notFound('Listing not found');
  }

  const activated = li.boost_activated_at;
  const expires = li.boost_expires_at;
  if (!activated || !expires) {
    throw ApiError.badRequest('This listing has no boost history');
  }
  const dur = li.boost_duration_days || 7;

  const boostStart = new Date(activated);
  let boostEnd = new Date(expires);
  const now = new Date();
  if (boostEnd > now) {
    boostEnd = now; // ROI so far
  }
  const baselineEnd = boostStart;
  const baselineStart = new Date(boostStart.getTime() - dur * 24 * 60 * 60 * 1000);

  const getCounts = async (cstart, cend) => {
    const agg = await ListingEvent.aggregate([
      {
        $match: {
          listing_id: listingId,
          created_at: { $gte: cstart.toISOString(), $lt: cend.toISOString() },
        },
      },
      { $group: { _id: '$event_type', n: { $sum: 1 } } },
    ]);
    const res = {};
    for (const row of agg) {
      res[row._id] = row.n;
    }
    return res;
  };

  const during = await getCounts(boostStart, boostEnd);
  const baseline = await getCounts(baselineStart, baselineEnd);

  const calculateLift = (name) => {
    const b = baseline[name] || 0;
    const d = during[name] || 0;
    if (!b) {
      return d ? Infinity : 0.0;
    }
    return Math.round(((d - b) / b) * 100 * 10) / 10;
  };

  return {
    listing_id: listingId,
    boost_start: boostStart.toISOString(),
    boost_end: boostEnd.toISOString(),
    duration_days: dur,
    during: {
      views: during.view || 0,
      chats: during.chat_start || 0,
      deals: during.deal_start || 0,
    },
    baseline: {
      views: baseline.view || 0,
      chats: baseline.chat_start || 0,
      deals: baseline.deal_start || 0,
    },
    lift_pct: {
      views: calculateLift('view'),
      chats: calculateLift('chat_start'),
      deals: calculateLift('deal_start'),
    },
  };
};

module.exports = {
  overview,
  perListing,
  timeseries,
  boostRoi,
};
