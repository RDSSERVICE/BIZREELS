const mongoose = require('mongoose');
const User = require('../models/User');
const Listing = require('../models/Listing');
const Deal = require('../models/Deal');
const { KycDocument, Wallet } = require('../models/Phase4');
const { AuditLog } = require('../models/Misc');
const reportService = require('./report.service');
const walletService = require('./wallet.service');
const ApiError = require('../utils/ApiError');

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

const analyticsOverview = async () => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const yesterdayStart = new Date(new Date(todayStart).getTime() - 24 * 60 * 60 * 1000).toISOString();

  // Lazy-load models that may not always be available
  let Reel, Subscription, Payment, Order;
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
  ] = await Promise.all([
    User.countDocuments({ is_deleted: { $ne: true } }),
    User.countDocuments({ roles: 'customer', is_deleted: { $ne: true } }),
    User.countDocuments({ roles: 'vendor', is_deleted: { $ne: true } }),
    User.countDocuments({ roles: 'creator', is_deleted: { $ne: true } }),
    Listing.countDocuments({ is_deleted: { $ne: true } }),
    Listing.countDocuments({ is_deleted: { $ne: true }, status: 'active' }),
    Deal.countDocuments({}),
    Deal.countDocuments({ status: 'completed' }),
    KycDocument.countDocuments({ status: 'pending', is_deleted: { $ne: true } }),
    Deal.countDocuments({ is_deleted: { $ne: true } }),
  ]);

  const openReportsCount = await reportService.openCount();

  // Active users last 7 days (distinct users from AuditLog)
  const activeUsersLast7dAgg = await AuditLog.aggregate([
    {
      $match: {
        $or: [
          { createdAt: { $gte: new Date(sevenDaysAgo) } },
          { created_at: { $gte: sevenDaysAgo } }
        ]
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
  ]);
  const activeUsersLast7d = activeUsersLast7dAgg[0]?.count || 0;

  // Active users previous 7 days (distinct users from AuditLog)
  const activeUsersPrev7dAgg = await AuditLog.aggregate([
    {
      $match: {
        $or: [
          {
            $and: [
              { createdAt: { $gte: new Date(fourteenDaysAgo) } },
              { createdAt: { $lt: new Date(sevenDaysAgo) } }
            ]
          },
          {
            $and: [
              { created_at: { $gte: fourteenDaysAgo } },
              { created_at: { $lt: sevenDaysAgo } }
            ]
          }
        ]
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
  ]);
  const activeUsersPrev7d = activeUsersPrev7dAgg[0]?.count || 0;

  // Today's upload counters
  const todaysListings = await Listing.countDocuments({
    createdAt: { $gte: new Date(todayStart) },
    is_deleted: { $ne: true }
  }).catch(() => 0);

  const yesterdaysListings = await Listing.countDocuments({
    createdAt: { $gte: new Date(yesterdayStart), $lt: new Date(todayStart) },
    is_deleted: { $ne: true }
  }).catch(() => 0);

  let totalReels = 0;
  let todaysReels = 0;
  let yesterdaysReels = 0;
  let activeBoosts = 0;

  if (Reel) {
    totalReels = await Reel.countDocuments({ isDeleted: { $ne: true } }).setOptions({ includeSoftDeleted: true }).catch(() => 0) || await Reel.countDocuments({}).catch(() => 0);
    todaysReels = await Reel.countDocuments({ createdAt: { $gte: new Date(todayStart) }, isDeleted: { $ne: true } }).catch(() => 0);
    yesterdaysReels = await Reel.countDocuments({ createdAt: { $gte: new Date(yesterdayStart), $lt: new Date(todayStart) }, isDeleted: { $ne: true } }).catch(() => 0);
    activeBoosts = await Reel.countDocuments({ isBoosted: true, isDeleted: { $ne: true } }).setOptions({ includeSoftDeleted: true }).catch(() => 0) || 0;
  }

  // Active boosts from listings + reels
  const listingBoosts = await Listing.countDocuments({ isBoosted: true, isDeleted: { $ne: true } }).setOptions({ includeSoftDeleted: true }).catch(() => 0) || 0;
  activeBoosts += listingBoosts;

  // Today's deals
  const todaysDeals = await Deal.countDocuments({
    created_at: { $gte: todayStart }
  }).catch(() => 0);

  const yesterdaysDeals = await Deal.countDocuments({
    created_at: { $gte: yesterdayStart, $lt: todayStart }
  }).catch(() => 0);

  // GMV / Revenue
  // Deals GMV (Completed)
  const gmvRes = await Deal.aggregate([
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
  ]);
  const dealGmvPaise = Math.round((gmvRes.length > 0 ? gmvRes[0].gmv : 0) * 100);

  // Orders GMV (Paid)
  let orderGmvPaise = 0;
  if (Order) {
    const orderGmvRes = await Order.aggregate([
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
    ]);
    orderGmvPaise = Math.round((orderGmvRes.length > 0 ? orderGmvRes[0].gmv : 0) * 100);
  }

  const totalGmvPaise = dealGmvPaise + orderGmvPaise;

  // Wallet balance (sum all wallet credits)
  let totalWalletBalance = 0;
  try {
    const walletAgg = await Wallet.aggregate([
      { $group: { _id: null, total_inr: { $sum: '$balance_inr_paise' } } }
    ]);
    totalWalletBalance = walletAgg.length > 0 ? (walletAgg[0].total_inr || 0) : 0;
  } catch (e) { /* ignore */ }

  // Subscription revenue
  let subscriptionRevenue = 0;
  if (Payment) {
    try {
      const subRevenueRes = await Payment.aggregate([
        { $match: { status: 'captured', purpose: { $regex: /^verified_badge/ } } },
        { $group: { _id: null, total: { $sum: '$amount_paise' } } }
      ]);
      subscriptionRevenue = subRevenueRes.length > 0 ? subRevenueRes[0].total : 0;
    } catch (e) { /* ignore */ }
  }

  // Boost revenue
  let boostRevenuePaise = 0;
  if (Payment) {
    try {
      const boostRevenueRes = await Payment.aggregate([
        { $match: { status: 'captured', purpose: 'listing_boost' } },
        { $group: { _id: null, total: { $sum: '$amount_paise' } } }
      ]);
      boostRevenuePaise = boostRevenueRes.length > 0 ? boostRevenueRes[0].total : 0;
    } catch (e) { /* ignore */ }
  }

  // Dynamic Top Performers & Analytics
  // Top Vendors: Aggregate sales and deal counts from completed Deals
  const topVendorsAgg = await Deal.aggregate([
    { $match: { status: 'completed' } },
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
  ]);

  const topVendorIds = topVendorsAgg.map(v => v._id);
  const vendorUsers = await User.find({ _id: { $in: topVendorIds }, is_deleted: { $ne: true } });
  const vendorUserMap = {};
  vendorUsers.forEach(u => {
    vendorUserMap[u._id.toString()] = u;
  });

  let topVendors = topVendorsAgg.map(item => {
    const user = vendorUserMap[item._id];
    return {
      name: user?.name || 'Vendor',
      sales: `₹${(item.salesSum || 0).toLocaleString('en-IN')}`,
      orders: item.ordersCount || 0,
      rating: user?.rating_avg || 0,
    };
  });

  if (topVendors.length < 5) {
    const remainingVendors = await User.find({
      roles: 'vendor',
      _id: { $not: { $in: topVendorIds } },
      is_deleted: { $ne: true }
    })
      .sort({ rating_avg: -1, created_at: -1 })
      .limit(5 - topVendors.length);

    remainingVendors.forEach(v => {
      topVendors.push({
        name: v.name || 'Vendor',
        sales: '₹0',
        orders: 0,
        rating: v.rating_avg || 0,
      });
    });
  }

  // Top Creators: Aggregate views and reel counts from Reels
  let topCreators = [];
  let topCreatorIds = [];
  if (Reel) {
    const topCreatorsAgg = await Reel.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      {
        $group: {
          _id: '$creator',
          viewsSum: { $sum: '$views' },
          reelsCount: { $sum: 1 },
        },
      },
      { $sort: { viewsSum: -1 } },
      { $limit: 5 }
    ]);

    topCreatorIds = topCreatorsAgg.map(c => c._id);
    const creatorUsers = await User.find({ _id: { $in: topCreatorIds }, is_deleted: { $ne: true } });
    const creatorUserMap = {};
    creatorUsers.forEach(u => {
      creatorUserMap[u._id.toString()] = u;
    });

    topCreators = topCreatorsAgg.map(item => {
      const user = creatorUserMap[item._id.toString()];
      return {
        name: user?.name || 'Creator',
        views: item.viewsSum >= 1000 ? `${(item.viewsSum / 1000).toFixed(1)}K` : `${item.viewsSum}`,
        reels: item.reelsCount || 0,
        rating: user?.rating_avg || 0,
      };
    });
  }

  if (topCreators.length < 5) {
    const remainingCreators = await User.find({
      roles: 'creator',
      _id: { $nin: topCreatorIds },
      is_deleted: { $ne: true }
    })
      .sort({ rating_avg: -1, created_at: -1 })
      .limit(5 - topCreators.length);

    remainingCreators.forEach(c => {
      topCreators.push({
        name: c.name || 'Creator',
        views: '0',
        reels: 0,
        rating: c.rating_avg || 0,
      });
    });
  }

  // Top Categories
  const topCategoriesAgg = await Listing.aggregate([
    { $match: { is_deleted: { $ne: true } } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);
  const totalListingsCount = totalListings || 1;
  const topCategories = topCategoriesAgg.map(cat => ({
    name: cat._id || 'General',
    share: `${Math.round((cat.count / totalListingsCount) * 100)}%`,
    listings: cat.count,
  }));

  // Top Cities
  const topCitiesAgg = await User.aggregate([
    { $match: { is_deleted: { $ne: true }, city: { $ne: null } } },
    { $group: { _id: '$city', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);
  const totalUsersCount = totalUsers || 1;
  const topCities = topCitiesAgg.map(city => ({
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

  return {
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
  return await flipUser(userId, { is_deleted: true, is_active: false });
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

  const pipeline = [
    { $match: matchStage }
  ];

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

  pipeline.push({
    $lookup: {
      from: 'orders',
      let: { customerId: '$_id' },
      pipeline: [
        {
          $match: {
            $expr: { $eq: ['$customer', '$$customerId'] },
            paymentStatus: 'paid'
          }
        }
      ],
      as: 'paid_orders'
    }
  });

  pipeline.push({
    $lookup: {
      from: 'deals',
      let: { customerIdStr: { $toString: '$_id' } },
      pipeline: [
        {
          $match: {
            $expr: { $eq: ['$buyer_id', '$$customerIdStr'] },
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
      referral_code: 1,
      created_at: 1,
      lastLoginAt: 1,
      lastLoginIp: 1,
      wallet: {
        credits: { $ifNull: ['$wallet_doc.credits', 0] },
        balance_inr_paise: { $ifNull: ['$wallet_doc.balance_inr_paise', 0] },
        is_frozen: { $ifNull: ['$wallet_doc.is_frozen', false] }
      },
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
  });

  if (has_orders !== undefined && has_orders !== null) {
    if (has_orders === 'true') {
      pipeline.push({ $match: { total_orders: { $gt: 0 } } });
    } else if (has_orders === 'false') {
      pipeline.push({ $match: { total_orders: 0 } });
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

  const auditLogs = await AuditLog.find({
    $or: [{ userId: userId }, { user_id: userIdStr }]
  }).sort({ createdAt: -1, created_at: -1 });

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
    { $match: { count: { $gt: 1 } } }
  ]);
  const returningCount = orderGroups.length;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  const [countLast30, countPrev30] = await Promise.all([
    User.countDocuments({ roles: 'customer', is_deleted: { $ne: true }, created_at: { $gte: thirtyDaysAgo } }),
    User.countDocuments({ roles: 'customer', is_deleted: { $ne: true }, created_at: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } })
  ]);

  const growthTrend = countPrev30 > 0
    ? Math.round(((countLast30 - countPrev30) / countPrev30) * 100)
    : (countLast30 > 0 ? 100 : 0);

  return {
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
  const auditLogs = await AuditLog.find({
    $or: [{ userId: userId }, { user_id: userIdStr }]
  }).sort({ createdAt: -1, created_at: -1 });

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
  const auditLogs = await AuditLog.find({
    $or: [{ userId: userId }, { user_id: userIdStr }]
  }).sort({ createdAt: -1, created_at: -1 });

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
};

