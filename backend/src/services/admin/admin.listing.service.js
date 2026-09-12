const mongoose = require('mongoose');
const Listing = require('../../models/Listing');
const User = require('../../models/User');
const AuditLog = require('../../models/AuditLog');
const ApiError = require('../../utils/ApiError');
const { emitToAdmin } = require('../../sockets');

/**
 * High-Performance Aggregated Platform Listing Telemetry (KPIs)
 */
const getAdminListingStats = async () => {
  const [countsAgg, valuationAgg] = await Promise.all([
    Listing.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      {
        $group: {
          _id: null,
          totalListings: { $sum: 1 },
          publishedCount: {
            $sum: { $cond: [{ $in: ['$status', ['published', 'active']] }, 1, 0] }
          },
          draftCount: {
            $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
          },
          flaggedCount: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ['$is_takendown', true] },
                    { $eq: ['$status', 'hidden'] },
                    { $eq: ['$status', 'paused'] }
                  ]
                },
                1,
                0
              ]
            }
          },
          outOfStockCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$type', 'product'] },
                    {
                      $or: [
                        { $lte: ['$stock', 0] },
                        { $eq: ['$status', 'out_of_stock'] }
                      ]
                    }
                  ]
                },
                1,
                0
              ]
            }
          },
          productsCount: {
            $sum: { $cond: [{ $eq: ['$type', 'product'] }, 1, 0] }
          },
          servicesCount: {
            $sum: { $cond: [{ $eq: ['$type', 'service'] }, 1, 0] }
          },
          usedCount: {
            $sum: { $cond: [{ $eq: ['$condition', 'used'] }, 1, 0] }
          },
          boostedCount: {
            $sum: { $cond: [{ $eq: ['$isBoosted', true] }, 1, 0] }
          },
          totalViews: { $sum: { $ifNull: ['$views', 0] } },
          totalLikes: { $sum: { $ifNull: ['$likes', 0] } },
          totalOrders: { $sum: { $ifNull: ['$orders_count', 0] } }
        }
      }
    ]),
    Listing.aggregate([
      {
        $match: {
          isDeleted: { $ne: true },
          status: { $in: ['published', 'active'] },
          type: 'product',
          stock: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          totalCatalogGmv: { $sum: { $multiply: ['$price', '$stock'] } }
        }
      }
    ])
  ]);

  const metrics = countsAgg[0] || {
    totalListings: 0,
    publishedCount: 0,
    draftCount: 0,
    flaggedCount: 0,
    outOfStockCount: 0,
    productsCount: 0,
    servicesCount: 0,
    usedCount: 0,
    boostedCount: 0,
    totalViews: 0,
    totalLikes: 0,
    totalOrders: 0
  };

  const gmv = valuationAgg[0]?.totalCatalogGmv || 0;

  return {
    totalListings: metrics.totalListings,
    publishedCount: metrics.publishedCount,
    draftCount: metrics.draftCount,
    flaggedCount: metrics.flaggedCount,
    outOfStockCount: metrics.outOfStockCount,
    productsCount: metrics.productsCount,
    servicesCount: metrics.servicesCount,
    usedCount: metrics.usedCount,
    boostedCount: metrics.boostedCount,
    totalViews: metrics.totalViews,
    totalLikes: metrics.totalLikes,
    totalOrders: metrics.totalOrders,
    totalCatalogGmv: gmv
  };
};

/**
 * Filterable, Paginated, and Searchable Listing Query
 */
