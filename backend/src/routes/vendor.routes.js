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

// ── VENDOR VERIFICATION ENDPOINTS ─────────────────────────────

router.get('/me/verification-status', requireAuth, catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');
  
  const statusInfo = await fetchAndComputeStatus(user);
  res.json({ success: true, ...statusInfo });
}));


router.post('/me/verify-contact', requireAuth, catchAsync(async (req, res) => {
  const { type, value } = req.body;
  if (!['mobile', 'whatsapp', 'email', 'website'].includes(type)) {
    throw ApiError.badRequest('Invalid contact verification type');
  }

  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  const currentVp = user.vendorProfile || {};
  const currentContacts = currentVp.contactVerified || {
    mobile: !!user.phone,
    whatsapp: false,
    email: !!user.email,
    website: false
  };

  currentContacts[type] = true;

  if (type === 'mobile' && value) currentVp.mobileNumber = value;
  if (type === 'whatsapp' && value) currentVp.whatsappNumber = value;
  if (type === 'email' && value) currentVp.email = value;
  if (type === 'website' && value) currentVp.website = value;

  currentVp.contactVerified = currentContacts;
  user.vendorProfile = currentVp;
  user.markModified('vendorProfile');
  
  const statusInfo = await fetchAndComputeStatus(user);
  currentVp.verificationStatus = statusInfo.tier;
  user.vendorProfile = currentVp;
  user.markModified('vendorProfile');
  await user.save();

  res.json({ success: true, message: `${type} verified successfully!`, ...statusInfo });
}));

router.post('/me/verify-document', requireAuth, catchAsync(async (req, res) => {
  const { docType, docNumber, frontUrl, backUrl, fileUrl, docName } = req.body;
  if (!docType) throw ApiError.badRequest('docType is required');

  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  const currentVp = user.vendorProfile || {};
  const currentDocs = currentVp.documents || {};

  const now = new Date();
  const docFileUrl = fileUrl || frontUrl || backUrl || '';

  if (['aadhaar', 'pan', 'gst', 'shopLicense', 'udyamRegistration'].includes(docType)) {
    currentDocs[docType] = {
      docNumber: docNumber || currentDocs[docType]?.docNumber || '',
      frontUrl: frontUrl || currentDocs[docType]?.frontUrl || null,
      backUrl: backUrl || currentDocs[docType]?.backUrl || null,
      fileUrl: docFileUrl || currentDocs[docType]?.fileUrl || null,
      status: 'pending',
      verifiedAt: now
    };
  } else {
    // Dynamic document (FSSAI, Driving License, Trade License, etc.)
    const existingDynamic = currentDocs.dynamicDocs || [];
    const filtered = existingDynamic.filter(d => d.docType !== docType && d.docName !== docName);
    filtered.push({
      docName: docName || docType,
      docType,
      docNumber: docNumber || '',
      fileUrl: docFileUrl,
      status: 'pending',
      verifiedAt: now
    });
    currentDocs.dynamicDocs = filtered;
  }

  currentVp.documents = currentDocs;
  user.vendorProfile = currentVp;
  user.markModified('vendorProfile');

  // Sync to KycDocument model for Admin Queue visibility
  try {
    await KycDocument.create({
      user_id: user._id.toString(),
      doc_type: docName || docType,
      doc_number: docNumber || 'SUBMITTED',
      doc_url: docFileUrl || 'https://via.placeholder.com/400x600?text=Document+Attached',
      status: 'pending',
    });
  } catch (err) {
    console.error('Error syncing KycDocument for admin:', err.message);
  }

  const statusInfo = await fetchAndComputeStatus(user);
  currentVp.verificationStatus = statusInfo.tier;
  user.vendorProfile = currentVp;
  user.markModified('vendorProfile');
  if (['verified_vendor', 'trusted_vendor', 'premium_vendor'].includes(statusInfo.tier)) {
    user.kyc_status = 'approved';
  } else {
    user.kyc_status = 'pending';
  }
  await user.save();

  res.json({ success: true, message: `${docName || docType} submitted and pending verification!`, ...statusInfo });
}));

router.post('/me/verify-payment', requireAuth, catchAsync(async (req, res) => {
  const { upiId, bankAccount, accountHolderName, ifscCode, bankName, branchName, statementChequeUrl } = req.body;
  
  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  const currentVp = user.vendorProfile || {};
  const currentPayment = currentVp.paymentDetails || {};

  if (upiId !== undefined) {
    currentPayment.upiId = upiId;
    currentPayment.upiVerified = !!upiId && upiId.includes('@');
  }

  if (bankAccount !== undefined) currentPayment.bankAccount = bankAccount;
  if (accountHolderName !== undefined) currentPayment.accountHolderName = accountHolderName;
  if (ifscCode !== undefined) {
    currentPayment.ifscCode = ifscCode;
    currentPayment.ifscVerified = !!ifscCode && ifscCode.length >= 11;
  }
  if (bankName !== undefined) currentPayment.bankName = bankName;
  if (branchName !== undefined) currentPayment.branchName = branchName;
  if (statementChequeUrl !== undefined) currentPayment.statementChequeUrl = statementChequeUrl;

  currentPayment.verifiedAt = new Date();

  currentVp.paymentDetails = currentPayment;
  user.vendorProfile = currentVp;
  user.markModified('vendorProfile');

  const statusInfo = await fetchAndComputeStatus(user);
  currentVp.verificationStatus = statusInfo.tier;
  user.vendorProfile = currentVp;
  user.markModified('vendorProfile');
  await user.save();

  res.json({ success: true, message: 'Payment details verified and updated successfully!', ...statusInfo });
}));

