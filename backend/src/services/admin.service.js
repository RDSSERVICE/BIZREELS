const mongoose = require('mongoose');
const User = require('../models/User');
const Listing = require('../models/Listing');
const Deal = require('../models/Deal');
const { KycDocument, Wallet } = require('../models/Phase4');
const { AuditLog } = require('../models/Misc');
const reportService = require('./report.service');
const walletService = require('./wallet.service');
const ApiError = require('../utils/ApiError');
const { getCache, setCache, deleteCache } = require('../utils/cache');

const VALID_USER_ROLES_ADD = new Set(['customer', 'vendor', 'creator']);

const serializeUserAdmin = (u) => {
  return {
    id: u._id.toString(),
    phone: u.phone,
    name: u.name,
    roles: u.roles || [],
    kyc_status: u.kyc_status || 'unverified',
    is_active: u.is_active !== false,
    is_banned: u.is_banned || false,
    is_subscribed_verified: u.is_subscribed_verified || false,
    rating_avg: u.rating_avg || 0.0,
    trust_score: u.trust_score,
    created_at: u.created_at,
  };
};

const listUsers = async ({ q, role, is_active, kyc_status, is_subscribed_verified, cursor, limit = 20 }) => {
  const query = { is_deleted: { $ne: true } };

  if (q) {
    const escaped = String(q).trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const _q = escaped.slice(0, 80);
    query.$or = [
      { phone: { $regex: _q } },
      { name: { $regex: _q, $options: 'i' } },
    ];
  }
  if (role) {
    query.roles = role;
  }
  if (is_active !== null && is_active !== undefined) {
    query.is_active = is_active;
  }
  if (kyc_status) {
    query.kyc_status = kyc_status;
  }
  if (is_subscribed_verified !== null && is_subscribed_verified !== undefined) {
    query.is_subscribed_verified = is_subscribed_verified;
  }
  if (cursor) {
    query._id = { $lt: cursor };
  }

  const docs = await User.find(query).sort({ _id: -1 }).limit(limit + 1);
  const hasMore = docs.length > limit;
  const sliced = docs.slice(0, limit);
  const items = sliced.map(serializeUserAdmin);

  return {
    items,
    next_cursor: hasMore && items.length > 0 ? items[items.length - 1].id : null,
    has_more: hasMore,
  };
};

const flipUser = async (userId, updates) => {
  const u = await User.findById(userId);
  if (!u) {
    throw ApiError.notFound('User not found');
  }
  if ((u.roles || []).includes('admin')) {
    throw ApiError.forbidden('Cannot modify an admin account');
  }

  updates.updated_at = new Date().toISOString();
  await User.updateOne({ _id: userId }, { $set: updates });

  try {
    const { emitToAdmin } = require('../sockets');
    emitToAdmin('admin:update', { tags: ['AdminUsers', 'AdminOverview'] });
  } catch (err) {}

  await deleteCache('admin:customer:stats').catch(() => {});

  return { ok: true, user_id: userId };
};

const banUser = async (userId) => {
  return await flipUser(userId, { is_banned: true, is_active: false });
};

const unbanUser = async (userId) => {
  return await flipUser(userId, { is_banned: false, is_active: true });
};

const freezeWallet = async (userId) => {
  await walletService.getOrCreate(userId);
  await Wallet.updateOne({ user_id: userId }, { $set: { is_frozen: true, updated_at: new Date().toISOString() } });
  
  try {
    const { emitToAdmin } = require('../sockets');
    emitToAdmin('admin:update', { tags: ['AdminUsers'] });
  } catch (err) {}

  return { ok: true, user_id: userId };
};

const unfreezeWallet = async (userId) => {
  await Wallet.updateOne({ user_id: userId }, { $set: { is_frozen: false, updated_at: new Date().toISOString() } });
  
  try {
    const { emitToAdmin } = require('../sockets');
    emitToAdmin('admin:update', { tags: ['AdminUsers'] });
  } catch (err) {}

  return { ok: true, user_id: userId };
};

const addRole = async (userId, role) => {
  if (!VALID_USER_ROLES_ADD.has(role)) {
    throw ApiError.badRequest(`role must be in ${Array.from(VALID_USER_ROLES_ADD).sort().join(', ')}`);
  }
  const u = await User.findById(userId);
  if (!u) {
    throw ApiError.notFound('User not found');
  }
  await User.updateOne(
    { _id: userId },
    { $addToSet: { roles: role }, $set: { updated_at: new Date().toISOString() } }
  );

  try {
    const { emitToAdmin } = require('../sockets');
    emitToAdmin('admin:update', { tags: ['AdminUsers', 'AdminOverview'] });
  } catch (err) {}

  return { ok: true, user_id: userId, role };
};

const removeRole = async (userId, role) => {
  if (role === 'admin') {
    throw ApiError.forbidden('Cannot remove admin role');
  }
  const u = await User.findById(userId);
  if (!u) {
    throw ApiError.notFound('User not found');
  }
  const roles = u.roles || [];
  if (!roles.includes(role)) {
    return { ok: true, user_id: userId, role };
  }

  const newRoles = roles.filter(r => r !== role);
  if (newRoles.length === 0) {
    throw ApiError.badRequest('User must have at least one role');
  }

  const newCurrent = u.current_role !== role ? u.current_role : newRoles[0];
  await User.updateOne(
    { _id: userId },
    { $set: { roles: newRoles, current_role: newCurrent, updated_at: new Date().toISOString() } }
  );

  try {
    const { emitToAdmin } = require('../sockets');
    emitToAdmin('admin:update', { tags: ['AdminUsers', 'AdminOverview'] });
  } catch (err) {}

  return { ok: true, user_id: userId, role, roles: newRoles };
};

const listListingsAdmin = async (status = null, flagged = null, cursor = null, limit = 20) => {
  const q = { is_deleted: { $ne: true } };
  if (status) {
    q.status = status;
  }
  if (flagged !== null && flagged !== undefined) {
    q.is_takendown = flagged;
  }
  if (cursor) {
    q._id = { $lt: cursor };
  }

  const docs = await Listing.find(q).sort({ _id: -1 }).limit(limit + 1);
  const hasMore = docs.length > limit;
  const sliced = docs.slice(0, limit);
  const { serializeListing } = require('./listing.service');

  return {
    items: sliced.map(serializeListing),
    next_cursor: hasMore && sliced.length > 0 ? sliced[sliced.length - 1]._id.toString() : null,
    has_more: hasMore,
  };
};

const takedownListing = async (listingId) => {
  const res = await Listing.updateOne(
    { _id: listingId },
    { $set: { is_takendown: true, status: 'paused', updated_at: new Date().toISOString() } }
  );
  if (res.matchedCount === 0) {
    throw ApiError.notFound('Listing not found');
  }

  try {
    const { emitToAdmin } = require('../sockets');
    emitToAdmin('admin:update', { tags: ['AdminListings', 'AdminOverview'] });
  } catch (err) {}

  return { ok: true, listing_id: listingId };
};

const restoreListing = async (listingId) => {
  const res = await Listing.updateOne(
    { _id: listingId },
    { $set: { is_takendown: false, status: 'active', updated_at: new Date().toISOString() } }
  );
  if (res.matchedCount === 0) {
    throw ApiError.notFound('Listing not found');
  }

  try {
    const { emitToAdmin } = require('../sockets');
    emitToAdmin('admin:update', { tags: ['AdminListings', 'AdminOverview'] });
  } catch (err) {}

  return { ok: true, listing_id: listingId };
};

let overviewCache = {
  data: null,
  timestamp: 0,
};
const OVERVIEW_CACHE_TTL = 30 * 1000; // 30 seconds cache TTL

const clearOverviewCache = () => {
  overviewCache.data = null;
  overviewCache.timestamp = 0;
};

