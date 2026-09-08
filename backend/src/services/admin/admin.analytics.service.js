const User = require('../../models/User');
const Listing = require('../../models/Listing');
const Deal = require('../../models/Deal');
const { KycDocument, Wallet } = require('../../models/Phase4');
const { AuditLog } = require('../../models/Misc');
const reportService = require('../report.service');

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
  try { Reel = require('../../models/Reel'); } catch (e) { Reel = null; }
  try {
    const phase4 = require('../../models/Phase4');
    Subscription = phase4.Subscription;
    Payment = phase4.Payment;
  } catch (e) {
    Subscription = null;
    Payment = null;
  }
  try { Order = require('../../models/Order'); } catch (e) { Order = null; }
  try {
    const misc = require('../../models/Misc');
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

module.exports = {
  analyticsOverview,
  clearOverviewCache,
};