// ── VENDOR SETTINGS & CLOSE SCHEDULE ENDPOINTS ───────────────

router.get('/me/settings', requireAuth, catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  const vp = user.vendorProfile || {};
  const settings = {
    category: vp.category || 'Electronics',
    subcategory: vp.subcategory || 'Smartphones & Audio',
    isTemporaryClosed: !!vp.isTemporaryClosed,
    closeScheduleReason: vp.closeScheduleReason || 'Renovation / Vacation',
    businessName: vp.businessName || user.name || '',
    address: vp.address || user.location?.address || '',
    autoResponseNote: vp.autoResponseNote || '',
    notificationsEnabled: vp.notificationsEnabled !== false,
  };

  res.json({ success: true, data: settings, vendorProfile: vp });
}));

router.post('/me/settings', requireAuth, catchAsync(async (req, res) => {
  const {
    category, subcategory, isTemporaryClosed, closeScheduleReason,
    businessName, address, autoResponseNote, notificationsEnabled
  } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  const currentVp = user.vendorProfile || {};

  if (category !== undefined) currentVp.category = category;
  if (subcategory !== undefined) currentVp.subcategory = subcategory;
  if (isTemporaryClosed !== undefined) currentVp.isTemporaryClosed = !!isTemporaryClosed;
  if (closeScheduleReason !== undefined) currentVp.closeScheduleReason = closeScheduleReason;
  if (businessName !== undefined) {
    currentVp.businessName = businessName;
    user.name = businessName;
  }
  if (address !== undefined) {
    currentVp.address = address;
    if (!user.location) user.location = { type: 'Point', coordinates: [0, 0] };
    user.location.address = address;
  }
  if (autoResponseNote !== undefined) currentVp.autoResponseNote = autoResponseNote;
  if (notificationsEnabled !== undefined) currentVp.notificationsEnabled = notificationsEnabled;

  currentVp.updatedAt = new Date();
  user.vendorProfile = currentVp;
  user.markModified('vendorProfile');
  await user.save();

  res.json({
    success: true,
    message: 'Vendor Business Settings & Close Schedule saved successfully!',
    data: {
      category: currentVp.category,
      subcategory: currentVp.subcategory,
      isTemporaryClosed: currentVp.isTemporaryClosed,
      closeScheduleReason: currentVp.closeScheduleReason,
      businessName: currentVp.businessName,
      address: currentVp.address,
      autoResponseNote: currentVp.autoResponseNote,
      notificationsEnabled: currentVp.notificationsEnabled,
    },
    user,
  });
}));

// ── VENDOR DYNAMIC OFFERS ENDPOINTS ─────────────────────────

router.get('/me/offers', requireAuth, catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');
  const offers = user.vendorProfile?.offers || [];
  res.json({ success: true, data: offers });
}));

router.post('/me/offers', requireAuth, catchAsync(async (req, res) => {
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

  // Notify all customers in real-time
  try {
    const notificationService = require('../services/notification.service');
    const customers = await User.find({
      roles: 'customer',
      is_deleted: { $ne: true }
    });

    const vendorDisplayName = user.name || currentVp.businessName || 'a local vendor';
    const notifyPromises = customers.map(cust =>
      notificationService.create(
        cust._id.toString(),
        'offers',
        `New Offer from ${vendorDisplayName}`,
        `Get ${newOffer.discountPct}% OFF with code "${newOffer.couponCode}" for: ${newOffer.title}. Expiring on: ${new Date(newOffer.validTill).toLocaleString()}`,
        {
          offerId: newOffer.id,
          vendorId: user._id.toString(),
          vendorName: vendorDisplayName,
          validTill: newOffer.validTill,
          couponCode: newOffer.couponCode,
          discountPct: newOffer.discountPct,
          title: newOffer.title,
          description: newOffer.description
        },
        '/customer/notifications'
      )
    );

    // Send notifications concurrently
    await Promise.all(notifyPromises);
  } catch (err) {
    console.error('Failed to notify customers about new offer:', err.message);
  }

  res.json({ success: true, message: 'Dynamic offer published successfully!', data: newOffer, offers: currentOffers });
}));

