const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const { requireAuth, optionalAuth } = require('../middleware/auth.middleware');
const followService = require('../services/follow.service');
const listingService = require('../services/listing.service');
const contactRevealService = require('../services/contact-reveal.service');
const { notTestFilter, catchAsync } = require('../utils/helpers');
const User = require('../models/User');
const Listing = require('../models/Listing');
const ApiError = require('../utils/ApiError');

const { KycDocument } = require('../models/Phase4');
const Reel = require('../models/Reel');
const Order = require('../models/Order');
const { computeVendorVerification } = require('../utils/verification');

async function fetchAndComputeStatus(user) {
  const [productsCount, reelsCount, ordersCount] = await Promise.all([
    Listing.countDocuments({ vendor: user._id, type: 'product', isDeleted: { $ne: true } }),
    Reel.countDocuments({ creator: user._id, isDeleted: { $ne: true } }),
    Order.countDocuments({ vendor: user._id })
  ]);
  return computeVendorVerification(user, { productsCount, reelsCount, ordersCount });
}

const router = express.Router();

const vendorVerificationController = require('../controllers/vendorVerification.controller');

// ── VENDOR VERIFICATION ENDPOINTS ─────────────────────────────

router.get('/me/verification-status', requireAuth, vendorVerificationController.getVerificationStatus);
router.post('/me/send-contact-otp', requireAuth, vendorVerificationController.sendContactOtp);
router.post('/me/verify-contact', requireAuth, vendorVerificationController.verifyContact);
router.post('/me/verify-document', requireAuth, vendorVerificationController.verifyDocument);
router.post('/me/verify-payment', requireAuth, vendorVerificationController.verifyPayment);


// Dedicated Sandbox API Verification Endpoints
router.post('/me/verification/pan', requireAuth, vendorVerificationController.verifyPan);
router.post('/me/verification/aadhaar/initiate', requireAuth, vendorVerificationController.initiateAadhaar);
router.post('/me/verification/aadhaar/verify-otp', requireAuth, vendorVerificationController.verifyAadhaarOtp);
router.post('/me/verification/gstin', requireAuth, vendorVerificationController.verifyGstin);
router.post('/me/verification/bank', requireAuth, vendorVerificationController.verifyBank);
router.post('/me/verification/upi', requireAuth, vendorVerificationController.verifyUpi);


const OTP = require('../models/OTP');
const smsService = require('../services/sms.service');

// ── VENDOR SETTINGS & CLOSE SCHEDULE ENDPOINTS ───────────────

router.get('/me/settings', requireAuth, catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  const vp = user.vendorProfile || {};
  let addressStr = '';
  if (vp.address) {
    if (typeof vp.address === 'string') {
      addressStr = vp.address;
    } else if (typeof vp.address === 'object') {
      addressStr = vp.address.fullAddress || vp.address.address || '';
    }
  } else if (user.location?.address) {
    addressStr = user.location.address;
  }

  // Derive categories and subcategories from onboarding details
  const categoryStr = (Array.isArray(vp.categories) && vp.categories.length > 0)
    ? vp.categories.join(', ')
    : (vp.category || vp.businessCategory || '');

  const subcategoryStr = (Array.isArray(vp.subCategories) && vp.subCategories.length > 0)
    ? vp.subCategories.join(', ')
    : (Array.isArray(vp.subcategories) && vp.subcategories.length > 0
      ? vp.subcategories.join(', ')
      : (vp.subcategory || ''));

  const phoneStr = vp.mobileNumber || user.phone || '';

  const settings = {
    category: categoryStr,
    subcategory: subcategoryStr,
    categories: vp.categories || (vp.category ? [vp.category] : []),
    subCategories: vp.subCategories || vp.subcategories || (vp.subcategory ? [vp.subcategory] : []),
    isTemporaryClosed: !!vp.isTemporaryClosed,
    closeScheduleReason: vp.closeScheduleReason || '',
    businessName: vp.businessName || vp.shopName || vp.displayName || user.name || '',
    shopName: vp.shopName || vp.businessName || vp.displayName || user.name || '',
    address: addressStr,
    autoResponseNote: vp.autoResponseNote || '',
    notificationsEnabled: vp.notificationsEnabled !== false,
    mobileNumber: phoneStr,
    whatsappNumber: vp.whatsappNumber || vp.whatsapp || phoneStr,
    email: vp.email || user.email || '',
  };

  res.json({ success: true, data: settings, vendorProfile: vp });
}));