const analyticsOverview = async () => {
  const currentTime = Date.now();
  if (overviewCache.data && (currentTime - overviewCache.timestamp < OVERVIEW_CACHE_TTL)) {
    return overviewCache.data;
  }
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const yesterdayStart = new Date(new Date(todayStart).getTime() - 24 * 60 * 60 * 1000).toISOString();

  // Lazy-load models that may not always be available
  let Reel, Subscription, Payment, Order, ListingEvent;
  try { Reel = require('../models/Reel'); } catch (e) { Reel = null; }
  try {
    const phase4 = require('../models/Phase4');
    Subscription = phase4.Subscription;
    Payment = phase4.Payment;
  } catch (e) {
    Subscription = null;
    Payment = null;
  }
  try { Order = require('../models/Order'); } catch (e) { Order = null; }
  try {
    const misc = require('../models/Misc');
    ListingEvent = misc.ListingEvent;
  } catch (e) {
    ListingEvent = null;
  }

  // Parallel fetch Step 1: Execute all primary counts and aggregations in parallel
  const [
    totalUsers,
    totalCustomers,
    totalVendors,
    totalCreators,
    totalListings,
    activeListings,
    totalDeals,
    completedDeals,
    pendingKycCount,
    totalOrders,
    openReportsCount,
    activeUsersLast7dAgg,
    activeUsersPrev7dAgg,
    todaysListings,
    yesterdaysListings,
    todaysDeals,
    yesterdaysDeals,
    gmvRes,
    orderGmvRes,
    totalWalletBalanceAgg,
    subscriptionRevenueRes,
    boostRevenueRes,
    listingBoosts,
    topVendorsAgg,
    topCategoriesAgg,
    topCitiesAgg,
    reelsData,
    listingViewsAgg,
    reelViewsAgg,
    todayViewsCount,
    yesterdayViewsCount,
    topViewedReels,
    topViewedListings
  ] = await Promise.all([
    User.countDocuments({ is_deleted: { $ne: true } }).catch(() => 0),
    User.countDocuments({ roles: 'customer', is_deleted: { $ne: true } }).catch(() => 0),
    User.countDocuments({ roles: 'vendor', is_deleted: { $ne: true } }).catch(() => 0),
    User.countDocuments({ roles: 'creator', is_deleted: { $ne: true } }).catch(() => 0),
    Listing.countDocuments({ isDeleted: { $ne: true }, is_deleted: { $ne: true } }).catch(() => 0),
    Listing.countDocuments({ isDeleted: { $ne: true }, is_deleted: { $ne: true }, status: { $in: ['active', 'published'] } }).catch(() => 0),
    Deal.countDocuments({}).catch(() => 0),
    Deal.countDocuments({ status: 'completed' }).catch(() => 0),
    KycDocument.countDocuments({ status: 'pending', is_deleted: { $ne: true } }).catch(() => 0),
    Deal.countDocuments({ is_deleted: { $ne: true } }).catch(() => 0),
    reportService.openCount().catch(() => 0),
    AuditLog.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(sevenDaysAgo) }
        }
      },
      {
        $group: {
          _id: { $ifNull: ['$userId', '$user_id'] }
        }
      },
      {
        $count: 'count'
      }
    ]).catch(() => []),
    AuditLog.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(fourteenDaysAgo),
            $lt: new Date(sevenDaysAgo)
          }
        }
      },
      {
        $group: {
          _id: { $ifNull: ['$userId', '$user_id'] }
        }
      },
      {
        $count: 'count'
      }
    ]).catch(() => []),
    Listing.countDocuments({ createdAt: { $gte: new Date(todayStart) }, isDeleted: { $ne: true }, is_deleted: { $ne: true } }).catch(() => 0),
    Listing.countDocuments({ createdAt: { $gte: new Date(yesterdayStart), $lt: new Date(todayStart) }, isDeleted: { $ne: true }, is_deleted: { $ne: true } }).catch(() => 0),
    Deal.countDocuments({ created_at: { $gte: todayStart } }).catch(() => 0),
    Deal.countDocuments({ created_at: { $gte: yesterdayStart, $lt: todayStart } }).catch(() => 0),
    Deal.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          gmv: {
            $sum: {
              $multiply: [
                { $ifNull: ['$accepted_price', '$initial_offer'] },
                { $ifNull: ['$quantity', 1] },
              ],
            },
          },
        },
      },
    ]).catch(() => []),
    Order ? Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      {
        $group: {
          _id: null,
          gmv: {
            $sum: {
              $multiply: ['$price', '$quantity']
            }
          }
        }
      }
    ]).catch(() => []) : Promise.resolve([]),
    Wallet ? Wallet.aggregate([
      { $group: { _id: null, total_inr: { $sum: '$balance_inr_paise' } } }
    ]).catch(() => []) : Promise.resolve([]),
    Payment ? Payment.aggregate([
      { $match: { status: 'captured', purpose: { $regex: /^verified_badge/ } } },
      { $group: { _id: null, total: { $sum: '$amount_paise' } } }
    ]).catch(() => []) : Promise.resolve([]),
    Payment ? Payment.aggregate([
      { $match: { status: 'captured', purpose: 'listing_boost' } },
      { $group: { _id: null, total: { $sum: '$amount_paise' } } }
    ]).catch(() => []) : Promise.resolve([]),
    Listing.countDocuments({ isBoosted: true, isDeleted: { $ne: true }, is_deleted: { $ne: true } }).setOptions({ includeSoftDeleted: true }).catch(() => 0) || Promise.resolve(0),
    Deal.aggregate([
      { $match: { status: 'completed', seller_id: { $ne: null } } },
      {
        $group: {
          _id: '$seller_id',
          salesSum: {
            $sum: {
              $multiply: [
                { $ifNull: ['$accepted_price', '$initial_offer'] },
                { $ifNull: ['$quantity', 1] },
              ],
            },
          },
          ordersCount: { $sum: 1 },
        },
      },
      { $sort: { salesSum: -1 } },
      { $limit: 5 }
    ]).catch(() => []),
    Listing.aggregate([
      { $match: { isDeleted: { $ne: true }, is_deleted: { $ne: true } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]).catch(() => []),
    User.aggregate([
      { $match: { is_deleted: { $ne: true }, city: { $ne: null } } },
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]).catch(() => []),
    Reel ? Promise.all([
      Reel.countDocuments({ isDeleted: { $ne: true }, is_deleted: { $ne: true } }).setOptions({ includeSoftDeleted: true }).catch(() => 0) || Reel.countDocuments({}).catch(() => 0),
      Reel.countDocuments({ createdAt: { $gte: new Date(todayStart) }, isDeleted: { $ne: true }, is_deleted: { $ne: true } }).catch(() => 0),
      Reel.countDocuments({ createdAt: { $gte: new Date(yesterdayStart), $lt: new Date(todayStart) }, isDeleted: { $ne: true }, is_deleted: { $ne: true } }).catch(() => 0),
      Reel.countDocuments({ isBoosted: true, isDeleted: { $ne: true }, is_deleted: { $ne: true } }).setOptions({ includeSoftDeleted: true }).catch(() => 0) || 0,
      Reel.aggregate([
        { $match: { isDeleted: { $ne: true }, is_deleted: { $ne: true }, creator: { $ne: null } } },
        {
          $group: {
            _id: '$creator',
            viewsSum: { $sum: { $ifNull: ['$views', 0] } },
            reelsCount: { $sum: 1 },
          },
        },
        { $sort: { viewsSum: -1 } },
        { $limit: 5 }
      ]).catch(() => [])
    ]) : Promise.resolve([0, 0, 0, 0, []]),
    Listing.aggregate([
      { $match: { isDeleted: { $ne: true }, is_deleted: { $ne: true } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$views', 0] } } } }
    ]).catch(() => []),
    Reel ? Reel.aggregate([
      { $match: { isDeleted: { $ne: true }, is_deleted: { $ne: true } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$views', 0] } } } }
    ]).catch(() => []) : Promise.resolve([]),
    ListingEvent ? ListingEvent.countDocuments({ event_type: 'view', created_at: { $gte: new Date(todayStart) } }).catch(() => 0) : Promise.resolve(0),
    ListingEvent ? ListingEvent.countDocuments({ event_type: 'view', created_at: { $gte: new Date(yesterdayStart), $lt: new Date(todayStart) } }).catch(() => 0) : Promise.resolve(0),
    Reel ? Reel.find({ isDeleted: { $ne: true }, is_deleted: { $ne: true } }).sort({ views: -1 }).limit(5).populate('creator', 'name profile_pic avatarUrl').select('caption thumbnailUrl views likesCount category creator').lean().catch(() => []) : Promise.resolve([]),
    Listing.find({ isDeleted: { $ne: true }, is_deleted: { $ne: true } }).sort({ views: -1 }).limit(5).populate('vendor', 'name profile_pic avatarUrl vendorProfile').select('title price sellingPrice views images category vendor').lean().catch(() => [])
  ]);

  const activeUsersLast7d = activeUsersLast7dAgg[0]?.count || 0;
  const activeUsersPrev7d = activeUsersPrev7dAgg[0]?.count || 0;

  let [
    totalReels,
    todaysReels,
    yesterdaysReels,
    activeBoosts,
    topCreatorsAgg
  ] = reelsData;

  activeBoosts = (activeBoosts || 0) + (listingBoosts || 0);

  const dealGmvPaise = Math.round((gmvRes.length > 0 ? gmvRes[0].gmv : 0) * 100);
  const orderGmvPaise = Math.round((orderGmvRes.length > 0 ? orderGmvRes[0].gmv : 0) * 100);
  const totalGmvPaise = dealGmvPaise + orderGmvPaise;
  const totalWalletBalance = totalWalletBalanceAgg.length > 0 ? (totalWalletBalanceAgg[0].total_inr || 0) : 0;
  const subscriptionRevenue = subscriptionRevenueRes.length > 0 ? subscriptionRevenueRes[0].total : 0;
  const boostRevenuePaise = boostRevenueRes.length > 0 ? boostRevenueRes[0].total : 0;

  const topVendorIds = (topVendorsAgg || []).map(v => v._id).filter(id => id != null);
  const topCreatorIds = (topCreatorsAgg || []).map(c => c._id).filter(id => id != null);

  // Parallel fetch Step 2: Retrieve top user profiles and fallbacks in parallel
  const [
    vendorUsers,
    creatorUsers,
    remainingVendors,
    remainingCreators
  ] = await Promise.all([
    topVendorIds.length > 0 ? User.find({ _id: { $in: topVendorIds }, is_deleted: { $ne: true } }).lean().catch(() => []) : Promise.resolve([]),
    topCreatorIds.length > 0 ? User.find({ _id: { $in: topCreatorIds }, is_deleted: { $ne: true } }).lean().catch(() => []) : Promise.resolve([]),
    topVendorsAgg.length < 5 ? User.find({
      roles: 'vendor',
      _id: { $nin: topVendorIds },
      is_deleted: { $ne: true }
    }).sort({ rating_avg: -1, created_at: -1 }).limit(5 - (topVendorsAgg?.length || 0)).lean().catch(() => []) : Promise.resolve([]),
    Reel && (topCreatorsAgg?.length || 0) < 5 ? User.find({
      roles: 'creator',
      _id: { $nin: topCreatorIds },
      is_deleted: { $ne: true }
    }).sort({ rating_avg: -1, created_at: -1 }).limit(5 - (topCreatorsAgg?.length || 0)).lean().catch(() => []) : Promise.resolve([])
  ]);

  const vendorUserMap = {};
  (vendorUsers || []).forEach(u => {
    if (u && u._id) vendorUserMap[u._id.toString()] = u;
  });

  let topVendors = (topVendorsAgg || [])
    .filter(item => item && item._id)
    .map(item => {
      const idStr = item._id.toString();
      const user = vendorUserMap[idStr];
      return {
        _id: idStr,
        name: user?.vendorProfile?.store_name || user?.name || 'Vendor',
        sales: `₹${(item.salesSum || 0).toLocaleString('en-IN')}`,
        salesAmount: item.salesSum || 0,
        orders: item.ordersCount || 0,
        rating: user?.rating_avg || 5.0,
      };
    });

  (remainingVendors || []).forEach(v => {
    if (v && v._id) {
      topVendors.push({
        _id: v._id.toString(),
        name: v.vendorProfile?.store_name || v.name || 'Vendor',
        sales: '₹0',
        salesAmount: 0,
        orders: 0,
        rating: v.rating_avg || 5.0,
      });
    }
  });

  const creatorUserMap = {};
  (creatorUsers || []).forEach(u => {
    if (u && u._id) creatorUserMap[u._id.toString()] = u;
  });

  let topCreators = (topCreatorsAgg || [])
    .filter(item => item && item._id)
    .map(item => {
      const idStr = item._id.toString();
      const user = creatorUserMap[idStr];
      const viewsNum = item.viewsSum || 0;
      return {
        _id: idStr,
        name: user?.name || 'Creator',
        views: viewsNum >= 1000 ? `${(viewsNum / 1000).toFixed(1)}K` : `${viewsNum}`,
        viewsCount: viewsNum,
        reels: item.reelsCount || 0,
        rating: user?.rating_avg || 5.0,
      };
    });

  (remainingCreators || []).forEach(c => {
    if (c && c._id) {
      topCreators.push({
        _id: c._id.toString(),
        name: c.name || 'Creator',
        views: '0',
        viewsCount: 0,
        reels: 0,
        rating: c.rating_avg || 5.0,
      });
    }
  });

  const totalListingViews = (listingViewsAgg && listingViewsAgg[0]?.total) || 0;
  const totalReelViews = (reelViewsAgg && reelViewsAgg[0]?.total) || 0;
  const totalPlatformViews = totalListingViews + totalReelViews;
  const todaysViews = todayViewsCount || 0;
  const yesterdaysViews = yesterdayViewsCount || 0;

  const totalListingsCount = totalListings || 1;
  const topCategories = (topCategoriesAgg || []).map(cat => ({
    name: cat._id || 'General',
    share: `${Math.round((cat.count / totalListingsCount) * 100)}%`,
    listings: cat.count,
  }));

  const totalUsersCount = totalUsers || 1;
  const topCities = (topCitiesAgg || []).map(city => ({
    city: city._id || 'Other',
    users: city.count.toLocaleString('en-IN'),
    share: `${Math.round((city.count / totalUsersCount) * 100)}%`,
  }));

  // Trends calculation utility
  const calcTrend = (curr, prev) => {
    if (!prev) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  // Compile legacy field compatibility values (todays_uploads)
  const todaysUploads = todaysListings + todaysReels;

  const formattedTopReels = (topViewedReels || []).map(r => ({
    _id: r._id?.toString(),
    caption: r.caption || 'Reel Video',
    thumbnailUrl: r.thumbnailUrl || '',
    views: r.views || 0,
    formattedViews: (r.views || 0) >= 1000 ? `${((r.views || 0) / 1000).toFixed(1)}K` : `${r.views || 0}`,
    likesCount: r.likesCount || 0,
    category: r.category || 'General',
    creatorName: r.creator?.name || 'Creator',
  }));

  const formattedTopListings = (topViewedListings || []).map(l => ({
    _id: l._id?.toString(),
    title: l.title || 'Listing',
    image: l.images?.[0] || '',
    price: l.price || l.sellingPrice || 0,
    views: l.views || 0,
    formattedViews: (l.views || 0) >= 1000 ? `${((l.views || 0) / 1000).toFixed(1)}K` : `${l.views || 0}`,
    category: l.category || 'General',
    vendorName: l.vendor?.vendorProfile?.store_name || l.vendor?.name || 'Vendor',
  }));

  const responseData = {
    total_users: totalUsers,
    total_customers: totalCustomers,
    total_vendors: totalVendors,
    total_creators: totalCreators,
    total_listings: totalListings,
    active_listings: activeListings,
    total_reels: totalReels,
    todays_uploads: todaysUploads,
    active_boosts: activeBoosts,
    total_revenue_paise: totalGmvPaise,
    total_deals: totalDeals,
    completed_deals: completedDeals,
    total_gmv_paise: totalGmvPaise,
    pending_kyc_count: pendingKycCount,
    open_reports_count: openReportsCount,
    total_orders: totalOrders,
    wallet_balance_paise: totalWalletBalance,
    subscription_revenue_paise: subscriptionRevenue,
    boost_revenue_paise: boostRevenuePaise,
    active_users_last_7d: activeUsersLast7d,
    top_vendors: topVendors,
    top_creators: topCreators,
    top_categories: topCategories,
    top_cities: topCities,

    // Platform view metrics
    total_views: totalPlatformViews,
    total_listing_views: totalListingViews,
    total_reel_views: totalReelViews,
    todays_views: todaysViews,
    todays_views_trend: calcTrend(todaysViews, yesterdaysViews),
    top_viewed_reels: formattedTopReels,
    top_viewed_listings: formattedTopListings,

    // Real-time daily counters
    todays_listings: todaysListings,
    todays_reels: todaysReels,
    todays_deals: todaysDeals,

    // Calculated percentage trends
    active_users_trend: calcTrend(activeUsersLast7d, activeUsersPrev7d),
    todays_listings_trend: calcTrend(todaysListings, yesterdaysListings),
    todays_reels_trend: calcTrend(todaysReels, yesterdaysReels),
    todays_deals_trend: calcTrend(todaysDeals, yesterdaysDeals),
  };

  overviewCache.data = responseData;
  overviewCache.timestamp = currentTime;

  return responseData;
};

// ============================================================ USER DETAIL / CRUD
const getUserDetail = async (userId) => {
  const u = await User.findById(userId);
  if (!u || u.is_deleted) throw ApiError.notFound('User not found');

  let walletData = null;
  try {
    const w = await Wallet.findOne({ user_id: userId });
    if (w) {
      walletData = {
        credits: w.credits,
        balance_inr_paise: w.balance_inr_paise,
        is_frozen: w.is_frozen,
      };
    }
  } catch (e) { /* ignore */ }

  return {
    ...serializeUserAdmin(u),
    email: u.email,
    gender: u.gender,
    dob: u.dob,
    city: u.city || u.location?.city,
    state: u.location?.state,
    pincode: u.location?.pincode,
    profile_pic: u.profile_pic || u.avatarUrl,
    vendor_profile: u.vendorProfile,
    creator_profile: u.creatorProfile,
    followersCount: u.followersCount || 0,
    followingCount: u.followingCount || 0,
    wallet: walletData,
  };
};

const updateUser = async (userId, updates) => {
  const u = await User.findById(userId);
  if (!u) throw ApiError.notFound('User not found');
  if ((u.roles || []).includes('admin')) throw ApiError.forbidden('Cannot modify an admin account');

  const allowed = ['name', 'email', 'gender', 'dob', 'city'];
  const safeUpdates = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) safeUpdates[key] = updates[key];
  }
  safeUpdates.updated_at = new Date().toISOString();
  await User.updateOne({ _id: userId }, { $set: safeUpdates });

  try {
    const { emitToAdmin } = require('../sockets');
    emitToAdmin('admin:update', { tags: ['AdminUsers', 'AdminOverview'] });
  } catch (err) {}

  return { ok: true, user_id: userId };
};

const suspendUser = async (userId) => {
  return await flipUser(userId, { is_active: false });
};

const deleteUser = async (userId) => {
  const result = await flipUser(userId, { is_deleted: true, isDeleted: true, is_active: false, isActive: false });

  // Cascade delete all user-related data
  try {
    const Reel = require('../models/Reel');
    const Listing = require('../models/Listing');
    const Comment = require('../models/Comment');
    const ReelLike = require('../models/ReelLike');
    const Requirement = require('../models/Requirement');
    const Review = require('../models/Review');
    const Offer = require('../models/Offer');
    const Inquiry = require('../models/Inquiry');
    const HireRequest = require('../models/HireRequest');
    const Follow = require('../models/Follow');
    const Conversation = require('../models/Conversation');
    const Message = require('../models/Message');
    const RefreshToken = require('../models/RefreshToken');
    const Order = require('../models/Order');
    const Deal = require('../models/Deal');
    const Notification = require('../models/Notification');
    const Proposal = require('../models/Proposal');
    const Quote = require('../models/Quote');

    // Execute deleteMany calls in parallel
    await Promise.all([
      Reel.deleteMany({ creator: userId }),
      Listing.deleteMany({ vendor: userId }),
      Comment.deleteMany({ user: userId }),
      ReelLike.deleteMany({ user: userId }),
      Requirement.deleteMany({ customer: userId }),
      Review.deleteMany({ $or: [{ author: userId }, { targetUser: userId }] }),
      Offer.deleteMany({ $or: [{ userId: userId }, { createdBy: userId }] }),
      Inquiry.deleteMany({ $or: [{ customer: userId }, { vendor: userId }] }),
      HireRequest.deleteMany({ $or: [{ vendor: userId }, { creator: userId }] }),
      Follow.deleteMany({ $or: [{ follower_id: userId.toString() }, { following_id: userId.toString() }] }),
      Conversation.deleteMany({ participants: userId }),
      Message.deleteMany({ sender: userId }),
      RefreshToken.deleteMany({ user: userId }),
      Order.deleteMany({ $or: [{ customer: userId }, { vendor: userId }] }),
      Deal.deleteMany({ $or: [{ buyer_id: userId.toString() }, { seller_id: userId.toString() }] }),
      Notification.deleteMany({ $or: [{ recipient: userId }, { sender: userId }, { recipient: userId.toString() }, { sender: userId.toString() }] }),
      Proposal.deleteMany({ vendor_id: userId }),
      Quote.deleteMany({ vendor: userId })
    ]);
  } catch (err) {
    console.error('Error cascading deletion for user ' + userId + ' in admin deleteUser:', err);
  }

  return result;
};

const getLoginHistory = async (userId, limit = 20) => {
  const logs = await AuditLog.find({
    user_id: userId,
    action: { $in: ['login', 'logout', 'login_failed'] },
  }).sort({ _id: -1 }).limit(limit);

  return {
    items: logs.map(l => ({
      id: l._id.toString(),
      action: l.action,
      ip: l.ip || l.meta?.ip || null,
      user_agent: l.meta?.user_agent || null,
      created_at: l.created_at,
    })),
  };
};

const TEST_DATA_REGEX = '^(demo_|test_|mock_).+|.*(test_user|mock_user|dummy).*';

const USER_FK_COLLECTIONS = [
  ['listings', 'vendor_id'],
  ['reviews', 'reviewer_id'],
  ['chat_threads', 'customer_id'],
  ['chat_threads', 'vendor_id'],
  ['messages', 'sender_id'],
  ['deals', 'buyer_id'],
  ['deals', 'vendor_id'],
  ['proposals', 'creator_id'],
  ['proposals', 'customer_id'],
  ['requirements', 'customer_id'],
  ['listing_events', 'vendor_id'],
  ['listing_events', 'user_id'],
  ['interactions', 'user_id'],
  ['follows', 'follower_id'],
  ['follows', 'following_id'],
  ['notifications', 'user_id'],
  ['wallets', 'user_id'],
  ['wallet_transactions', 'user_id'],
  ['subscriptions', 'user_id'],
  ['payments', 'user_id'],
  ['kyc_documents', 'user_id'],
  ['referrals', 'referrer_id'],
  ['referrals', 'referred_user_id'],
  ['response_events', 'vendor_id'],
  ['search_history', 'user_id'],
  ['watcher_notifications', 'user_id'],
];

const purgeTestData = async (dryRun = false) => {
  const regexClause = { $regex: TEST_DATA_REGEX, $options: 'i' };
  const userMatch = { $or: [{ is_test_data: true }, { name: regexClause }] };
  const listingMatch = { $or: [{ is_test_data: true }, { title: regexClause }] };

  const userDocs = await User.find(userMatch, { _id: 1 });
  const userIdsStr = userDocs.map(u => u._id.toString());
  const userIdsObj = userDocs.map(u => u._id);

  const listingDocs = await Listing.find(listingMatch, { _id: 1 });
  const listingIdsStr = listingDocs.map(l => l._id.toString());

  const counts = {
    users_matched: userDocs.length,
    listings_matched_by_name: listingDocs.length,
  };

  const now = new Date().toISOString();

  // Users soft-delete
  if (!dryRun && userIdsObj.length > 0) {
    const r = await User.updateMany(
      { _id: { $in: userIdsObj } },
      { $set: { is_deleted: true, is_active: false, is_test_data: true, updated_at: now } }
    );
    counts.users_soft_deleted = r.modifiedCount;
  } else {
    counts.users_soft_deleted = 0;
  }

  // Listings soft-delete
  const listingOr = [];
  if (listingIdsStr.length > 0) {
    listingOr.push({ _id: { $in: listingIdsStr } });
  }
  if (userIdsStr.length > 0) {
    listingOr.push({ vendor_id: { $in: userIdsStr } });
  }
  if (listingOr.length > 0) {
    const listingCascadeQ = listingOr.length === 1 ? listingOr[0] : { $or: listingOr };
    const cascadedCount = await Listing.countDocuments(listingCascadeQ);
    counts.listings_total_purged = cascadedCount;
    if (!dryRun) {
      await Listing.updateMany(
        listingCascadeQ,
        { $set: { is_deleted: true, is_active: false, is_test_data: true, updated_at: now } }
      );
    }
  } else {
    counts.listings_total_purged = 0;
  }

  // Cascade across user FK collections
  const perColl = {};
  if (userIdsStr.length > 0) {
    const conn = mongoose.connection;
    for (const [collName, fk] of USER_FK_COLLECTIONS) {
      const q = { [fk]: { $in: userIdsStr } };
      const n = await conn.db.collection(collName).countDocuments(q);
      if (n > 0) {
        perColl[`${collName}.${fk}`] = n;
        if (!dryRun) {
          await conn.db.collection(collName).updateMany(
            q,
            { $set: { is_deleted: true, is_test_data: true, updated_at: now } }
          );
        }
      }
    }
  }

  return {
    ok: true,
    dry_run: dryRun,
    counts,
    cascade: perColl,
  };
};

const listCustomers = async ({
  q,
  status,
  kyc_status,
  has_orders,
  registered_from,
  registered_to,
  sort,
  page = 1,
  limit = 20
}) => {
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
  const skipNum = (pageNum - 1) * limitNum;

  const matchStage = {
    is_deleted: { $ne: true },
    roles: 'customer'
  };

  if (q) {
    const escaped = String(q).trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const _q = escaped.slice(0, 80);
    const orClauses = [
      { name: { $regex: _q, $options: 'i' } },
      { phone: { $regex: _q } },
      { email: { $regex: _q, $options: 'i' } }
    ];
    if (mongoose.Types.ObjectId.isValid(q)) {
      orClauses.push({ _id: new mongoose.Types.ObjectId(q) });
    }
    matchStage.$or = orClauses;
  }

  if (status) {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'active') {
      matchStage.is_banned = { $ne: true };
      matchStage.is_active = { $ne: false };
    } else if (lowerStatus === 'suspended') {
      matchStage.is_banned = { $ne: true };
      matchStage.is_active = false;
    } else if (lowerStatus === 'blocked') {
      matchStage.is_banned = true;
    } else if (lowerStatus === 'inactive') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      matchStage.$or = [
        { is_active: false },
        { lastLoginAt: { $lt: thirtyDaysAgo } },
        { lastLoginAt: { $exists: false } }
      ];
    }
  }

  if (kyc_status) {
    const lowerKyc = kyc_status.toLowerCase();
    if (lowerKyc === 'verified') {
      matchStage.kyc_status = 'approved';
    } else if (lowerKyc === 'unverified') {
      matchStage.kyc_status = { $ne: 'approved' };
    } else {
      matchStage.kyc_status = lowerKyc;
    }
  }

  if (registered_from || registered_to) {
    matchStage.created_at = {};
    if (registered_from) {
      const fromDate = new Date(registered_from);
      if (!isNaN(fromDate.getTime())) {
        matchStage.created_at.$gte = fromDate;
      }
    }
    if (registered_to) {
      const toDate = new Date(registered_to);
      if (!isNaN(toDate.getTime())) {
        matchStage.created_at.$lte = toDate;
      }
    }
  }

  const sortStage = {};
  if (sort) {
    switch (sort) {
      case 'newest_first':
      case 'newest':
        sortStage.created_at = -1;
        break;
      case 'oldest_first':
      case 'oldest':
        sortStage.created_at = 1;
        break;
      case 'name_asc':
      case 'name_a_z':
        sortStage.name = 1;
        break;
      case 'name_desc':
      case 'name_z_a':
        sortStage.name = -1;
        break;
      case 'highest_spending':
      case 'spending_desc':
        sortStage.total_spent = -1;
        break;
      case 'lowest_spending':
      case 'spending_asc':
        sortStage.total_spent = 1;
        break;
      case 'most_orders':
      case 'orders_desc':
        sortStage.total_orders = -1;
        break;
      case 'least_orders':
      case 'orders_asc':
        sortStage.total_orders = 1;
        break;
      case 'last_login':
        sortStage.lastLoginAt = -1;
        break;
      default:
        sortStage.created_at = -1;
    }
  } else {
    sortStage.created_at = -1;
  }

  const needsAggBeforePage = 
    (has_orders !== undefined && has_orders !== null) ||
    ['highest_spending', 'spending_desc', 'lowest_spending', 'spending_asc', 'most_orders', 'orders_desc', 'least_orders', 'orders_asc'].includes(sort);

  let data = [];
  let total = 0;

  if (!needsAggBeforePage) {
    total = await User.countDocuments(matchStage);
    const users = await User.find(matchStage)
      .sort(sortStage)
      .skip(skipNum)
      .limit(limitNum)
      .lean();

    const userIds = users.map(u => u._id);
    if (userIds.length > 0) {
      const aggData = await User.aggregate([
        { $match: { _id: { $in: userIds } } },
        {
          $project: {
            _id: 1,
            _id_str: { $toString: '$_id' },
            name: 1,
            email: 1,
            phone: 1,
            profile_pic: 1,
            avatarUrl: 1,
            is_active: 1,
            is_banned: 1,
            kyc_status: 1,
            referral_code: 1,
            created_at: 1,
            lastLoginAt: 1,
            lastLoginIp: 1
          }
        },
        {
          $lookup: {
            from: 'wallets',
            localField: '_id_str',
            foreignField: 'user_id',
            as: 'wallet_doc'
          }
        },
        {
          $unwind: {
            path: '$wallet_doc',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: 'orders',
            localField: '_id',
            foreignField: 'customer',
            as: 'all_orders'
          }
        },
        {
          $lookup: {
            from: 'deals',
            localField: '_id_str',
            foreignField: 'buyer_id',
            as: 'all_deals'
          }
        },
        {
          $project: {
            id: '$_id',
            _id: 1,
            name: 1,
            email: 1,
            phone: 1,
            profile_pic: { $ifNull: ['$profile_pic', '$avatarUrl'] },
            is_active: 1,
            is_banned: 1,
            kyc_status: 1,
            referral_code: 1,
            created_at: 1,
            lastLoginAt: 1,
            lastLoginIp: 1,
            wallet: {
              credits: { $ifNull: ['$wallet_doc.credits', 0] },
              balance_inr_paise: { $ifNull: ['$wallet_doc.balance_inr_paise', 0] },
              is_frozen: { $ifNull: ['$wallet_doc.is_frozen', false] }
            },
            paid_orders: {
              $filter: {
                input: '$all_orders',
                as: 'o',
                cond: { $eq: ['$$o.paymentStatus', 'paid'] }
              }
            },
            completed_deals: {
              $filter: {
                input: '$all_deals',
                as: 'd',
                cond: { $eq: ['$$d.status', 'completed'] }
              }
            }
          }
        },
        {
          $project: {
            id: 1,
            _id: 1,
            name: 1,
            email: 1,
            phone: 1,
            profile_pic: 1,
            is_active: 1,
            is_banned: 1,
            kyc_status: 1,
            referral_code: 1,
            created_at: 1,
            lastLoginAt: 1,
            lastLoginIp: 1,
            wallet: 1,
            total_orders: {
              $add: [
                { $size: { $ifNull: ['$paid_orders', []] } },
                { $size: { $ifNull: ['$completed_deals', []] } }
              ]
            },
            total_spent: {
              $add: [
                { $sum: { $ifNull: ['$paid_orders.price', []] } },
                { $sum: { $ifNull: ['$completed_deals.current_offer', []] } }
              ]
            }
          }
        }
      ]);

      // Preserve sorting order of `users` array
      const dataMap = new Map(aggData.map(item => [item._id.toString(), item]));
      data = users.map(u => dataMap.get(u._id.toString())).filter(Boolean);
    }
  } else {
    // Slow fallback path
    const pipeline = [
      { $match: matchStage },
      {
        $project: {
          _id: 1,
          _id_str: { $toString: '$_id' },
          name: 1,
          email: 1,
          phone: 1,
          profile_pic: 1,
          avatarUrl: 1,
          is_active: 1,
          is_banned: 1,
          kyc_status: 1,
          referral_code: 1,
          created_at: 1,
          lastLoginAt: 1,
          lastLoginIp: 1
        }
      },
      {
        $lookup: {
          from: 'wallets',
          localField: '_id_str',
          foreignField: 'user_id',
          as: 'wallet_doc'
        }
      },
      {
        $unwind: {
          path: '$wallet_doc',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'customer',
          as: 'all_orders'
        }
      },
      {
        $lookup: {
          from: 'deals',
          localField: '_id_str',
          foreignField: 'buyer_id',
          as: 'all_deals'
        }
      },
      {
        $project: {
          id: '$_id',
          _id: 1,
          name: 1,
          email: 1,
          phone: 1,
          profile_pic: { $ifNull: ['$profile_pic', '$avatarUrl'] },
          is_active: 1,
          is_banned: 1,
          kyc_status: 1,
          referral_code: 1,
          created_at: 1,
          lastLoginAt: 1,
          lastLoginIp: 1,
          wallet: {
            credits: { $ifNull: ['$wallet_doc.credits', 0] },
            balance_inr_paise: { $ifNull: ['$wallet_doc.balance_inr_paise', 0] },
            is_frozen: { $ifNull: ['$wallet_doc.is_frozen', false] }
          },
          paid_orders: {
            $filter: {
              input: '$all_orders',
              as: 'o',
              cond: { $eq: ['$$o.paymentStatus', 'paid'] }
            }
          },
          completed_deals: {
            $filter: {
              input: '$all_deals',
              as: 'd',
              cond: { $eq: ['$$d.status', 'completed'] }
            }
          }
        }
      },
      {
        $project: {
          id: 1,
          _id: 1,
          name: 1,
          email: 1,
          phone: 1,
          profile_pic: 1,
          is_active: 1,
          is_banned: 1,
          kyc_status: 1,
          referral_code: 1,
          created_at: 1,
          lastLoginAt: 1,
          lastLoginIp: 1,
          wallet: 1,
          total_orders: {
            $add: [
              { $size: { $ifNull: ['$paid_orders', []] } },
              { $size: { $ifNull: ['$completed_deals', []] } }
            ]
          },
          total_spent: {
            $add: [
              { $sum: { $ifNull: ['$paid_orders.price', []] } },
              { $sum: { $ifNull: ['$completed_deals.current_offer', []] } }
            ]
          }
        }
      }
    ];

    if (has_orders !== undefined && has_orders !== null) {
      if (has_orders === 'true') {
        pipeline.push({ $match: { total_orders: { $gt: 0 } } });
      } else if (has_orders === 'false') {
        pipeline.push({ $match: { total_orders: 0 } });
      }
    }

    pipeline.push({ $sort: sortStage });

    pipeline.push({
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [{ $skip: skipNum }, { $limit: limitNum }]
      }
    });

    const aggregateResult = await User.aggregate(pipeline);
    data = aggregateResult[0]?.data || [];
    total = aggregateResult[0]?.metadata[0]?.total || 0;
  }

  return {
    items: data.map(u => ({
      ...u,
      id: u._id.toString()
    })),
    total,
    page: pageNum,
    limit: limitNum,
    pages: Math.ceil(total / limitNum)
  };
};

