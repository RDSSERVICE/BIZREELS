const Reel = require('../models/Reel');
const Listing = require('../models/Listing');
const Order = require('../models/Order');
const User = require('../models/User');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

/**
 * CreatorController
 * Handles Creator Studio endpoints querying live MongoDB data.
 */
class CreatorController {
  // ── Creator Dashboard ────────────────────────────────────
  getDashboard = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const [reelsCount, pendingOrders, totalReels] = await Promise.all([
      Reel.countDocuments({ creator: userId }),
      Order.countDocuments({ customer_id: userId.toString(), status: 'new' }),
      Reel.find({ creator: userId }).select('views').lean()
    ]);

    const totalViews = totalReels.reduce((acc, r) => acc + (r.views || 0), 0);

    return ApiResponse.ok(res, 'Creator dashboard metrics loaded.', {
      totalProjects: reelsCount,
      pendingRequests: pendingOrders,
      totalEarnings: req.user.walletBalance || 0,
      rating: req.user.rating_avg || 5.0,
      reviewCount: req.user.rating_count || 0,
      portfolioViews: totalViews
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
      reel1: p.reel1 || 500,
      reel3: p.reel3 || 1200,
      reel10: p.reel10 || 3500,
      hourlyRate: p.hourlyRate || 1000,
      dayRate: p.dayRate || 6000
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
    return ApiResponse.ok(res, 'Creator availability loaded.', {
      status: req.user.creatorProfile?.availability || 'Available'
    });
  });

  updateAvailability = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) throw ApiError.notFound('User not found');
    user.creatorProfile = user.creatorProfile || {};
    user.creatorProfile.availability = status;
    user.markModified('creatorProfile');
    await user.save();
    return ApiResponse.ok(res, 'Creator availability updated.', { status: user.creatorProfile?.availability });
  });

  // ── Get Creator Orders ───────────────────────────────────
  getOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ customer_id: req.user._id.toString() }).sort({ createdAt: -1 }).lean();
    return ApiResponse.ok(res, 'Creator projects loaded.', {
      orders: orders.map((o) => ({
        id: o._id.toString(),
        vendor: 'Vendor Client',
        project: o.items?.[0]?.title || 'Promo Reel Shoot',
        amount: o.total_price || 0,
        date: new Date(o.createdAt).toLocaleDateString(),
        status: o.status || 'Completed'
      }))
    });
  });
}

module.exports = new CreatorController();