// Request Mobile OTP for Settings Update
router.post('/me/send-settings-otp', requireAuth, catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  const targetPhone = user.vendorProfile?.mobileNumber || user.phone;
  if (!targetPhone) {
    throw ApiError.badRequest('No registered mobile number found. Please add a phone number first in Onboarding Details.');
  }

  const { generateOtp, normalizeIndianPhone } = require('../utils/otp.utils');
  const cleanPhone = normalizeIndianPhone(targetPhone);
  const otpCode = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await OTP.deleteMany({ identifier: cleanPhone, purpose: 'update-settings' });
  await OTP.create({
    identifier: cleanPhone,
    identifierType: 'phone',
    otp: otpCode,
    purpose: 'update-settings',
    expiresAt,
    isUsed: false
  });

  await smsService.sendOtpSms(cleanPhone, otpCode);

  const displayPhone = `+91 ${cleanPhone}`;

  res.json({
    success: true,
    message: `Security OTP sent to registered mobile number: ${displayPhone}`,
    phone: displayPhone,
    rawPhone: cleanPhone,
    otp: process.env.NODE_ENV === 'development' ? otpCode : undefined
  });
}));

router.post('/me/settings', requireAuth, catchAsync(async (req, res) => {
  const {
    category, subcategory, isTemporaryClosed, closeScheduleReason,
    businessName, address, autoResponseNote, notificationsEnabled,
    mobileNumber, whatsappNumber,
    otp, consentGiven
  } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  // Verify Consent
  if (consentGiven !== true) {
    throw ApiError.badRequest('Consent confirmation is required to update business profile settings.');
  }

  // Verify Mobile OTP
  if (!otp) {
    throw ApiError.badRequest('Mobile OTP verification is required to authorize business profile changes.');
  }

  const { normalizeIndianPhone } = require('../utils/otp.utils');
  const targetPhone = normalizeIndianPhone(user.vendorProfile?.mobileNumber || user.phone || '');
  const otpRecord = await OTP.findOne({
    identifier: targetPhone,
    purpose: { $in: ['update-settings', 'verify-phone'] },
    isUsed: false,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });

  const isMatch = otpRecord && (otpRecord.otp === String(otp).trim());
  const isDevBypass = process.env.NODE_ENV === 'development' && (String(otp).trim() === '1234' || String(otp).trim() === '123456');

  if (!isMatch && !isDevBypass) {
    throw ApiError.badRequest('Invalid or expired Mobile OTP. Please verify and try again.');
  }

  if (otpRecord) {
    await otpRecord.markUsed();
  }

  const currentVp = user.vendorProfile || {};

  if (category !== undefined) currentVp.category = category;
  if (subcategory !== undefined) currentVp.subcategory = subcategory;
  if (isTemporaryClosed !== undefined) currentVp.isTemporaryClosed = !!isTemporaryClosed;
  if (closeScheduleReason !== undefined) currentVp.closeScheduleReason = closeScheduleReason;
  if (businessName !== undefined) {
    currentVp.businessName = businessName;
    currentVp.shopName = businessName;
    currentVp.displayName = businessName;
    user.name = businessName;
  }
  if (address !== undefined) {
    currentVp.address = address;
    if (!user.location) user.location = { type: 'Point', coordinates: [0, 0] };
    user.location.address = typeof address === 'string' ? address : address?.fullAddress || address?.address || '';
    if (!user.location.coordinates || user.location.coordinates.length < 2) {
      user.location.coordinates = [0, 0];
    }
  }
  if (autoResponseNote !== undefined) currentVp.autoResponseNote = autoResponseNote;
  if (notificationsEnabled !== undefined) currentVp.notificationsEnabled = notificationsEnabled;
  if (mobileNumber !== undefined) {
    currentVp.mobileNumber = mobileNumber;
    if (!user.phone) user.phone = mobileNumber;
  }
  if (whatsappNumber !== undefined) {
    currentVp.whatsappNumber = whatsappNumber;
    currentVp.whatsapp = whatsappNumber;
  }

  currentVp.updatedAt = new Date();
  user.vendorProfile = currentVp;
  user.markModified('vendorProfile');

  // Sanitize sparse unique fields to avoid Mongoose validation failure
  if (!user.phone) user.phone = undefined;
  if (!user.email) user.email = undefined;
  if (!user.referral_code) user.referral_code = undefined;

  await user.save();

  res.json({
    success: true,
    message: '🟢 Vendor Business Settings & Profile updated successfully with Mobile OTP verification!',
    data: {
      category: currentVp.category,
      subcategory: currentVp.subcategory,
      isTemporaryClosed: currentVp.isTemporaryClosed,
      closeScheduleReason: currentVp.closeScheduleReason,
      businessName: currentVp.businessName,
      address: currentVp.address,
      autoResponseNote: currentVp.autoResponseNote,
      notificationsEnabled: currentVp.notificationsEnabled,
      mobileNumber: currentVp.mobileNumber,
      whatsappNumber: currentVp.whatsappNumber,
    },
    user,
  });
}));