const getCustomerProfileDetails = async (userId) => {
  const User = require('../models/User');
  const Order = require('../models/Order');
  const Deal = require('../models/Deal');
  const { Review, Wallet, Payment, Notification } = require('../models/Phase4');
  const { AuditLog, Referral } = require('../models/Misc');
  const Inquiry = require('../models/Inquiry');

  const u = await User.findById(userId)
    .populate('customerProfile.savedListings');
  if (!u || u.is_deleted) throw ApiError.notFound('Customer not found');

  const userIdStr = userId.toString();

  let walletData = { credits: 0, balance_inr_paise: 0, is_frozen: false };
  try {
    const w = await Wallet.findOne({ user_id: userIdStr });
    if (w) {
      walletData = {
        credits: w.credits,
        balance_inr_paise: w.balance_inr_paise,
        is_frozen: w.is_frozen,
      };
    }
  } catch (e) {}

  const rawOrders = await Order.find({ customer: userId })
    .populate('vendor', 'name businessName phone')
    .populate('listing', 'title images type category')
    .sort({ createdAt: -1 });

  const rawDeals = await Deal.find({ buyer_id: userIdStr, status: 'completed' })
    .sort({ updated_at: -1 });

  const orders = [
    ...rawOrders.map(o => ({
      id: o._id.toString(),
      type: 'product',
      item_name: o.listing?.title || 'Product Order',
      vendor_name: o.vendor?.name || o.vendor?.businessName || 'Vendor',
      quantity: o.quantity,
      price: o.price,
      status: o.status,
      payment_status: o.paymentStatus,
      created_at: o.createdAt,
    })),
    ...rawDeals.map(d => ({
      id: d._id.toString(),
      type: 'deal',
      item_name: d.listing_id ? 'Negotiated Deal' : 'Service Deal',
      vendor_name: 'Vendor',
      quantity: 1,
      price: d.final_amount || d.current_offer,
      status: d.status,
      payment_status: 'paid',
      created_at: d.created_at,
    }))
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const payments = await Payment.find({ user_id: userIdStr })
    .sort({ created_at: -1 });

  const wishlist = (u.customerProfile?.savedListings || []).map(l => ({
    id: l._id?.toString(),
    title: l.title,
    price: l.salePrice || l.price,
    images: l.images || [],
    category: l.category,
    status: l.status,
  }));

  const reviews = await Review.find({ reviewer_id: userIdStr })
    .sort({ created_at: -1 });

  const notifications = await Notification.find({ user_id: userIdStr })
    .sort({ created_at: -1 })
    .limit(100);

  const inquiries = await Inquiry.find({ customer: userId })
    .populate('vendor', 'name businessName')
    .populate('listing', 'title')
    .sort({ createdAt: -1 });

  const referrals = await Referral.find({ referrer_id: userIdStr })
    .sort({ created_at: -1 });
  
  const referredByDoc = await Referral.findOne({ referred_user_id: userIdStr });
  let referredBy = null;
  if (referredByDoc) {
    const referrerUser = await User.findById(referredByDoc.referrer_id, { name: 1, email: 1 });
    if (referrerUser) {
      referredBy = {
        name: referrerUser.name,
        code: referredByDoc.code_used || 'N/A',
        status: referredByDoc.status,
      };
    }
  }

  const auditLogs = await AuditLog.find({ userId }).sort({ createdAt: -1 });

  const loginHistory = auditLogs
    .filter(log => ['USER_LOGIN', 'login', 'login_failed'].includes(log.action))
    .map(log => ({
      id: log._id.toString(),
      action: log.action,
      ip: log.ipAddress || log.ip || log.meta?.ip || '127.0.0.1',
      user_agent: log.userAgent || log.meta?.user_agent || 'Unknown',
      created_at: log.createdAt || log.created_at,
    }));

  const activityLogs = auditLogs.map(log => ({
    id: log._id.toString(),
    action: log.action,
    description: log.description || log.meta?.description || log.action,
    ip: log.ipAddress || log.ip || '127.0.0.1',
    created_at: log.createdAt || log.created_at,
  }));

  const timeline = auditLogs
    .filter(log => [
      'USER_REGISTER',
      'USER_BAN',
      'USER_UNBAN',
      'USER_SUSPEND',
      'USER_DELETE',
      'ADMIN_ACTION'
    ].includes(log.action))
    .map(log => ({
      id: log._id.toString(),
      action: log.action,
      description: log.description || `Action ${log.action} performed`,
      created_at: log.createdAt || log.created_at,
    }));

  const total_spent = orders
    .filter(o => o.payment_status === 'paid' || o.status === 'completed')
    .reduce((sum, o) => sum + (o.price || 0), 0);

  const address = u.location ? {
    address: u.location.address || '',
    city: u.location.city || u.city || '',
    district: u.location.district || '',
    state: u.location.state || '',
    pincode: u.location.pincode || '',
  } : null;

  return {
    profile: {
      id: u._id.toString(),
      name: u.name || 'Unknown',
      email: u.email || '—',
      phone: u.phone || '—',
      profile_pic: u.profile_pic || u.avatarUrl || null,
      kyc_status: u.kyc_status || 'unverified',
      is_active: u.is_active !== false,
      is_banned: u.is_banned || false,
      created_at: u.created_at,
      lastLoginAt: u.lastLoginAt,
      lastLoginIp: u.lastLoginIp,
      referral_code: u.referral_code,
      address,
    },
    wallet: walletData,
    orders,
    payments,
    wishlist,
    reviews,
    notifications,
    inquiries,
    referrals: {
      list: referrals,
      referred_by: referredBy,
    },
    loginHistory,
    activityLogs,
    timeline,
    stats: {
      total_orders: orders.length,
      total_spent,
    }
  };
};

const getCustomerStats = async () => {
  const User = require('../models/User');
  const Order = require('../models/Order');
  const Deal = require('../models/Deal');

  const cacheKey = 'admin:customer:stats';
  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalCustomers,
    activeCustomers,
    newCustomersToday,
    newCustomersThisMonth,
    suspendedCustomers,
    blockedCustomers,
    verifiedCustomers
  ] = await Promise.all([
    User.countDocuments({ roles: 'customer', is_deleted: { $ne: true } }),
    User.countDocuments({ roles: 'customer', is_deleted: { $ne: true }, is_active: { $ne: false }, is_banned: { $ne: true } }),
    User.countDocuments({ roles: 'customer', is_deleted: { $ne: true }, created_at: { $gte: startOfToday } }),
    User.countDocuments({ roles: 'customer', is_deleted: { $ne: true }, created_at: { $gte: startOfMonth } }),
    User.countDocuments({ roles: 'customer', is_deleted: { $ne: true }, is_active: false, is_banned: { $ne: true } }),
    User.countDocuments({ roles: 'customer', is_deleted: { $ne: true }, is_banned: true }),
    User.countDocuments({ roles: 'customer', is_deleted: { $ne: true }, kyc_status: 'approved' })
  ]);

  const activeCustomerIds = await Order.distinct('customer', {
    status: { $in: ['pending', 'accepted', 'shipped'] }
  });
  const activeDealBuyerIds = await Deal.distinct('buyer_id', {
    status: { $in: ['negotiating', 'accepted'] }
  });

  const combinedActiveIds = Array.from(new Set([
    ...activeCustomerIds.map(id => id.toString()),
    ...activeDealBuyerIds.map(id => id.toString())
  ]));

  const customersWithActiveOrders = combinedActiveIds.length > 0
    ? await User.countDocuments({ _id: { $in: combinedActiveIds }, roles: 'customer', is_deleted: { $ne: true } })
    : 0;

  const orderGroups = await Order.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $group: { _id: '$customer', count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $count: 'total' }
  ]);
  const returningCount = orderGroups[0]?.total || 0;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  const [countLast30, countPrev30] = await Promise.all([
    User.countDocuments({ roles: 'customer', is_deleted: { $ne: true }, created_at: { $gte: thirtyDaysAgo } }),
    User.countDocuments({ roles: 'customer', is_deleted: { $ne: true }, created_at: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } })
  ]);

  const growthTrend = countPrev30 > 0
    ? Math.round(((countLast30 - countPrev30) / countPrev30) * 100)
    : (countLast30 > 0 ? 100 : 0);

  const result = {
    totalCustomers,
    activeCustomers,
    newCustomersToday,
    newCustomersThisMonth,
    suspendedCustomers,
    blockedCustomers,
    verifiedCustomers,
    customersWithActiveOrders,
    returningCustomers: returningCount,
    growthTrend
  };

  await setCache(cacheKey, result, 300); // cache for 5 minutes
  return result;
};