// ── Update Vendor Offer ──────────────────────────────────
router.put('/me/offers/:offerId', requireAuth, catchAsync(async (req, res) => {
  const { offerId } = req.params;
  const { title, discountPct, discountValue, discountType, couponCode, validTill, description,
          startTime, endTime, offerType, applicableProducts, applicableServices,
          usageLimit, image, priority, minOrderAmount, maxDiscountLimit, status } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  const currentVp = user.vendorProfile || {};
  const currentOffers = Array.isArray(currentVp.offers) ? currentVp.offers : [];
  const offerIndex = currentOffers.findIndex(o => o.id === offerId);
  if (offerIndex === -1) throw ApiError.notFound('Offer not found');

  const offer = currentOffers[offerIndex];
  if (title !== undefined) offer.title = title;
  if (discountPct !== undefined) offer.discountPct = Number(discountPct);
  if (discountValue !== undefined) offer.discountValue = Number(discountValue);
  if (discountType !== undefined) offer.discountType = discountType;
  if (couponCode !== undefined) offer.couponCode = String(couponCode).trim().toUpperCase();
  if (validTill !== undefined) offer.validTill = validTill;
  if (description !== undefined) offer.description = description;
  if (startTime !== undefined) offer.startTime = startTime;
  if (endTime !== undefined) offer.endTime = endTime;
  if (offerType !== undefined) offer.offerType = offerType;
  if (applicableProducts !== undefined) offer.applicableProducts = applicableProducts;
  if (applicableServices !== undefined) offer.applicableServices = applicableServices;
  if (usageLimit !== undefined) offer.usageLimit = usageLimit;
  if (image !== undefined) offer.image = image;
  if (priority !== undefined) offer.priority = priority;
  if (minOrderAmount !== undefined) offer.minOrderAmount = minOrderAmount;
  if (maxDiscountLimit !== undefined) offer.maxDiscountLimit = maxDiscountLimit;
  if (status !== undefined) offer.is_active = status === 'Active';
  offer.updated_at = new Date().toISOString();

  currentOffers[offerIndex] = offer;
  currentVp.offers = currentOffers;
  user.vendorProfile = currentVp;
  user.markModified('vendorProfile');
  await user.save();

  res.json({ success: true, message: 'Offer updated successfully!', data: offer });
}));

// ── Delete Vendor Offer ──────────────────────────────────
router.delete('/me/offers/:offerId', requireAuth, catchAsync(async (req, res) => {
  const { offerId } = req.params;
  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  const currentVp = user.vendorProfile || {};
  const currentOffers = Array.isArray(currentVp.offers) ? currentVp.offers : [];
  const newOffers = currentOffers.filter(o => o.id !== offerId);
  if (newOffers.length === currentOffers.length) throw ApiError.notFound('Offer not found');

  currentVp.offers = newOffers;
  user.vendorProfile = currentVp;
  user.markModified('vendorProfile');
  await user.save();

  res.json({ success: true, message: 'Offer deleted successfully!' });
}));

// ── Duplicate Vendor Offer ───────────────────────────────
router.post('/me/offers/:offerId/duplicate', requireAuth, catchAsync(async (req, res) => {
  const { offerId } = req.params;
  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  const currentVp = user.vendorProfile || {};
  const currentOffers = Array.isArray(currentVp.offers) ? currentVp.offers : [];
  const original = currentOffers.find(o => o.id === offerId);
  if (!original) throw ApiError.notFound('Offer not found');

  const duplicate = {
    ...original,
    id: new mongoose.Types.ObjectId().toString(),
    title: `${original.title} (Copy)`,
    is_active: false,
    created_at: new Date().toISOString()
  };

  currentOffers.unshift(duplicate);
  currentVp.offers = currentOffers;
  user.vendorProfile = currentVp;
  user.markModified('vendorProfile');
  await user.save();

  res.json({ success: true, message: 'Offer duplicated successfully!', data: duplicate });
}));

// ── Toggle Offer Status ──────────────────────────────────
router.patch('/me/offers/:offerId/status', requireAuth, catchAsync(async (req, res) => {
  const { offerId } = req.params;
  const { status } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  const currentVp = user.vendorProfile || {};
  const currentOffers = Array.isArray(currentVp.offers) ? currentVp.offers : [];
  const offerIndex = currentOffers.findIndex(o => o.id === offerId);
  if (offerIndex === -1) throw ApiError.notFound('Offer not found');

  currentOffers[offerIndex].is_active = status === 'active' || status === 'Active';
  currentOffers[offerIndex].updated_at = new Date().toISOString();
  currentVp.offers = currentOffers;
  user.vendorProfile = currentVp;
  user.markModified('vendorProfile');
  await user.save();
  res.json({ success: true, message: `Offer ${currentOffers[offerIndex].is_active ? 'activated' : 'disabled'} successfully!`, data: currentOffers[offerIndex] });
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