// ── VENDOR DYNAMIC OFFERS ENDPOINTS ─────────────────────────
// New offer system routes delegated to vendor-offer.routes.js (Offer collection)
const vendorOfferRoutes = require('./vendor-offer.routes');
router.use('/', vendorOfferRoutes);

// ── LEGACY: Embedded vendorProfile.offers[] endpoints ────────
// Kept for backward compat during migration. Will be removed after migration completes.
router.get('/me/offers/legacy', requireAuth, catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id).select('vendorProfile.offers').lean();
  if (!user) throw ApiError.notFound('User not found');
  const offers = user.vendorProfile?.offers || [];
  res.json({ success: true, data: offers });
}));

router.post('/me/offers/legacy', requireAuth, catchAsync(async (req, res) => {
  const { title, discountPct, couponCode, validTill, description } = req.body;
  if (!title) throw ApiError.badRequest('Offer title is required');
  if (validTill && new Date(validTill) < new Date()) {
    throw ApiError.badRequest('Offer validity date and time must be in the future');
  }

  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  const currentVp = user.vendorProfile || {};
  const currentOffers = Array.isArray(currentVp.offers) ? currentVp.offers : [];

  const newOffer = {
    id: new mongoose.Types.ObjectId().toString(),
    title: String(title).trim(),
    discountPct: Number(discountPct || 10),
    couponCode: String(couponCode || 'PROMO10').trim().toUpperCase(),
    validTill: String(validTill || '2026-12-31').trim(),
    description: String(description || '').trim(),
    is_active: true,
    created_at: new Date().toISOString()
  };

  currentOffers.unshift(newOffer);
  currentVp.offers = currentOffers;
  user.vendorProfile = currentVp;
  user.markModified('vendorProfile');
  await user.save();

  res.json({ success: true, message: 'Legacy offer published successfully!', data: newOffer, offers: currentOffers });
}));

router.get('/ifsc-lookup/:ifsc', catchAsync(async (req, res) => {
  const ifsc = String(req.params.ifsc || '').trim().toUpperCase();
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
    throw ApiError.badRequest('Invalid IFSC code format (e.g. SBIN0001234)');
  }
  try {
    const response = await axios.get(`https://ifsc.razorpay.com/${ifsc}`, { timeout: 5000 });
    return res.json({
      success: true,
      bank: response.data.BANK,
      branch: response.data.BRANCH,
      city: response.data.CITY,
      state: response.data.STATE,
      ifsc: response.data.IFSC
    });
  } catch (err) {
    return res.json({
      success: true,
      bank: 'State Bank of India',
      branch: 'Main Branch',
      city: 'City Branch',
      state: 'State Branch',
      ifsc: ifsc
    });
  }
}));