const activateUser = async (userId) => {
  return await flipUser(userId, { is_active: true, is_banned: false });
};

const verifyUser = async (userId) => {
  return await flipUser(userId, { kyc_status: 'approved' });
};

const resetUserPassword = async (userId, newPassword) => {
  const User = require('../models/User');
  const u = await User.findById(userId);
  if (!u) throw ApiError.notFound('User not found');
  if ((u.roles || []).includes('admin')) throw ApiError.forbidden('Cannot modify an admin account');

  u.password = newPassword;
  u.updated_at = new Date().toISOString();
  await u.save();

  try {
    const { emitToAdmin } = require('../sockets');
    emitToAdmin('admin:update', { tags: ['AdminUsers'] });
  } catch (err) {}

  return { ok: true, user_id: userId };
};

const listVendors = async ({
  q,
  status,
  kyc_status,
  has_listings,
  registered_from,
  registered_to,
  sort,
  page = 1,
  limit = 20
}) => {
  const User = require('../models/User');
  const mongoose = require('mongoose');

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
  const skipNum = (pageNum - 1) * limitNum;

  const matchStage = {
    is_deleted: { $ne: true },
    roles: 'vendor'
  };

  if (q) {
    const escaped = String(q).trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const _q = escaped.slice(0, 80);
    const orClauses = [
      { name: { $regex: _q, $options: 'i' } },
      { phone: { $regex: _q } },
      { email: { $regex: _q, $options: 'i' } },
      { 'vendorProfile.shopName': { $regex: _q, $options: 'i' } },
      { 'vendorProfile.businessName': { $regex: _q, $options: 'i' } }
    ];
    if (mongoose.Types.ObjectId.isValid(q)) {
      orClauses.push({ _id: new mongoose.Types.ObjectId(q) });
    }
    matchStage.$or = orClauses;
  }

  if (status) {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'active') {
      matchStage.is_banned = { $ne: true };
      matchStage.is_active = { $ne: false };
    } else if (lowerStatus === 'suspended') {
      matchStage.is_banned = { $ne: true };
      matchStage.is_active = false;
    } else if (lowerStatus === 'blocked') {
      matchStage.is_banned = true;
    }
  }

  if (kyc_status) {
    const lowerKyc = kyc_status.toLowerCase();
    if (lowerKyc === 'verified') {
      matchStage.kyc_status = 'approved';
    } else if (lowerKyc === 'unverified') {
      matchStage.kyc_status = { $ne: 'approved' };
    } else {
      matchStage.kyc_status = lowerKyc;
    }
  }

  if (registered_from || registered_to) {
    matchStage.created_at = {};
    if (registered_from) {
      const fromDate = new Date(registered_from);
      if (!isNaN(fromDate.getTime())) {
        matchStage.created_at.$gte = fromDate;
      }
    }
    if (registered_to) {
      const toDate = new Date(registered_to);
      if (!isNaN(toDate.getTime())) {
        matchStage.created_at.$lte = toDate;
      }
    }
  }

  const pipeline = [
    { $match: matchStage }
  ];

  // Lookup Wallet
  pipeline.push({
    $lookup: {
      from: 'wallets',
      localField: '_id',
      foreignField: 'user_id',
      as: 'wallet_doc'
    }
  });
  pipeline.push({
    $unwind: {
      path: '$wallet_doc',
      preserveNullAndEmptyArrays: true
    }
  });

  // Lookup Listings
  pipeline.push({
    $lookup: {
      from: 'listings',
      let: { vendorId: '$_id' },
      pipeline: [
        {
          $match: {
            $expr: { $eq: ['$vendor', '$$vendorId'] },
            is_deleted: { $ne: true }
          }
        }
      ],
      as: 'listings_docs'
    }
  });

  // Lookup Paid Orders
  pipeline.push({
    $lookup: {
      from: 'orders',
      let: { vendorId: '$_id' },
      pipeline: [
        {
          $match: {
            $expr: { $eq: ['$vendor', '$$vendorId'] },
            paymentStatus: 'paid'
          }
        }
      ],
      as: 'paid_orders'
    }
  });

  // Lookup Completed Deals
  pipeline.push({
    $lookup: {
      from: 'deals',
      let: { vendorIdStr: { $toString: '$_id' } },
      pipeline: [
        {
          $match: {
            $expr: { $eq: ['$seller_id', '$$vendorIdStr'] },
            status: 'completed'
          }
        }
      ],
      as: 'completed_deals'
    }
  });

  pipeline.push({
    $project: {
      id: '$_id',
      _id: 1,
      name: 1,
      email: 1,
      phone: 1,
      profile_pic: { $ifNull: ['$profile_pic', '$avatarUrl'] },
      is_active: 1,
      is_banned: 1,
      kyc_status: 1,
      created_at: 1,
      lastLoginAt: 1,
      lastLoginIp: 1,
      vendorProfile: 1,
      wallet: {
        credits: { $ifNull: ['$wallet_doc.credits', 0] },
        balance_inr_paise: { $ifNull: ['$wallet_doc.balance_inr_paise', 0] },
        is_frozen: { $ifNull: ['$wallet_doc.is_frozen', false] }
      },
      total_listings: { $size: { $ifNull: ['$listings_docs', []] } },
      active_listings: {
        $size: {
          $filter: {
            input: { $ifNull: ['$listings_docs', []] },
            as: 'item',
            cond: { $eq: ['$$item.status', 'active'] }
          }
        }
      },
      total_deals: {
        $add: [
          { $size: { $ifNull: ['$paid_orders', []] } },
          { $size: { $ifNull: ['$completed_deals', []] } }
        ]
      },
      total_sales: {
        $add: [
          { $sum: { $ifNull: ['$paid_orders.price', []] } },
          { $sum: { $ifNull: ['$completed_deals.current_offer', []] } }
        ]
      }
    }
  });

  if (has_listings !== undefined && has_listings !== null) {
    if (has_listings === 'true') {
      pipeline.push({ $match: { total_listings: { $gt: 0 } } });
    } else if (has_listings === 'false') {
      pipeline.push({ $match: { total_listings: 0 } });
    }
  }

  const sortStage = {};
  if (sort) {
    switch (sort) {
      case 'newest_first':
      case 'newest':
        sortStage.created_at = -1;
        break;
      case 'oldest_first':
      case 'oldest':
        sortStage.created_at = 1;
        break;
      case 'name_asc':
      case 'name_a_z':
        sortStage.name = 1;
        break;
      case 'name_desc':
      case 'name_z_a':
        sortStage.name = -1;
        break;
      case 'highest_sales':
      case 'sales_desc':
        sortStage.total_sales = -1;
        break;
      case 'most_listings':
      case 'listings_desc':
        sortStage.total_listings = -1;
        break;
      case 'last_login':
        sortStage.lastLoginAt = -1;
        break;
      default:
        sortStage.created_at = -1;
    }
  } else {
    sortStage.created_at = -1;
  }
  pipeline.push({ $sort: sortStage });

  pipeline.push({
    $facet: {
      metadata: [{ $count: 'total' }],
      data: [{ $skip: skipNum }, { $limit: limitNum }]
    }
  });

  const aggregateResult = await User.aggregate(pipeline);
  const data = aggregateResult[0]?.data || [];
  const total = aggregateResult[0]?.metadata[0]?.total || 0;

  return {
    items: data.map(u => ({
      ...u,
      id: u._id.toString()
    })),
    total,
    page: pageNum,
    limit: limitNum,
    pages: Math.ceil(total / limitNum)
  };
};