const listListingsAdmin = async (...args) => {
  let options = {};
  if (typeof args[0] === 'object' && args[0] !== null) {
    options = args[0];
  } else {
    options = {
      status: args[0] || null,
      flagged: args[1] !== undefined ? args[1] : null,
      cursor: args[2] || null,
      limit: args[3] || 20
    };
  }

  const {
    status,
    flagged,
    type,
    condition,
    category,
    stock_status,
    is_boosted,
    q,
    search,
    sortBy = 'newest',
    cursor,
    page = 1,
    limit = 30
  } = options;

  const query = { isDeleted: { $ne: true } };

  // Status filtering
  if (status) {
    if (status === 'published' || status === 'active') {
      query.status = { $in: ['published', 'active'] };
      query.is_takendown = { $ne: true };
    } else if (status === 'draft') {
      query.status = 'draft';
    } else if (status === 'out_of_stock') {
      query.$or = [{ status: 'out_of_stock' }, { stock: { $lte: 0 }, type: 'product' }];
    } else if (status === 'hidden' || status === 'paused') {
      query.$or = [{ status: { $in: ['hidden', 'paused'] } }, { is_takendown: true }];
    } else {
      query.status = status;
    }
  }

  // Flagged / Takedown filtering
  if (flagged !== null && flagged !== undefined) {
    const isFlagged = flagged === true || flagged === 'true';
    if (isFlagged) {
      query.$or = [
        { is_takendown: true },
        { status: { $in: ['hidden', 'paused'] } }
      ];
    } else {
      query.is_takendown = { $ne: true };
    }
  }

  // Type filtering
  if (type && type !== 'all') {
    query.type = type;
  }

  // Condition filtering
  if (condition && condition !== 'all') {
    query.condition = condition;
  }

  // Category filtering
  if (category && category !== 'all') {
    query.category = { $regex: new RegExp(`^${category}$`, 'i') };
  }

  // Stock status filtering
  if (stock_status) {
    if (stock_status === 'out_of_stock') {
      query.stock = { $lte: 0 };
      query.type = 'product';
    } else if (stock_status === 'low_stock') {
      query.stock = { $gt: 0, $lte: 5 };
      query.type = 'product';
    } else if (stock_status === 'in_stock') {
      query.stock = { $gt: 5 };
    }
  }

  // Boosted filtering
  if (is_boosted !== undefined && is_boosted !== null) {
    query.isBoosted = is_boosted === true || is_boosted === 'true';
  }

  // Search keyword (q or search)
  const keyword = (q || search || '').trim();
  if (keyword) {
    const safeRegex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [
      { title: safeRegex },
      { description: safeRegex },
      { sku: safeRegex },
      { category: safeRegex }
    ];
  }

  // Cursor for backward compatibility
  if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
    query._id = { $lt: new mongoose.Types.ObjectId(cursor) };
  }

  // Sorting
  const sort = {};
  switch (sortBy) {
    case 'oldest':
      sort.createdAt = 1;
      sort._id = 1;
      break;
    case 'price_desc':
      sort.price = -1;
      break;
    case 'price_asc':
      sort.price = 1;
      break;
    case 'views':
      sort.views = -1;
      break;
    case 'orders':
      sort.orders_count = -1;
      break;
    case 'rating':
      sort.rating = -1;
      break;
    case 'newest':
    default:
      sort.createdAt = -1;
      sort._id = -1;
      break;
  }

  const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 30));
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const skip = (parsedPage - 1) * parsedLimit;

  const [totalCount, docs] = await Promise.all([
    Listing.countDocuments(query),
    Listing.find(query)
      .populate('vendor', 'name email phone avatar is_verified vendorProfile')
      .sort(sort)
      .skip(skip)
      .limit(parsedLimit + 1)
      .lean()
  ]);

  const hasMore = docs.length > parsedLimit;
  const sliced = docs.slice(0, parsedLimit);

  const formattedItems = sliced.map((item) => {
    const id = item._id.toString();
    const vendorObj = item.vendor && typeof item.vendor === 'object' ? item.vendor : null;
    return {
      ...item,
      id,
      _id: id,
      vendor_id: vendorObj ? vendorObj._id?.toString() : (item.vendor?.toString() || null),
      vendor_name: vendorObj?.vendorProfile?.businessName || vendorObj?.name || 'Verified Vendor',
      vendor_email: vendorObj?.email || null,
      vendor_phone: vendorObj?.phone || null,
      vendor_avatar: vendorObj?.avatar || null,
      vendor_verified: !!vendorObj?.is_verified,
      is_takendown: item.is_takendown === true || item.status === 'hidden' || item.status === 'paused'
    };
  });

  return {
    items: formattedItems,
    pagination: {
      total: totalCount,
      page: parsedPage,
      limit: parsedLimit,
      pages: Math.ceil(totalCount / parsedLimit) || 1,
      hasNextPage: hasMore,
      hasPrevPage: parsedPage > 1
    },
    next_cursor: hasMore && sliced.length > 0 ? sliced[sliced.length - 1]._id.toString() : null,
    has_more: hasMore
  };
};

/**
 * Takedown a listing with mandatory reason and audit log
 */
const takedownListing = async (listingId, reason = 'Policy Violation', adminUser = null, comments = '') => {
  const listing = await Listing.findById(listingId);
  if (!listing) {
    throw ApiError.notFound('Listing not found');
  }

  listing.is_takendown = true;
  listing.status = 'hidden';
  listing.moderation = {
    action: 'takedown',
    reason,
    comments,
    moderatedBy: adminUser?._id || null,
    moderatedAt: new Date()
  };
  await listing.save();

  // Record Audit Log
  try {
    if (AuditLog) {
      await AuditLog.create({
        userId: adminUser?._id || null,
        action: 'LISTING_DELETE',
        target_id: listingId.toString(),
        target_type: 'listing',
        metadata: {
          reason,
          comments,
          listing_title: listing.title,
          vendor_id: listing.vendor?.toString()
        }
      });
    }
  } catch (e) {}

  // Dispatch real-time admin sync event
  try {
    emitToAdmin('admin:update', { tags: ['AdminListings', 'AdminListingsStats', 'AdminOverview'] });
  } catch (err) {}

  return { ok: true, listing_id: listingId, status: 'hidden' };
};

/**
 * Restore a taken-down listing
 */
const restoreListing = async (listingId, adminUser = null) => {
  const listing = await Listing.findById(listingId);
  if (!listing) {
    throw ApiError.notFound('Listing not found');
  }

  listing.is_takendown = false;
  listing.status = 'published';
  listing.moderation = {
    action: 'restore',
    moderatedBy: adminUser?._id || null,
    moderatedAt: new Date()
  };
  await listing.save();

  try {
    if (AuditLog) {
      await AuditLog.create({
        userId: adminUser?._id || null,
        action: 'LISTING_UPDATE',
        target_id: listingId.toString(),
        target_type: 'listing',
        metadata: {
          action: 'restore',
          listing_title: listing.title
        }
      });
    }
  } catch (e) {}

  try {
    emitToAdmin('admin:update', { tags: ['AdminListings', 'AdminListingsStats', 'AdminOverview'] });
  } catch (err) {}

  return { ok: true, listing_id: listingId, status: 'published' };
};