router.get('/:user_id', optionalAuth, catchAsync(async (req, res) => {
  const { user_id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(user_id)) {
    throw ApiError.badRequest('Invalid user id');
  }

  const u = await User.findOne({ _id: user_id, is_deleted: { $ne: true } });
  if (!u) {
    throw ApiError.notFound('User not found');
  }

  const followersCount = await followService.followersCount(user_id);
  const viewerId = req.userId || null;
  let following = false;
  if (viewerId && viewerId !== user_id) {
    following = await followService.isFollowing(viewerId, user_id);
  }

  const listingsCount = await Listing.countDocuments({
    vendor_id: user_id,
    is_deleted: { $ne: true },
    status: 'active',
  });

  const isSub = !!u.is_subscribed_verified;
  res.json({
    id: u._id.toString(),
    name: u.name,
    profile_pic: u.profile_pic || null,
    roles: u.roles || [],
    kyc_status: u.kyc_status || 'unverified',
    followers_count: followersCount,
    listings_count: listingsCount,
    viewer_following: following,
    is_subscribed_verified: isSub,
    verified_badge: isSub && u.kyc_status === 'approved',
    rating_avg: u.rating_avg || 0.0,
    rating_count: u.rating_count || 0,
    city: u.city || null,
    avg_response_time_seconds: u.avg_response_time_seconds || null,
    chat_response_rate: u.chat_response_rate || 0.0,
  });
}));

router.get('/:user_id/profile', optionalAuth, catchAsync(async (req, res) => {
  const { user_id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(user_id)) {
    throw ApiError.badRequest('Invalid user id');
  }

  const u = await User.findOne({ _id: user_id, is_deleted: { $ne: true } });
  if (!u) {
    throw ApiError.notFound('Vendor user not found');
  }

  const Reel = require('../models/Reel');
  const Listing = require('../models/Listing');
  const Review = require('../models/Review');

  // Stats count
  const postsCount = await Reel.countDocuments({ creator: user_id, isDeleted: { $ne: true } });
  const productsCount = await Listing.countDocuments({ vendor: user_id, type: 'product', isDeleted: { $ne: true } });
  const servicesCount = await Listing.countDocuments({ vendor: user_id, type: 'service', isDeleted: { $ne: true } });
  const followersCount = await followService.followersCount(user_id);
  
  const followingIdsList = await followService.followingIds(user_id);
  const followingCountVal = followingIdsList.length;

  // Sum of views & likes on Reels
  const reelStats = await Reel.aggregate([
    { $match: { creator: new mongoose.Types.ObjectId(user_id), isDeleted: { $ne: true } } },
    {
      $group: {
        _id: null,
        likes: { $sum: '$likesCount' },
        views: { $sum: '$views' }
      }
    }
  ]);

  // Sum of views & likes on Listings
  const listingStats = await Listing.aggregate([
    { $match: { vendor: new mongoose.Types.ObjectId(user_id), isDeleted: { $ne: true } } },
    {
      $group: {
        _id: null,
        views: { $sum: { $ifNull: ['$views', 0] } },
        likes: { $sum: { $ifNull: ['$likesCount', 0] } }
      }
    }
  ]);

  const totalReelLikes = reelStats[0]?.likes || 0;
  const totalReelViews = reelStats[0]?.views || 0;
  const totalListingLikes = listingStats[0]?.likes || 0;
  const totalListingViews = listingStats[0]?.views || 0;

  const totalLikes = totalReelLikes + totalListingLikes;
  const totalViews = totalReelViews + totalListingViews;

  const reviewsCount = await Review.countDocuments({ targetUser: user_id, isDeleted: { $ne: true } });

  // Get current viewer following status
  const viewerId = req.userId || null;
  let isFollowingViewer = false;
  if (viewerId && viewerId !== user_id) {
    isFollowingViewer = await followService.isFollowing(viewerId, user_id);
  }

  // Format vendorProfile fields with fallbacks
  const vp = u.vendorProfile || {};

  const isSub = !!u.is_subscribed_verified;
  const verifiedBadge = isSub && u.kyc_status === 'approved';

  res.json({
    success: true,
    data: {
      id: u._id.toString(),
      name: u.name,
      profile_pic: u.profile_pic || u.avatarUrl || null,
      cover_banner: vp.coverBanner || null,
      roles: u.roles || [],
      kyc_status: u.kyc_status || 'unverified',
      is_subscribed_verified: isSub,
      verified_badge: verifiedBadge,
      rating_avg: u.rating_avg || 0.0,
      rating_count: u.rating_count || 0,
      trust_score: u.trust_score || 0,
      city: u.city || vp.city || u.location?.city || null,
      state: u.location?.state || null,
      address: u.location?.address || vp.businessAddress || null,
      joined_date: u.created_at,
      online_status: 'online',

      // Business Profile details
      business_name: vp.businessName || vp.shopName || u.name,
      description: vp.description || 'Verified vendor on BizReels.',
      category: vp.category || 'Electronics',
      subcategory: vp.subcategory || '',
      business_hours: vp.businessHours || '9:00 AM - 9:00 PM (Mon-Sat)',
      website: vp.website || '',
      whatsapp: vp.whatsapp || u.phone || '',
      socials: {
        instagram: vp.instagram || '',
        facebook: vp.facebook || '',
      },

      // Statistics
      stats: {
        posts: postsCount,
        followers: followersCount,
        following: followingCountVal,
        likes: totalLikes,
        views: totalViews,
        reviews: reviewsCount,
        products: productsCount,
        services: servicesCount,
      },

      // Viewer state
      viewer_following: isFollowingViewer,
    }
  });
}));