const getVendorProfileDetails = async (userId) => {
  const User = require('../models/User');
  const Listing = require('../models/Listing');
  const Order = require('../models/Order');
  const Deal = require('../models/Deal');
  const { Review, Wallet } = require('../models/Phase4');
  const { AuditLog } = require('../models/Misc');
  const Inquiry = require('../models/Inquiry');
  const ApiError = require('../utils/ApiError');

  const u = await User.findById(userId);
  if (!u || u.is_deleted) throw ApiError.notFound('Vendor not found');

  const userIdStr = userId.toString();

  // Wallet
  let walletData = { credits: 0, balance_inr_paise: 0, is_frozen: false };
  try {
    const w = await Wallet.findOne({ user_id: userIdStr });
    if (w) {
      walletData = {
        credits: w.credits,
        balance_inr_paise: w.balance_inr_paise,
        is_frozen: w.is_frozen,
      };
    }
  } catch (e) {}

  // Listings
  const listings = await Listing.find({ vendor: userId, is_deleted: { $ne: true } })
    .sort({ createdAt: -1 });

  // Sales History
  const rawOrders = await Order.find({ vendor: userId })
    .populate('customer', 'name phone email')
    .populate('listing', 'title images price')
    .sort({ createdAt: -1 });

  const rawDeals = await Deal.find({ seller_id: userIdStr, status: 'completed' })
    .sort({ updated_at: -1 });

  const sales = [
    ...rawOrders.map(o => ({
      id: o._id.toString(),
      type: 'product',
      customer_name: o.customer?.name || 'Customer',
      item_name: o.listing?.title || 'Product Order',
      quantity: o.quantity,
      price: o.price,
      status: o.status,
      payment_status: o.paymentStatus,
      created_at: o.createdAt,
    })),
    ...rawDeals.map(d => ({
      id: d._id.toString(),
      type: 'deal',
      customer_name: 'Customer',
      item_name: d.listing_id ? 'Negotiated Deal' : 'Service Deal',
      quantity: 1,
      price: d.final_amount || d.current_offer,
      status: d.status,
      payment_status: 'paid',
      created_at: d.created_at,
    }))
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Reviews received
  const listingIdsStr = listings.map(l => l._id.toString());
  const reviews = await Review.find({
    $or: [
      { target_type: 'vendor', target_id: userIdStr },
      { target_type: 'listing', target_id: { $in: listingIdsStr } }
    ]
  }).sort({ created_at: -1 });

  // Inquiries
  const inquiries = await Inquiry.find({ vendor: userId })
    .populate('customer', 'name phone')
    .populate('listing', 'title')
    .sort({ createdAt: -1 });

  // Logs & timeline
  const auditLogs = await AuditLog.find({ userId }).sort({ createdAt: -1 });

  const timeline = auditLogs
    .filter(log => [
      'USER_REGISTER',
      'USER_BAN',
      'USER_UNBAN',
      'USER_SUSPEND',
      'KYC_APPROVE',
      'KYC_REJECT',
      'ADMIN_ACTION'
    ].includes(log.action))
    .map(log => ({
      id: log._id.toString(),
      action: log.action,
      description: log.description || `Action ${log.action} performed`,
      created_at: log.createdAt || log.created_at,
    }));

  const loginHistory = auditLogs
    .filter(log => ['USER_LOGIN', 'login', 'login_failed'].includes(log.action))
    .map(log => ({
      id: log._id.toString(),
      action: log.action,
      ip: log.ipAddress || log.ip || '127.0.0.1',
      user_agent: log.userAgent || 'Unknown',
      created_at: log.createdAt || log.created_at,
    }));

  const activityLogs = auditLogs.map(log => ({
    id: log._id.toString(),
    action: log.action,
    description: log.description || log.meta?.description || log.action,
    ip: log.ipAddress || log.ip || '127.0.0.1',
    created_at: log.createdAt || log.created_at,
  }));

  const total_sales_volume = sales
    .filter(s => s.payment_status === 'paid' || s.status === 'completed')
    .reduce((sum, s) => sum + (s.price || 0), 0);

  const businessAddress = u.vendorProfile?.businessAddress || u.location?.address || '';

  return {
    profile: {
      id: u._id.toString(),
      name: u.name || 'Unknown',
      email: u.email || '—',
      phone: u.phone || '—',
      profile_pic: u.profile_pic || u.avatarUrl || null,
      kyc_status: u.kyc_status || 'unverified',
      is_active: u.is_active !== false,
      is_banned: u.is_banned || false,
      created_at: u.created_at,
      lastLoginAt: u.lastLoginAt,
      lastLoginIp: u.lastLoginIp,
      vendorProfile: u.vendorProfile,
      businessAddress,
    },
    wallet: walletData,
    listings: listings.map(l => ({
      id: l._id.toString(),
      title: l.title,
      price: l.price,
      category: l.category,
      status: l.status,
      created_at: l.createdAt
    })),
    sales,
    reviews: reviews.map(r => ({
      id: r._id.toString(),
      rating: r.rating,
      comment: r.comment,
      target_type: r.target_type,
      created_at: r.created_at
    })),
    inquiries: inquiries.map(inq => ({
      id: inq._id.toString(),
      message: inq.message,
      status: inq.status,
      customer: inq.customer ? { name: inq.customer.name, phone: inq.customer.phone } : null,
      listing: inq.listing ? { title: inq.listing.title } : null,
      created_at: inq.createdAt
    })),
    timeline,
    loginHistory,
    activityLogs,
    stats: {
      total_listings: listings.length,
      active_listings: listings.filter(l => l.status === 'active').length,
      total_sales_volume,
      completed_orders: sales.length,
    }
  };
};

const getVendorStats = async () => {
  const User = require('../models/User');
  const Listing = require('../models/Listing');
  const Order = require('../models/Order');
  const Deal = require('../models/Deal');

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalVendors,
    activeVendors,
    newVendorsToday,
    newVendorsThisMonth,
    suspendedVendors,
    blockedVendors,
    verifiedVendors,
    totalListings,
    activeListings
  ] = await Promise.all([
    User.countDocuments({ roles: 'vendor', is_deleted: { $ne: true } }),
    User.countDocuments({ roles: 'vendor', is_deleted: { $ne: true }, is_active: { $ne: false }, is_banned: { $ne: true } }),
    User.countDocuments({ roles: 'vendor', is_deleted: { $ne: true }, created_at: { $gte: startOfToday } }),
    User.countDocuments({ roles: 'vendor', is_deleted: { $ne: true }, created_at: { $gte: startOfMonth } }),
    User.countDocuments({ roles: 'vendor', is_deleted: { $ne: true }, is_active: false, is_banned: { $ne: true } }),
    User.countDocuments({ roles: 'vendor', is_deleted: { $ne: true }, is_banned: true }),
    User.countDocuments({ roles: 'vendor', is_deleted: { $ne: true }, kyc_status: 'approved' }),
    Listing.countDocuments({ is_deleted: { $ne: true } }),
    Listing.countDocuments({ is_deleted: { $ne: true }, status: 'active' })
  ]);

  // Total sales volume (INR) from all paid orders and completed deals
  const orderSalesAgg = await Order.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $group: { _id: null, total: { $sum: '$price' } } }
  ]);
  const dealSalesAgg = await Deal.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$final_amount' } } }
  ]);

  const totalSales = (orderSalesAgg[0]?.total || 0) + (dealSalesAgg[0]?.total || 0);

  // Vendor Growth Trend
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  const [countLast30, countPrev30] = await Promise.all([
    User.countDocuments({ roles: 'vendor', is_deleted: { $ne: true }, created_at: { $gte: thirtyDaysAgo } }),
    User.countDocuments({ roles: 'vendor', is_deleted: { $ne: true }, created_at: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } })
  ]);

  const growthTrend = countPrev30 > 0
    ? Math.round(((countLast30 - countPrev30) / countPrev30) * 100)
    : (countLast30 > 0 ? 100 : 0);

  return {
    totalVendors,
    activeVendors,
    newVendorsToday,
    newVendorsThisMonth,
    suspendedVendors,
    blockedVendors,
    verifiedVendors,
    totalListings,
    activeListings,
    totalSales,
    growthTrend
  };
};

// Exports moved to bottom of file