/**
 * Moderate a listing (Approve / Reject)
 */
const moderateListing = async (listingId, { status = 'approved', reason = '', comments = '' }, adminUser = null) => {
  const listing = await Listing.findById(listingId);
  if (!listing) {
    throw ApiError.notFound('Listing not found');
  }

  const isApproved = status === 'approved' || status === 'published';
  listing.is_takendown = !isApproved;
  listing.status = isApproved ? 'published' : 'hidden';
  listing.moderation = {
    action: isApproved ? 'approved' : 'rejected',
    reason,
    comments,
    moderatedBy: adminUser?._id || null,
    moderatedAt: new Date()
  };
  await listing.save();

  try {
    if (AuditLog) {
      await AuditLog.create({
        userId: adminUser?._id || null,
        action: 'LISTING_UPDATE',
        target_id: listingId.toString(),
        target_type: 'listing',
        metadata: {
          action: isApproved ? 'approved' : 'rejected',
          reason,
          comments,
          listing_title: listing.title
        }
      });
    }
  } catch (e) {}

  try {
    emitToAdmin('admin:update', { tags: ['AdminListings', 'AdminListingsStats', 'AdminOverview'] });
  } catch (err) {}

  return { ok: true, listing_id: listingId, status: listing.status };
};

/**
 * Toggle Boost / Featured Status for a Listing
 */
const toggleBoostListing = async (listingId, adminUser = null) => {
  const listing = await Listing.findById(listingId);
  if (!listing) {
    throw ApiError.notFound('Listing not found');
  }

  listing.isBoosted = !listing.isBoosted;
  await listing.save();

  try {
    emitToAdmin('admin:update', { tags: ['AdminListings', 'AdminListingsStats'] });
  } catch (err) {}

  return { ok: true, listing_id: listingId, isBoosted: listing.isBoosted };
};

/**
 * Enterprise Bulk Operations on Listings
 */
const bulkUpdateListings = async (listingIds, action, payload = {}, adminUser = null) => {
  if (!Array.isArray(listingIds) || listingIds.length === 0) {
    throw ApiError.badRequest('listing_ids array required');
  }

  const objectIds = listingIds.map(id => new mongoose.Types.ObjectId(id));
  let modifiedCount = 0;

  switch (action) {
    case 'bulk_approve': {
      const res = await Listing.updateMany(
        { _id: { $in: objectIds } },
        { $set: { status: 'published', is_takendown: false, updatedAt: new Date() } }
      );
      modifiedCount = res.modifiedCount;
      break;
    }
    case 'bulk_takedown': {
      const res = await Listing.updateMany(
        { _id: { $in: objectIds } },
        {
          $set: {
            status: 'hidden',
            is_takendown: true,
            'moderation.reason': payload.reason || 'Bulk Moderation Takedown',
            'moderation.comments': payload.comments || '',
            'moderation.moderatedAt': new Date(),
            updatedAt: new Date()
          }
        }
      );
      modifiedCount = res.modifiedCount;
      break;
    }
    case 'bulk_restore': {
      const res = await Listing.updateMany(
        { _id: { $in: objectIds } },
        { $set: { status: 'published', is_takendown: false, updatedAt: new Date() } }
      );
      modifiedCount = res.modifiedCount;
      break;
    }
    case 'bulk_boost': {
      const res = await Listing.updateMany(
        { _id: { $in: objectIds } },
        { $set: { isBoosted: true, updatedAt: new Date() } }
      );
      modifiedCount = res.modifiedCount;
      break;
    }
    case 'bulk_delete': {
      const res = await Listing.updateMany(
        { _id: { $in: objectIds } },
        { $set: { isDeleted: true, status: 'hidden', updatedAt: new Date() } }
      );
      modifiedCount = res.modifiedCount;
      break;
    }
    default:
      throw ApiError.badRequest(`Unsupported bulk action: ${action}`);
  }

  try {
    emitToAdmin('admin:update', { tags: ['AdminListings', 'AdminListingsStats', 'AdminOverview'] });
  } catch (err) {}

  return { ok: true, action, count: modifiedCount };
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

  if (!dryRun && userIdsObj.length > 0) {
    const r = await User.updateMany(
      { _id: { $in: userIdsObj } },
      { $set: { is_deleted: true, is_active: false, is_test_data: true, updated_at: now } }
    );
    counts.users_soft_deleted = r.modifiedCount;
  } else {
    counts.users_soft_deleted = 0;
  }

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
  getAdminListingStats,
  listListingsAdmin,
  listListings: listListingsAdmin,
  takedownListing,
  restoreListing,
  moderateListing,
  toggleBoostListing,
  bulkUpdateListings,
  purgeTestData,
};