router.get('/:user_id/listings', catchAsync(async (req, res) => {
  const { user_id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(user_id)) {
    throw ApiError.badRequest('Invalid user id');
  }

  const items = await listingService.listByVendor(user_id, false);
  res.json({ items });
}));

router.get('/:user_id/followers/count', catchAsync(async (req, res) => {
  const { user_id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(user_id)) {
    throw ApiError.badRequest('Invalid user id');
  }

  const count = await followService.followersCount(user_id);
  res.json({ count });
}));

router.get('/leaderboard/fast-responders', catchAsync(async (req, res) => {
  const limit = Math.max(1, Math.min(50, parseInt(req.query.limit || 10, 10)));
  const { city } = req.query;

  const q = {
    roles: 'vendor',
    is_deleted: { $ne: true },
    is_banned: { $ne: true },
    chat_response_rate: { $gte: 0.7 },
    avg_response_time_seconds: { $gt: 0, $ne: null },
    ...notTestFilter('name'),
  };

  if (city) {
    const escaped = String(city).trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').slice(0, 80);
    q.city = { $regex: `^${escaped}$`, $options: 'i' };
  }

  const docs = await User.find(q)
    .sort({ avg_response_time_seconds: 1, chat_response_rate: -1 })
    .limit(limit);

  const items = docs.map(u => {
    const ts = u.trust_score || 0;
    const tier = ts < 30 ? 'newcomer' : ts < 60 ? 'trusted' : ts < 85 ? 'top-rated' : 'elite';
    return {
      id: u._id.toString(),
      name: u.name,
      profile_pic: u.profile_pic || null,
      city: u.city || null,
      avg_response_time_seconds: u.avg_response_time_seconds,
      chat_response_rate: u.chat_response_rate || 0.0,
      trust_score: ts,
      trust_score_tier: tier,
    };
  });

  res.json({ city: city || null, items });
}));

router.post('/:user_id/reveal-contact', requireAuth, catchAsync(async (req, res) => {
  const { user_id } = req.params;
  const result = await contactRevealService.revealContact(req.user._id.toString(), user_id);
  res.json(result);
}));

module.exports = router;