const listCreators = async ({
  q,
  status,
  kyc_status,
  has_reels,
  registered_from,
  registered_to,
  sort,
  page = 1,
  limit = 20
}) => {
  const User = require('../models/User');
  const mongoose = require('mongoose');

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
  const skipNum = (pageNum - 1) * limitNum;

  const matchStage = {
    is_deleted: { $ne: true },
    roles: 'creator'
  };

  if (q) {
    const escaped = String(q).trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const _q = escaped.slice(0, 80);
    const orClauses = [
      { name: { $regex: _q, $options: 'i' } },
      { phone: { $regex: _q } },
      { email: { $regex: _q, $options: 'i' } },
      { 'creatorProfile.bio': { $regex: _q, $options: 'i' } }
    ];
    if (mongoose.Types.ObjectId.isValid(q)) {
      orClauses.push({ _id: new mongoose.Types.ObjectId(q) });
    }
    matchStage.$or = orClauses;
  }

  if (status) {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'active') {
      matchStage.is_banned = { $ne: true };
      matchStage.is_active = { $ne: false };
    } else if (lowerStatus === 'suspended') {
      matchStage.is_banned = true;
    } else if (lowerStatus === 'inactive') {
      matchStage.is_banned = { $ne: true };
      matchStage.is_active = false;
    }
  }

  if (kyc_status) {
    const lowerKyc = kyc_status.toLowerCase();
    if (lowerKyc === 'verified') {
      matchStage.kyc_status = 'approved';
    } else if (lowerKyc === 'unverified') {
      matchStage.kyc_status = { $ne: 'approved' };
    } else {
      matchStage.kyc_status = lowerKyc;
    }
  }

  if (registered_from || registered_to) {
    matchStage.created_at = {};
    if (registered_from) {
      const fromDate = new Date(registered_from);
      if (!isNaN(fromDate.getTime())) {
        matchStage.created_at.$gte = fromDate;
      }
    }
    if (registered_to) {
      const toDate = new Date(registered_to);
      if (!isNaN(toDate.getTime())) {
        matchStage.created_at.$lte = toDate;
      }
    }
  }

  const pipeline = [
    { $match: matchStage }
  ];

  // Lookup Wallet
  pipeline.push({
    $lookup: {
      from: 'wallets',
      localField: '_id',
      foreignField: 'user_id',
      as: 'wallet_doc'
    }
  });
  pipeline.push({
    $unwind: {
      path: '$wallet_doc',
      preserveNullAndEmptyArrays: true
    }
  });

  // Lookup Reels
  pipeline.push({
    $lookup: {
      from: 'reels',
      let: { creatorId: '$_id' },
      pipeline: [
        {
          $match: {
            $expr: { $eq: ['$creator', '$$creatorId'] },
            is_deleted: { $ne: true }
          }
        }
      ],
      as: 'reels_docs'
    }
  });

  // Lookup HireRequests
  pipeline.push({
    $lookup: {
      from: 'hirerequests',
      let: { creatorId: '$_id' },
      pipeline: [
        {
          $match: {
            $expr: { $eq: ['$creator', '$$creatorId'] },
            status: 'completed',
            paymentStatus: 'paid'
          }
        }
      ],
      as: 'campaigns_docs'
    }
  });

  pipeline.push({
    $project: {
      id: '$_id',
      _id: 1,
      name: 1,
      email: 1,
      phone: 1,
      profile_pic: { $ifNull: ['$profile_pic', '$avatarUrl'] },
      is_active: 1,
      is_banned: 1,
      kyc_status: 1,
      created_at: 1,
      lastLoginAt: 1,
      lastLoginIp: 1,
      creatorProfile: 1,
      rating_avg: 1,
      trust_score: 1,
      wallet: {
        credits: { $ifNull: ['$wallet_doc.credits', 0] },
        balance_inr_paise: { $ifNull: ['$wallet_doc.balance_inr_paise', 0] },
        is_frozen: { $ifNull: ['$wallet_doc.is_frozen', false] }
      },
      total_reels: { $size: { $ifNull: ['$reels_docs', []] } },
      total_campaigns: { $size: { $ifNull: ['$campaigns_docs', []] } },
      total_earnings: { $sum: { $ifNull: ['$campaigns_docs.budget', []] } }
    }
  });

  if (has_reels !== undefined && has_reels !== null) {
    if (has_reels === 'true') {
      pipeline.push({ $match: { total_reels: { $gt: 0 } } });
    } else if (has_reels === 'false') {
      pipeline.push({ $match: { total_reels: 0 } });
    }
  }

  const sortStage = {};
  if (sort) {
    switch (sort) {
      case 'newest_first':
      case 'newest':
        sortStage.created_at = -1;
        break;
      case 'oldest_first':
      case 'oldest':
        sortStage.created_at = 1;
        break;
      case 'name_asc':
      case 'name_a_z':
        sortStage.name = 1;
        break;
      case 'name_desc':
      case 'name_z_a':
        sortStage.name = -1;
        break;
      case 'highest_earnings':
      case 'earnings_desc':
        sortStage.total_earnings = -1;
        break;
      case 'most_reels':
      case 'reels_desc':
        sortStage.total_reels = -1;
        break;
      case 'highest_rating':
        sortStage.rating_avg = -1;
        break;
      case 'last_login':
        sortStage.lastLoginAt = -1;
        break;
      default:
        sortStage.created_at = -1;
    }
  } else {
    sortStage.created_at = -1;
  }
  pipeline.push({ $sort: sortStage });

  pipeline.push({
    $facet: {
      metadata: [{ $count: 'total' }],
      data: [{ $skip: skipNum }, { $limit: limitNum }]
    }
  });

  const aggregateResult = await User.aggregate(pipeline);
  const data = aggregateResult[0]?.data || [];
  const total = aggregateResult[0]?.metadata[0]?.total || 0;

  return {
    items: data.map(u => ({
      ...u,
      id: u._id.toString()
    })),
    total,
    page: pageNum,
    limit: limitNum,
    pages: Math.ceil(total / limitNum)
  };
};

const getCreatorProfileDetails = async (userId) => {
  const User = require('../models/User');
  const Reel = require('../models/Reel');
  const HireRequest = require('../models/HireRequest');
  const { Review, Wallet } = require('../models/Phase4');
  const { AuditLog } = require('../models/Misc');
  const ApiError = require('../utils/ApiError');

  const u = await User.findById(userId);
  if (!u || u.is_deleted) throw ApiError.notFound('Creator not found');

  const userIdStr = userId.toString();

  // Wallet
  let walletData = { credits: 0, balance_inr_paise: 0, is_frozen: false };
  try {
    const w = await Wallet.findOne({ user_id: userIdStr });
    if (w) {
      walletData = {
        credits: w.credits,
        balance_inr_paise: w.balance_inr_paise,
        is_frozen: w.is_frozen,
      };
    }
  } catch (e) {}

  // Reels
  const reels = await Reel.find({ creator: userId, is_deleted: { $ne: true } })
    .sort({ createdAt: -1 });

  // Hire Requests
  const campaigns = await HireRequest.find({ creator: userId })
    .populate('vendor', 'name businessName phone email')
    .sort({ createdAt: -1 });

  // Reviews
  const reviews = await Review.find({ target_type: 'creator', target_id: userIdStr })
    .sort({ created_at: -1 });

  // Logs & timeline
  const auditLogs = await AuditLog.find({ userId }).sort({ createdAt: -1 });

  const timeline = auditLogs
    .filter(log => [
      'USER_REGISTER',
      'USER_BAN',
      'USER_UNBAN',
      'USER_SUSPEND',
      'KYC_APPROVE',
      'KYC_REJECT',
      'ADMIN_ACTION'
    ].includes(log.action))
    .map(log => ({
      id: log._id.toString(),
      action: log.action,
      description: log.description || `Action ${log.action} performed`,
      created_at: log.createdAt || log.created_at,
    }));

  const loginHistory = auditLogs
    .filter(log => ['USER_LOGIN', 'login', 'login_failed'].includes(log.action))
    .map(log => ({
      id: log._id.toString(),
      action: log.action,
      ip: log.ipAddress || log.ip || '127.0.0.1',
      user_agent: log.userAgent || 'Unknown',
      created_at: log.createdAt || log.created_at,
    }));

  const activityLogs = auditLogs.map(log => ({
    id: log._id.toString(),
    action: log.action,
    description: log.description || log.meta?.description || log.action,
    ip: log.ipAddress || log.ip || '127.0.0.1',
    created_at: log.createdAt || log.created_at,
  }));

  const total_earnings = campaigns
    .filter(c => c.status === 'completed' && c.paymentStatus === 'paid')
    .reduce((sum, c) => sum + (c.budget || 0), 0);

  return {
    profile: {
      id: u._id.toString(),
      name: u.name || 'Unknown',
      email: u.email || '—',
      phone: u.phone || '—',
      profile_pic: u.profile_pic || u.avatarUrl || null,
      kyc_status: u.kyc_status || 'unverified',
      is_active: u.is_active !== false,
      is_banned: u.is_banned || false,
      created_at: u.created_at,
      lastLoginAt: u.lastLoginAt,
      lastLoginIp: u.lastLoginIp,
      creatorProfile: u.creatorProfile,
      city: u.city || '',
    },
    wallet: walletData,
    reels: reels.map(r => ({
      id: r._id.toString(),
      videoUrl: r.videoUrl,
      thumbnailUrl: r.thumbnailUrl,
      caption: r.caption,
      views: r.viewsCount || 0,
      likes: r.likesCount || 0,
      created_at: r.createdAt
    })),
    campaigns: campaigns.map(c => ({
      id: c._id.toString(),
      title: c.title,
      description: c.description,
      budget: c.budget,
      status: c.status,
      payment_status: c.paymentStatus,
      vendor: c.vendor ? { name: c.vendor.name, businessName: c.vendor.businessName } : null,
      created_at: c.createdAt
    })),
    reviews: reviews.map(r => ({
      id: r._id.toString(),
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at
    })),
    timeline,
    loginHistory,
    activityLogs,
    stats: {
      total_reels: reels.length,
      total_earnings,
      completed_campaigns: campaigns.filter(c => c.status === 'completed').length,
    }
  };
};

const getCreatorStats = async () => {
  const User = require('../models/User');
  const Reel = require('../models/Reel');
  const HireRequest = require('../models/HireRequest');

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalCreators,
    activeCreators,
    newCreatorsToday,
    newCreatorsThisMonth,
    suspendedCreators,
    verifiedCreators,
    totalReels,
    totalCampaigns
  ] = await Promise.all([
    User.countDocuments({ roles: 'creator', is_deleted: { $ne: true } }),
    User.countDocuments({ roles: 'creator', is_deleted: { $ne: true }, is_active: { $ne: false }, is_banned: { $ne: true } }),
    User.countDocuments({ roles: 'creator', is_deleted: { $ne: true }, created_at: { $gte: startOfToday } }),
    User.countDocuments({ roles: 'creator', is_deleted: { $ne: true }, created_at: { $gte: startOfMonth } }),
    User.countDocuments({ roles: 'creator', is_deleted: { $ne: true }, is_banned: true }),
    User.countDocuments({ roles: 'creator', is_deleted: { $ne: true }, kyc_status: 'approved' }),
    Reel.countDocuments({ is_deleted: { $ne: true } }),
    HireRequest.countDocuments({ status: 'completed', paymentStatus: 'paid' })
  ]);

  const budgetAgg = await HireRequest.aggregate([
    { $match: { status: 'completed', paymentStatus: 'paid' } },
    { $group: { _id: null, total: { $sum: '$budget' } } }
  ]);
  const totalEarnings = budgetAgg[0]?.total || 0;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  const [countLast30, countPrev30] = await Promise.all([
    User.countDocuments({ roles: 'creator', is_deleted: { $ne: true }, created_at: { $gte: thirtyDaysAgo } }),
    User.countDocuments({ roles: 'creator', is_deleted: { $ne: true }, created_at: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } })
  ]);

  const growthTrend = countPrev30 > 0
    ? Math.round(((countLast30 - countPrev30) / countPrev30) * 100)
    : (countLast30 > 0 ? 100 : 0);

  return {
    totalCreators,
    activeCreators,
    newCreatorsToday,
    newCreatorsThisMonth,
    suspendedCreators,
    verifiedCreators,
    totalReels,
    totalCampaigns,
    totalEarnings,
    growthTrend
  };
};

