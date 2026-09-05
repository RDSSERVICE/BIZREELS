const Reel = require('../models/Reel');
const Listing = require('../models/Listing');
const Order = require('../models/Order');
const HireRequest = require('../models/HireRequest');
const User = require('../models/User');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { deleteCache } = require('../utils/cache');

/**
 * CreatorController
 * Handles Creator Studio endpoints querying live MongoDB data.
 */
class CreatorController {
  // ── Creator Dashboard ────────────────────────────────────
  getDashboard = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const startOfThisMonth = new Date();
    startOfThisMonth.setDate(1);
    startOfThisMonth.setHours(0, 0, 0, 0);

    const startOfLastMonth = new Date();
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
    startOfLastMonth.setDate(1);
    startOfLastMonth.setHours(0, 0, 0, 0);

    const [
      hireRequestsCount,
      pendingRequests,
      reels,
      totalOrders,
      portfolioReelsCount,
      portfolioImagesCount,
      thisMonthHires,
      lastMonthHires,
      thisMonthOrders,
      lastMonthOrders,
      thisMonthReels,
      lastMonthReels
    ] = await Promise.all([
      HireRequest.countDocuments({ creator: userId }),
      HireRequest.countDocuments({ creator: userId, status: 'pending' }),
      Reel.find({ creator: userId }).select('views').lean(),
      Order.countDocuments({ vendor: userId }),
      Reel.countDocuments({ creator: userId }),
      Listing.countDocuments({ vendor: userId }),
      HireRequest.countDocuments({ creator: userId, createdAt: { $gte: startOfThisMonth } }),
      HireRequest.countDocuments({ creator: userId, createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth } }),
      Order.countDocuments({ vendor: userId, createdAt: { $gte: startOfThisMonth } }),
      Order.countDocuments({ vendor: userId, createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth } }),
      Reel.find({ creator: userId, createdAt: { $gte: startOfThisMonth } }).select('views').lean(),
      Reel.find({ creator: userId, createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth } }).select('views').lean()
    ]);

    const totalProjectsCount = hireRequestsCount + totalOrders;
    const totalViews = reels.reduce((acc, r) => acc + (r.views || 0), 0);

    // Dynamic calculations for Project Trends
    const thisMonthProjects = thisMonthHires + thisMonthOrders;
    const lastMonthProjects = lastMonthHires + lastMonthOrders;
    const projectsTrend = lastMonthProjects > 0
      ? Math.round(((thisMonthProjects - lastMonthProjects) / lastMonthProjects) * 100)
      : (thisMonthProjects > 0 ? 100 : 0);

    // Dynamic calculations for Views Trends
    const thisMonthViews = thisMonthReels.reduce((acc, r) => acc + (r.views || 0), 0);
    const lastMonthViews = lastMonthReels.reduce((acc, r) => acc + (r.views || 0), 0);
    const viewsTrend = lastMonthViews > 0
      ? Math.round(((thisMonthViews - lastMonthViews) / lastMonthViews) * 100)
      : (thisMonthViews > 0 ? 100 : 0);

    // Calculate active clients (unique vendors who have created a completed or accepted HireRequest)
    const activeClientsCount = await HireRequest.distinct('vendor', {
      creator: userId,
      status: { $in: ['accepted', 'completed'] }
    }).then(list => list.length);

    // Calculate monthly earnings and last month earnings from IsolatedTransaction (role-isolated ledger)
    const IsolatedTransaction = require('../models/IsolatedTransaction.model');
    const [thisMonthTx, lastMonthTx] = await Promise.all([
      IsolatedTransaction.find({
        userId: userId.toString(),
        role: 'creator',
        type: 'credit',
        status: 'success',
        created_at: { $gte: startOfThisMonth }
      }).lean(),
      IsolatedTransaction.find({
        userId: userId.toString(),
        role: 'creator',
        type: 'credit',
        status: 'success',
        created_at: { $gte: startOfLastMonth, $lt: startOfThisMonth }
      }).lean()
    ]);

    const monthlyEarnings = thisMonthTx.reduce((acc, tx) => acc + (tx.amount || 0), 0);
    const lastMonthEarnings = lastMonthTx.reduce((acc, tx) => acc + (tx.amount || 0), 0);

    const earningsTrend = lastMonthEarnings > 0
      ? Math.round(((monthlyEarnings - lastMonthEarnings) / lastMonthEarnings) * 100)
      : (monthlyEarnings > 0 ? 100 : 0);

    // Dynamic calculations for Reviews/Rating Trends
    const Review = require('../models/Review');
    const [thisMonthReviews, lastMonthReviews] = await Promise.all([
      Review.find({ targetUser: userId, createdAt: { $gte: startOfThisMonth } }).select('rating').lean(),
      Review.find({ targetUser: userId, createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth } }).select('rating').lean()
    ]);
    const thisMonthRatingAvg = thisMonthReviews.length > 0
      ? thisMonthReviews.reduce((acc, r) => acc + r.rating, 0) / thisMonthReviews.length
      : 0;
    const lastMonthRatingAvg = lastMonthReviews.length > 0
      ? lastMonthReviews.reduce((acc, r) => acc + r.rating, 0) / lastMonthReviews.length
      : 0;
    const ratingTrend = lastMonthRatingAvg > 0
      ? Math.round(((thisMonthRatingAvg - lastMonthRatingAvg) / lastMonthRatingAvg) * 100)
      : (thisMonthRatingAvg > 0 ? 100 : 0);

    // Pending requests trend (simply comparison of pending count)
    const thisMonthPending = await HireRequest.countDocuments({ creator: userId, status: 'pending', createdAt: { $gte: startOfThisMonth } });
    const lastMonthPending = await HireRequest.countDocuments({ creator: userId, status: 'pending', createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth } });
    const pendingRequestsTrend = lastMonthPending > 0
      ? Math.round(((thisMonthPending - lastMonthPending) / lastMonthPending) * 100)
      : (thisMonthPending > 0 ? 100 : 0);

    // Calculate total creator earnings from role-isolated wallet
    const IsolatedWallet = require('../models/IsolatedWallet.model');
    const creatorWallet = await IsolatedWallet.findOne({ userId: userId.toString(), role: 'creator' }).lean();
    const totalEarningsVal = creatorWallet?.lifetime_earned || creatorWallet?.balance || 0;

    return ApiResponse.ok(res, 'Creator dashboard metrics loaded.', {
      totalProjects: totalProjectsCount,
      pendingRequests: pendingRequests,
      totalEarnings: totalEarningsVal,
      rating: req.user.rating_avg || 5.0,
      reviewCount: req.user.rating_count || 0,
      portfolioViews: totalViews,
      activeClients: activeClientsCount,
      portfolioReels: portfolioReelsCount,
      portfolioImages: portfolioImagesCount,
      monthlyEarnings: monthlyEarnings,
      lastMonthEarnings: lastMonthEarnings,
      projectsTrend,
      earningsTrend,
      ratingTrend,
      viewsTrend,
      pendingRequestsTrend,
      verificationStatus: req.user.creatorProfile?.verificationStatus || 'unverified'
    });
  });

  // ── Creator Portfolio ────────────────────────────────────
  getPortfolio = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const [reels, listings] = await Promise.all([
      Reel.find({ creator: userId }).sort({ createdAt: -1 }).lean(),
      Listing.find({ vendor: userId }).sort({ createdAt: -1 }).lean()
    ]);

    return ApiResponse.ok(res, 'Creator portfolio loaded.', {
      reels: reels.map((r) => ({
        id: r._id.toString(),
        title: r.caption || 'Sample Reel',
        views: `${r.views || 0} Views`,
        url: r.videoUrl
      })),
      images: listings.map((l) => ({
        id: l._id.toString(),
        title: l.title,
        url: l.images?.[0] || ''
      }))
    });
  });

  // ── Add Reel to Portfolio ────────────────────────────────
  addPortfolioReel = asyncHandler(async (req, res) => {
    const { videoUrl, title } = req.body;
    const newReel = await Reel.create({
      creator: req.user._id,
      videoUrl: videoUrl || 'https://assets.mixkit.co/videos/preview/mixkit-fashion-model-in-a-neon-room-41566-large.mp4',
      caption: title || 'New Sample Reel'
    });
    return ApiResponse.created(res, 'Sample reel added to portfolio.', { reel: newReel });
  });

  // ── Add Image to Portfolio ──────────────────────────────
  addPortfolioImage = asyncHandler(async (req, res) => {
    const { url, title } = req.body;
    const newListing = await Listing.create({
      vendor: req.user._id,
      type: 'product',
      title: title || 'New Shoot Image',
      category: 'Portfolio',
      price: 0,
      images: [url || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80']
    });
    return ApiResponse.created(res, 'Portfolio image added.', { image: newListing });
  });

  // ── Delete Item from Portfolio ──────────────────────────
  deletePortfolioItem = asyncHandler(async (req, res) => {
    const { type, id } = req.params;
    if (type === 'reels') {
      await Reel.findOneAndDelete({ _id: id, creator: req.user._id });
    } else {
      await Listing.findOneAndDelete({ _id: id, vendor: req.user._id });
    }
    return ApiResponse.ok(res, 'Portfolio item removed.');
  });

  // ── Get & Update Pricing ─────────────────────────────────
  getPricing = asyncHandler(async (req, res) => {
    const p = req.user.creatorProfile?.pricing || {};
    return ApiResponse.ok(res, 'Pricing details loaded.', {
      reel1: Number(p.reel1 || 0),
      reel3: Number(p.reel3 || 0),
      reel10: Number(p.reel10 || 0),
      hourlyRate: Number(p.hourlyRate || 0),
      dayRate: Number(p.dayRate || 0)
    });
  });

  updatePricing = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) throw ApiError.notFound('User not found');
    user.creatorProfile = user.creatorProfile || {};
    user.creatorProfile.pricing = req.body;
    user.markModified('creatorProfile');
    await user.save();
    return ApiResponse.ok(res, 'Creator pricing updated.', { pricing: user.creatorProfile?.pricing });
  });

  // ── Get & Update Availability ────────────────────────────
  getAvailability = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('creatorProfile availabilityStatus availability').lean();
    const status = user?.creatorProfile?.availability || user?.creatorProfile?.availabilityStatus || user?.availabilityStatus || user?.availability || 'Available';
    return ApiResponse.ok(res, 'Creator availability loaded.', {
      status
    });
  });

  updateAvailability = asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!status) throw ApiError.badRequest('Status is required');
    const user = await User.findById(req.user._id);
    if (!user) throw ApiError.notFound('User not found');

    user.creatorProfile = user.creatorProfile || {};
    user.creatorProfile.availability = status;
    user.creatorProfile.availabilityStatus = status;
    user.availabilityStatus = status;
    user.availability = status;
    user.markModified('creatorProfile');
    await user.save();

    await deleteCache(`user:auth:${user._id}`).catch(() => {});

    return ApiResponse.ok(res, 'Creator availability updated.', { status: user.creatorProfile.availability });
  });

  // ── Get Creator Orders / Projects ────────────────────────
  getOrders = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const [hireRequests, orders] = await Promise.all([
      HireRequest.find({ creator: userId }).sort({ createdAt: -1 }).populate('vendor', 'name').lean(),
      Order.find({ vendor: userId }).sort({ createdAt: -1 }).populate('customer', 'name').populate('listing', 'title').lean()
    ]);

    const mappedHires = hireRequests.map((h) => ({
      _id: h._id.toString(),
      id: h._id.toString(),
      title: h.title || 'Creator Hire Request',
      vendor_name: h.vendor?.name || 'Vendor Client',
      vendor_id: h.vendor?._id?.toString(),
      amount: h.budget || 0,
      status: h.status || 'pending',
      created_at: h.createdAt,
      type: 'Collaboration',
      deliveryDays: h.deliveryDays,
      paymentStatus: h.paymentStatus || 'unpaid',
      description: h.description || 'No campaign details provided.'
    }));

    const mappedOrders = orders.map((o) => ({
      _id: o._id.toString(),
      id: o._id.toString(),
      title: o.listing?.title || 'Promo Reel Shoot',
      vendor_name: o.customer?.name || 'Vendor Client',
      vendor_id: o.customer?._id?.toString(),
      amount: o.price || 0,
      status: o.status || 'completed',
      created_at: o.createdAt,
      type: 'Direct Purchase',
      quantity: o.quantity || 1,
      paymentStatus: o.paymentStatus || 'paid',
      address: o.address || 'Local storefront pickup/delivery'
    }));

    const allProjects = [...mappedHires, ...mappedOrders];

    return ApiResponse.ok(res, 'Creator projects loaded.', allProjects);
  });

  // ── Update Creator Order / Project Status ────────────────
  updateOrderStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    let hire = await HireRequest.findOne({ _id: id, creator: req.user._id });
    if (hire) {
      hire.status = status;
      await hire.save();
      return ApiResponse.ok(res, `Project status updated to ${status}.`, { project: hire });
    }

    let order = await Order.findOne({ _id: id, vendor: req.user._id });
    if (order) {
      order.status = status;
      await order.save();
      return ApiResponse.ok(res, `Order status updated to ${status}.`, { order });
    }

    throw ApiError.notFound('Project or order not found.');
  });
}

module.exports = new CreatorController();
