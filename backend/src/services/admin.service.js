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
  return { ok: true, user_id: userId };
};

const unfreezeWallet = async (userId) => {
  await Wallet.updateOne({ user_id: userId }, { $set: { is_frozen: false, updated_at: new Date().toISOString() } });
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
  return { ok: true, listing_id: listingId };
};

const analyticsOverview = async () => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  // Lazy-load models that may not always be available
  let Reel, Subscription;
  try { Reel = require('../models/Reel'); } catch (e) { Reel = null; }
  try { ({ Subscription } = require('../models/Phase4')); } catch (e) { Subscription = null; }

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

  // Active users last 7 days
  const activeUsersLast7d = await AuditLog.countDocuments({
    action: 'login',
    created_at: { $gte: sevenDaysAgo },
  });

  // Total reels
  let totalReels = 0;
  let todaysUploads = 0;
  let activeBoosts = 0;
  if (Reel) {
    totalReels = await Reel.countDocuments({ isDeleted: { $ne: true } }).setOptions({ includeSoftDeleted: true }).catch(() => 0) || await Reel.countDocuments({}).catch(() => 0);
    todaysUploads = await Reel.countDocuments({ createdAt: { $gte: new Date(todayStart) } }).catch(() => 0);
    activeBoosts = await Reel.countDocuments({ isBoosted: true, isDeleted: { $ne: true } }).setOptions({ includeSoftDeleted: true }).catch(() => 0) || 0;
  }
  // Add listing boosts to active boosts
  const listingBoosts = await Listing.countDocuments({ isBoosted: true, isDeleted: { $ne: true } }).setOptions({ includeSoftDeleted: true }).catch(() => 0) || 0;
  activeBoosts += listingBoosts;

  // Today's listing uploads
  const todaysListings = await Listing.countDocuments({ createdAt: { $gte: new Date(todayStart) } }).setOptions({ includeSoftDeleted: true }).catch(() => 0) || 0;
  todaysUploads += todaysListings;

  // GMV / Revenue
  const gmvPipeline = [
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
  ];
  const gmvRes = await Deal.aggregate(gmvPipeline);
  const totalGmvPaise = Math.round((gmvRes.length > 0 ? gmvRes[0].gmv : 0) * 100);

  // Wallet balance (sum all wallet credits)
  let totalWalletBalance = 0;
  try {
    const walletAgg = await Wallet.aggregate([
      { $group: { _id: null, total: { $sum: '$credits' }, total_inr: { $sum: '$balance_inr_paise' } } }
    ]);
    totalWalletBalance = walletAgg.length > 0 ? (walletAgg[0].total_inr || 0) : 0;
  } catch (e) { /* Wallet not yet populated */ }

  // Subscription revenue
  let subscriptionRevenue = 0;
  if (Subscription) {
    try {
      const activeSubs = await Subscription.countDocuments({ status: 'active' });
      subscriptionRevenue = activeSubs * 29900; // Assume avg ₹299 plan in paise
    } catch (e) { /* ignore */ }
  }

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
    active_users_last_7d: activeUsersLast7d,
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
};