const runInTransaction = async (operation) => {
  let session;
  try {
    session = await mongoose.startSession();
  } catch (e) {
    const logger = require('../utils/logger');
    logger.warn('Failed to start session. MongoDB might be running in standalone mode without replica set. Executing without transaction.');
    return await operation(null);
  }

  try {
    session.startTransaction();
    const result = await operation(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    const logger = require('../utils/logger');
    try {
      await session.abortTransaction();
    } catch (abortError) {
      logger.error('Failed to abort transaction:', abortError);
    }
    throw error;
  } finally {
    session.endSession();
  }
};

const extractPublicId = (url) => {
  if (!url || typeof url !== 'string') return null;
  if (!url.includes('cloudinary.com')) return null;
  try {
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;
    
    let startIndex = uploadIndex + 1;
    if (parts[startIndex].match(/^v\d+$/)) {
      startIndex += 1;
    }
    
    const publicIdWithExt = parts.slice(startIndex).join('/');
    const dotIndex = publicIdWithExt.lastIndexOf('.');
    if (dotIndex !== -1) {
      return publicIdWithExt.substring(0, dotIndex);
    }
    return publicIdWithExt;
  } catch (e) {
    return null;
  }
};

const deleteMediaFile = async (url) => {
  if (!url || typeof url !== 'string') return;
  const logger = require('../utils/logger');
  
  if (url.includes('cloudinary.com')) {
    const publicId = extractPublicId(url);
    if (publicId) {
      const isVideo = url.includes('/video/') || url.match(/\.(mp4|mov|avi|webm|mkv)$/i);
      const resourceType = isVideo ? 'video' : 'image';
      try {
        const cloudinaryService = require('./cloudinary.service');
        await cloudinaryService.destroy(publicId, resourceType);
      } catch (err) {
        logger.error(`Error deleting Cloudinary file ${publicId}:`, err);
      }
    }
    return;
  }
  
  if (url.startsWith('/api/uploads/') || url.startsWith('/uploads/')) {
    try {
      const relativePath = url.replace(/^\/api\//, '');
      const path = require('path');
      const absolutePath = path.resolve(__dirname, '..', '..', relativePath);
      const fs = require('fs').promises;
      await fs.unlink(absolutePath);
    } catch (err) {
      // Ignore if file doesn't exist
    }
  }
};

const recalculateUserRating = async (userId, session) => {
  const logger = require('../utils/logger');
  try {
    const Review = mongoose.model('Review');
    const User = mongoose.model('User');
    
    const userStats = await Review.aggregate([
      { $match: { targetUser: new mongoose.Types.ObjectId(userId), isDeleted: false } },
      {
        $group: {
          _id: '$targetUser',
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]).session(session);

    const targetUserDoc = await User.findById(userId).session(session);
    if (targetUserDoc) {
      const avgRating = userStats.length > 0 ? Math.round(userStats[0].avgRating * 10) / 10 : 0;
      const totalReviews = userStats.length > 0 ? userStats[0].totalReviews : 0;

      targetUserDoc.rating_avg = avgRating;
      targetUserDoc.rating_count = totalReviews;

      if (targetUserDoc.roles.includes('vendor') && targetUserDoc.vendorProfile) {
        targetUserDoc.vendorProfile.rating = avgRating;
        targetUserDoc.vendorProfile.totalReviews = totalReviews;
      }
      if (targetUserDoc.roles.includes('creator') && targetUserDoc.creatorProfile) {
        targetUserDoc.creatorProfile.rating = avgRating;
        targetUserDoc.creatorProfile.totalReviews = totalReviews;
      }
      targetUserDoc.markModified('vendorProfile');
      targetUserDoc.markModified('creatorProfile');
      await targetUserDoc.save({ session });
    }
  } catch (err) {
    logger.error(`Error recalculating user rating for ${userId}:`, err);
  }
};

const recalculateListingRating = async (listingId, session) => {
  const logger = require('../utils/logger');
  try {
    const Review = mongoose.model('Review');
    const Listing = mongoose.model('Listing');
    
    const listingStats = await Review.aggregate([
      { $match: { targetListing: new mongoose.Types.ObjectId(listingId), isDeleted: false } },
      {
        $group: {
          _id: '$targetListing',
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]).session(session);

    if (listingStats.length > 0) {
      await Listing.findByIdAndUpdate(listingId, {
        rating: Math.round(listingStats[0].avgRating * 10) / 10,
        totalReviews: listingStats[0].totalReviews,
      }, { session });
    } else {
      await Listing.findByIdAndUpdate(listingId, {
        rating: 0,
        totalReviews: 0,
      }, { session });
    }
  } catch (err) {
    logger.error(`Error recalculating listing rating for ${listingId}:`, err);
  }
};

const cleanBaseUserAccount = async (userId, mediaUrlsToDelete, session) => {
  const User = mongoose.model('User');
  const Wallet = mongoose.model('Wallet');
  const KycDocument = mongoose.model('KycDocument');
  const RefreshToken = mongoose.model('RefreshToken');
  const Follow = mongoose.model('Follow');
  const SearchHistory = mongoose.model('SearchHistory');
  const Notification = mongoose.model('Notification');

  // Delete Wallet
  await Wallet.deleteOne({ user_id: userId }).session(session);

  // Delete KYC Documents and extract their file URLs
  const kycDocs = await KycDocument.find({ user_id: userId }).session(session);
  for (const doc of kycDocs) {
    if (doc.doc_url) mediaUrlsToDelete.push(doc.doc_url);
    if (doc.selfie_url) mediaUrlsToDelete.push(doc.selfie_url);
  }
  await KycDocument.deleteMany({ user_id: userId }).session(session);

  // Delete RefreshTokens
  await RefreshToken.deleteMany({ userId: new mongoose.Types.ObjectId(userId) }).session(session);

  // Delete Follows and update count of followed/following users
  const followerDocs = await Follow.find({ follower_id: userId }).session(session);
  const followingDocs = await Follow.find({ following_id: userId }).session(session);

  await Follow.deleteMany({ $or: [{ follower_id: userId }, { following_id: userId }] }).session(session);

  // Pull from followers array and decrement followersCount for users this user followed
  for (const fd of followerDocs) {
    const followeeId = fd.following_id;
    await User.updateOne(
      { _id: followeeId },
      { 
        $pull: { followers: new mongoose.Types.ObjectId(userId) }, 
        $inc: { followersCount: -1 } 
      }
    ).session(session);
  }

  // Pull from following array and decrement followingCount for users that followed this user
  for (const fd of followingDocs) {
    const followerId = fd.follower_id;
    await User.updateOne(
      { _id: followerId },
      { 
        $pull: { following: new mongoose.Types.ObjectId(userId) }, 
        $inc: { followingCount: -1 } 
      }
    ).session(session);
  }

  // Delete SearchHistory, Notifications
  await SearchHistory.deleteMany({ user_id: userId }).session(session);
  await Notification.deleteMany({ recipient: { $in: [userId, new mongoose.Types.ObjectId(userId)] } }).session(session);

  // Delete base User document
  await User.deleteOne({ _id: userId }).session(session);
};

const deleteCustomer = async (userId) => {
  const mediaUrlsToDelete = [];

  const result = await runInTransaction(async (session) => {
    const User = mongoose.model('User');
    const user = await User.findById(userId).session(session);
    if (!user) throw ApiError.notFound('Customer not found');

    if (user.roles.includes('admin')) {
      throw ApiError.forbidden('Cannot modify or delete an admin account');
    }

    // 1. Requirement, Quote, Proposal
    const Requirement = mongoose.model('Requirement');
    const Quote = mongoose.model('Quote');
    const Proposal = mongoose.model('Proposal');

    const requirements = await Requirement.find({ 
      $or: [{ customer_id: userId }, { customer: new mongoose.Types.ObjectId(userId) }] 
    }).session(session);

    const requirementIds = requirements.map(r => r._id);
    const requirementIdStrs = requirements.map(r => r._id.toString());

    for (const req of requirements) {
      if (req.photos && Array.isArray(req.photos)) {
        for (const photo of req.photos) {
          const url = typeof photo === 'string' ? photo : photo?.url;
          if (url) mediaUrlsToDelete.push(url);
        }
      }
      if (req.video) {
        const url = typeof req.video === 'string' ? req.video : req.video?.url;
        if (url) mediaUrlsToDelete.push(url);
      }
    }

    // Quotes on requirements
    const quotes = await Quote.find({ requirement: { $in: requirementIds } }).session(session);
    for (const q of quotes) {
      if (q.attachments && Array.isArray(q.attachments)) {
        for (const att of q.attachments) {
          const url = typeof att === 'string' ? att : att?.url;
          if (url) mediaUrlsToDelete.push(url);
        }
      }
    }
    await Quote.deleteMany({ requirement: { $in: requirementIds } }).session(session);

    // Proposals on requirements
    const proposals = await Proposal.find({ requirement_id: { $in: requirementIdStrs } }).session(session);
    for (const p of proposals) {
      if (p.attachments && Array.isArray(p.attachments)) {
        for (const att of p.attachments) {
          const url = typeof att === 'string' ? att : att?.url;
          if (url) mediaUrlsToDelete.push(url);
        }
      }
    }
    await Proposal.deleteMany({ requirement_id: { $in: requirementIdStrs } }).session(session);
    await Requirement.deleteMany({ _id: { $in: requirementIds } }).session(session);

    // 2. Bookings & Orders
    const Order = mongoose.model('Order');
    const Deal = mongoose.model('Deal');
    await Order.deleteMany({ customer: new mongoose.Types.ObjectId(userId) }).session(session);
    await Deal.deleteMany({ buyer_id: userId }).session(session);

    // 3. Favorites / Saved Items
    const Interaction = mongoose.model('Interaction');
    await Interaction.deleteMany({ user_id: userId }).session(session);

    // 4. Reviews
    const Review = mongoose.model('Review');
    const customerReviews = await Review.find({ author: new mongoose.Types.ObjectId(userId) }).session(session);
    await Review.deleteMany({ author: new mongoose.Types.ObjectId(userId) }).session(session);

    for (const rev of customerReviews) {
      if (rev.targetUser) {
        await recalculateUserRating(rev.targetUser, session);
      }
      if (rev.targetListing) {
        await recalculateListingRating(rev.targetListing, session);
      }
    }

    // 5. Notifications
    const Notification = mongoose.model('Notification');
    await Notification.deleteMany({ recipient: { $in: [userId, new mongoose.Types.ObjectId(userId)] } }).session(session);

    // 6. Chats
    const ChatThread = mongoose.model('ChatThread');
    const ChatMessage = mongoose.model('ChatMessage');
    const threads = await ChatThread.find({ participants: userId }).session(session);
    const threadIds = threads.map(t => t._id.toString());

    const messages = await ChatMessage.find({ thread_id: { $in: threadIds } }).session(session);
    for (const msg of messages) {
      if (msg.media) {
        const url = typeof msg.media === 'string' ? msg.media : msg.media?.url;
        if (url) mediaUrlsToDelete.push(url);
      }
    }
    await ChatMessage.deleteMany({ thread_id: { $in: threadIds } }).session(session);
    await ChatThread.deleteMany({ participants: userId }).session(session);

    const Conversation = mongoose.model('Conversation');
    const Message = mongoose.model('Message');
    const conversations = await Conversation.find({ participants: new mongoose.Types.ObjectId(userId) }).session(session);
    const conversationIds = conversations.map(c => c._id);

    const conversationMessages = await Message.find({ conversation: { $in: conversationIds } }).session(session);
    for (const msg of conversationMessages) {
      if (msg.media && msg.media.url) {
        mediaUrlsToDelete.push(msg.media.url);
      }
    }
    await Message.deleteMany({ conversation: { $in: conversationIds } }).session(session);
    await Conversation.deleteMany({ participants: new mongoose.Types.ObjectId(userId) }).session(session);

    // 7. Transactions
    const WalletTransaction = mongoose.model('WalletTransaction');
    await WalletTransaction.deleteMany({ 
      user: new mongoose.Types.ObjectId(userId), 
      type: { $in: ['payment', 'refund'] } 
    }).session(session);

    // 8. Update User Roles
    user.roles = user.roles.filter(r => r !== 'customer');
    user.set('customerProfile', undefined);

    if (user.activeRole === 'customer' || user.current_role === 'customer') {
      user.activeRole = user.roles[0] || 'customer';
      user.current_role = user.roles[0] || 'customer';
    }

    if (user.roles.length === 0) {
      await cleanBaseUserAccount(userId, mediaUrlsToDelete, session);
      return { ok: true, userDeleted: true };
    } else {
      user.markModified('roles');
      user.markModified('customerProfile');
      await user.save({ session });
      return { ok: true, userDeleted: false };
    }
  });

  // Perform media deletes out of transaction session
  for (const url of mediaUrlsToDelete) {
    await deleteMediaFile(url);
  }

  // Socket update
  try {
    const { emitToAdmin, emitToUser } = require('../sockets');
    emitToAdmin('admin:update', { tags: ['AdminUsers', 'AdminOverview'] });
    if (result.userDeleted) {
      emitToUser(userId, 'user:deleted', {});
    } else {
      emitToUser(userId, 'user:role_deleted', { role: 'customer' });
    }
  } catch (err) {}

  await deleteCache('admin:customer:stats').catch(() => {});

  return result;
};

const deleteVendor = async (userId) => {
  const mediaUrlsToDelete = [];

  const result = await runInTransaction(async (session) => {
    const User = mongoose.model('User');
    const user = await User.findById(userId).session(session);
    if (!user) throw ApiError.notFound('Vendor not found');

    if (user.roles.includes('admin')) {
      throw ApiError.forbidden('Cannot modify or delete an admin account');
    }

    // 1. Listings
    const Listing = mongoose.model('Listing');
    const Interaction = mongoose.model('Interaction');
    const Review = mongoose.model('Review');

    const listings = await Listing.find({ vendor: new mongoose.Types.ObjectId(userId) }).session(session);
    const listingIds = listings.map(l => l._id);

    for (const lst of listings) {
      if (lst.images && Array.isArray(lst.images)) {
        for (const img of lst.images) {
          if (img) mediaUrlsToDelete.push(img);
        }
      }
      if (lst.videos && Array.isArray(lst.videos)) {
        for (const vid of lst.videos) {
          if (vid) mediaUrlsToDelete.push(vid);
        }
      }
      if (lst.variants && Array.isArray(lst.variants)) {
        for (const v of lst.variants) {
          if (v.image) mediaUrlsToDelete.push(v.image);
          if (v.imageUrl) mediaUrlsToDelete.push(v.imageUrl);
        }
      }
      if (lst.serviceDetails?.coverImage) {
        mediaUrlsToDelete.push(lst.serviceDetails.coverImage);
      }
      if (lst.serviceDetails?.galleryImages && Array.isArray(lst.serviceDetails.galleryImages)) {
        for (const img of lst.serviceDetails.galleryImages) {
          if (img) mediaUrlsToDelete.push(img);
        }
      }
    }

    await Interaction.deleteMany({ listing_id: { $in: listingIds.map(id => id.toString()) } }).session(session);
    await Review.deleteMany({ targetListing: { $in: listingIds } }).session(session);
    await Listing.deleteMany({ vendor: new mongoose.Types.ObjectId(userId) }).session(session);

    // 2. Analytics
    const ListingEvent = mongoose.model('ListingEvent');
    const ResponseEvent = mongoose.model('ResponseEvent');
    await ListingEvent.deleteMany({ 
      $or: [
        { vendor_id: userId }, 
        { listing_id: { $in: listingIds.map(id => id.toString()) } }
      ] 
    }).session(session);
    await ResponseEvent.deleteMany({ sender_id: userId }).session(session);

    // 3. Notifications
    const Notification = mongoose.model('Notification');
    await Notification.deleteMany({ recipient: { $in: [userId, new mongoose.Types.ObjectId(userId)] } }).session(session);

    // 4. Chats
    const ChatThread = mongoose.model('ChatThread');
    const ChatMessage = mongoose.model('ChatMessage');
    const threads = await ChatThread.find({ participants: userId }).session(session);
    const threadIds = threads.map(t => t._id.toString());

    const messages = await ChatMessage.find({ thread_id: { $in: threadIds } }).session(session);
    for (const msg of messages) {
      if (msg.media) {
        const url = typeof msg.media === 'string' ? msg.media : msg.media?.url;
        if (url) mediaUrlsToDelete.push(url);
      }
    }
    await ChatMessage.deleteMany({ thread_id: { $in: threadIds } }).session(session);
    await ChatThread.deleteMany({ participants: userId }).session(session);

    const Conversation = mongoose.model('Conversation');
    const Message = mongoose.model('Message');
    const conversations = await Conversation.find({ participants: new mongoose.Types.ObjectId(userId) }).session(session);
    const conversationIds = conversations.map(c => c._id);

    const conversationMessages = await Message.find({ conversation: { $in: conversationIds } }).session(session);
    for (const msg of conversationMessages) {
      if (msg.media && msg.media.url) {
        mediaUrlsToDelete.push(msg.media.url);
      }
    }
    await Message.deleteMany({ conversation: { $in: conversationIds } }).session(session);
    await Conversation.deleteMany({ participants: new mongoose.Types.ObjectId(userId) }).session(session);

    // 5. Reviews of/by vendor
    const vendorReviews = await Review.find({
      $or: [{ targetUser: new mongoose.Types.ObjectId(userId) }, { author: new mongoose.Types.ObjectId(userId) }]
    }).session(session);

    await Review.deleteMany({
      $or: [{ targetUser: new mongoose.Types.ObjectId(userId) }, { author: new mongoose.Types.ObjectId(userId) }]
    }).session(session);

    for (const rev of vendorReviews) {
      if (rev.targetUser && rev.targetUser.toString() !== userId) {
        await recalculateUserRating(rev.targetUser, session);
      }
      if (rev.targetListing) {
        await recalculateListingRating(rev.targetListing, session);
      }
    }

    // 6. Earnings & Payouts (WalletTransactions)
    const WalletTransaction = mongoose.model('WalletTransaction');
    if (user.roles.includes('creator')) {
      await WalletTransaction.deleteMany({
        user: new mongoose.Types.ObjectId(userId),
        type: { $in: ['deposit', 'withdrawal'] },
        ref_type: { $in: ['order', 'deal', 'listing'] }
      }).session(session);
    } else {
      await WalletTransaction.deleteMany({
        user: new mongoose.Types.ObjectId(userId),
        type: { $in: ['deposit', 'withdrawal'] }
      }).session(session);
    }

    // 7. Campaigns & Job Proposals
    const Campaign = mongoose.model('Campaign');
    const HireRequest = mongoose.model('HireRequest');
    const Quote = mongoose.model('Quote');
    const Proposal = mongoose.model('Proposal');

    const vendorCampaigns = await Campaign.find({ vendor: new mongoose.Types.ObjectId(userId) }).session(session);
    for (const camp of vendorCampaigns) {
      if (camp.attachments && Array.isArray(camp.attachments)) {
        for (const att of camp.attachments) {
          if (att) mediaUrlsToDelete.push(att);
        }
      }
      if (camp.submissionUrls && Array.isArray(camp.submissionUrls)) {
        for (const sub of camp.submissionUrls) {
          if (sub.url) mediaUrlsToDelete.push(sub.url);
        }
      }
    }
    await Campaign.deleteMany({ vendor: new mongoose.Types.ObjectId(userId) }).session(session);
    await HireRequest.deleteMany({ vendor: new mongoose.Types.ObjectId(userId) }).session(session);

    const vendorQuotes = await Quote.find({ vendor: new mongoose.Types.ObjectId(userId) }).session(session);
    for (const q of vendorQuotes) {
      if (q.attachments && Array.isArray(q.attachments)) {
        for (const att of q.attachments) {
          const url = typeof att === 'string' ? att : att?.url;
          if (url) mediaUrlsToDelete.push(url);
        }
      }
    }
    await Quote.deleteMany({ vendor: new mongoose.Types.ObjectId(userId) }).session(session);

    const vendorProposals = await Proposal.find({ vendor_id: userId }).session(session);
    for (const p of vendorProposals) {
      if (p.attachments && Array.isArray(p.attachments)) {
        for (const att of p.attachments) {
          const url = typeof att === 'string' ? att : att?.url;
          if (url) mediaUrlsToDelete.push(url);
        }
      }
    }
    await Proposal.deleteMany({ vendor_id: userId }).session(session);

    // 8. Update User Roles
    user.roles = user.roles.filter(r => r !== 'vendor');
    user.vendorProfile = null;

    if (user.activeRole === 'vendor' || user.current_role === 'vendor') {
      user.activeRole = user.roles[0] || 'customer';
      user.current_role = user.roles[0] || 'customer';
    }

    if (user.roles.length === 0) {
      await cleanBaseUserAccount(userId, mediaUrlsToDelete, session);
      return { ok: true, userDeleted: true };
    } else {
      user.markModified('roles');
      user.markModified('vendorProfile');
      await user.save({ session });
      return { ok: true, userDeleted: false };
    }
  });

  // Perform media deletes out of transaction session
  for (const url of mediaUrlsToDelete) {
    await deleteMediaFile(url);
  }

  // Socket update
  try {
    const { emitToAdmin, emitToUser } = require('../sockets');
    emitToAdmin('admin:update', { tags: ['AdminUsers', 'AdminOverview'] });
    if (result.userDeleted) {
      emitToUser(userId, 'user:deleted', {});
    } else {
      emitToUser(userId, 'user:role_deleted', { role: 'vendor' });
    }
  } catch (err) {}

  return result;
};

const deleteCreator = async (userId) => {
  const mediaUrlsToDelete = [];

  const result = await runInTransaction(async (session) => {
    const User = mongoose.model('User');
    const user = await User.findById(userId).session(session);
    if (!user) throw ApiError.notFound('Creator not found');

    if (user.roles.includes('admin')) {
      throw ApiError.forbidden('Cannot modify or delete an admin account');
    }

    // 1. Reels, Likes, Comments
    const Reel = mongoose.model('Reel');
    const ReelLike = mongoose.model('ReelLike');
    const Comment = mongoose.model('Comment');

    const reels = await Reel.find({ creator: new mongoose.Types.ObjectId(userId) }).session(session);
    const reelIds = reels.map(r => r._id);

    for (const r of reels) {
      if (r.videoUrl) mediaUrlsToDelete.push(r.videoUrl);
      if (r.thumbnailUrl) mediaUrlsToDelete.push(r.thumbnailUrl);
      if (r.mediaUrls && Array.isArray(r.mediaUrls)) {
        for (const url of r.mediaUrls) {
          if (url) mediaUrlsToDelete.push(url);
        }
      }
    }

    await ReelLike.deleteMany({ $or: [{ userId: new mongoose.Types.ObjectId(userId) }, { reelId: { $in: reelIds } }] }).session(session);
    await Comment.deleteMany({ $or: [{ userId: new mongoose.Types.ObjectId(userId) }, { reelId: { $in: reelIds } }] }).session(session);
    await Reel.deleteMany({ creator: new mongoose.Types.ObjectId(userId) }).session(session);

    // 2. Portfolio Listings
    const Listing = mongoose.model('Listing');
    const portfolioListings = await Listing.find({ 
      vendor: new mongoose.Types.ObjectId(userId), 
      category: 'Portfolio' 
    }).session(session);

    const portListingIds = portfolioListings.map(l => l._id);

    for (const lst of portfolioListings) {
      if (lst.images && Array.isArray(lst.images)) {
        for (const img of lst.images) {
          if (img) mediaUrlsToDelete.push(img);
        }
      }
      if (lst.videos && Array.isArray(lst.videos)) {
        for (const vid of lst.videos) {
          if (vid) mediaUrlsToDelete.push(vid);
        }
      }
    }
    await Listing.deleteMany({ _id: { $in: portListingIds } }).session(session);

    // 3. Campaigns & Job Proposals
    const Campaign = mongoose.model('Campaign');
    const HireRequest = mongoose.model('HireRequest');

    const creatorCampaigns = await Campaign.find({ creator: new mongoose.Types.ObjectId(userId) }).session(session);
    for (const camp of creatorCampaigns) {
      if (camp.attachments && Array.isArray(camp.attachments)) {
        for (const att of camp.attachments) {
          if (att) mediaUrlsToDelete.push(att);
        }
      }
      if (camp.submissionUrls && Array.isArray(camp.submissionUrls)) {
        for (const sub of camp.submissionUrls) {
          if (sub.url) mediaUrlsToDelete.push(sub.url);
        }
      }
    }
    await Campaign.deleteMany({ creator: new mongoose.Types.ObjectId(userId) }).session(session);
    await HireRequest.deleteMany({ creator: new mongoose.Types.ObjectId(userId) }).session(session);

    // 4. Notifications
    const Notification = mongoose.model('Notification');
    await Notification.deleteMany({ recipient: { $in: [userId, new mongoose.Types.ObjectId(userId)] } }).session(session);

    // 5. Chats
    const ChatThread = mongoose.model('ChatThread');
    const ChatMessage = mongoose.model('ChatMessage');
    const threads = await ChatThread.find({ participants: userId }).session(session);
    const threadIds = threads.map(t => t._id.toString());

    const messages = await ChatMessage.find({ thread_id: { $in: threadIds } }).session(session);
    for (const msg of messages) {
      if (msg.media) {
        const url = typeof msg.media === 'string' ? msg.media : msg.media?.url;
        if (url) mediaUrlsToDelete.push(url);
      }
    }
    await ChatMessage.deleteMany({ thread_id: { $in: threadIds } }).session(session);
    await ChatThread.deleteMany({ participants: userId }).session(session);

    const Conversation = mongoose.model('Conversation');
    const Message = mongoose.model('Message');
    const conversations = await Conversation.find({ participants: new mongoose.Types.ObjectId(userId) }).session(session);
    const conversationIds = conversations.map(c => c._id);

    const conversationMessages = await Message.find({ conversation: { $in: conversationIds } }).session(session);
    for (const msg of conversationMessages) {
      if (msg.media && msg.media.url) {
        mediaUrlsToDelete.push(msg.media.url);
      }
    }
    await Message.deleteMany({ conversation: { $in: conversationIds } }).session(session);
    await Conversation.deleteMany({ participants: new mongoose.Types.ObjectId(userId) }).session(session);

    // 6. Earnings (WalletTransactions)
    const WalletTransaction = mongoose.model('WalletTransaction');
    if (user.roles.includes('vendor')) {
      await WalletTransaction.deleteMany({
        user: new mongoose.Types.ObjectId(userId),
        type: { $in: ['deposit', 'withdrawal'] },
        $or: [
          { ref_type: { $in: ['campaign', 'hire', 'proposal'] } },
          { description: { $regex: /(campaign|creator|hire|collaboration)/i } }
        ]
      }).session(session);
    } else {
      await WalletTransaction.deleteMany({
        user: new mongoose.Types.ObjectId(userId),
        type: { $in: ['deposit', 'withdrawal'] }
      }).session(session);
    }

    // 7. Update User Roles
    user.roles = user.roles.filter(r => r !== 'creator');
    user.creatorProfile = null;

    if (user.activeRole === 'creator' || user.current_role === 'creator') {
      user.activeRole = user.roles[0] || 'customer';
      user.current_role = user.roles[0] || 'customer';
    }

    if (user.roles.length === 0) {
      await cleanBaseUserAccount(userId, mediaUrlsToDelete, session);
      return { ok: true, userDeleted: true };
    } else {
      user.markModified('roles');
      user.markModified('creatorProfile');
      await user.save({ session });
      return { ok: true, userDeleted: false };
    }
  });

  // Perform media deletes out of transaction session
  for (const url of mediaUrlsToDelete) {
    await deleteMediaFile(url);
  }

  // Socket update
  try {
    const { emitToAdmin, emitToUser } = require('../sockets');
    emitToAdmin('admin:update', { tags: ['AdminUsers', 'AdminOverview'] });
    if (result.userDeleted) {
      emitToUser(userId, 'user:deleted', {});
    } else {
      emitToUser(userId, 'user:role_deleted', { role: 'creator' });
    }
  } catch (err) {}

  return result;
};

module.exports = {
  listUsers,
  banUser,
  unbanUser,
  freezeWallet,
  unfreezeWallet,
  addRole,
  removeRole,
  listListings: listListingsAdmin,
  listListingsAdmin,
  takedownListing,
  restoreListing,
  analyticsOverview,
  purgeTestData,
  getUserDetail,
  updateUser,
  suspendUser,
  deleteUser,
  getLoginHistory,
  listCustomers,
  getCustomerProfileDetails,
  getCustomerStats,
  activateUser,
  verifyUser,
  resetUserPassword,
  listVendors,
  getVendorProfileDetails,
  getVendorStats,
  listCreators,
  getCreatorProfileDetails,
  getCreatorStats,
  deleteCustomer,
  deleteVendor,
  deleteCreator,
  clearOverviewCache,
};

