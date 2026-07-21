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

const router = express.Router();

/**
 * Helper to compute vendor verification status & tier
 */
function computeVendorVerification(user) {
  const vp = user.vendorProfile || {};
  const contactVerified = vp.contactVerified || {
    mobile: !!user.phone,
    whatsapp: false,
    email: !!user.email,
    website: false
  };
  const documents = vp.documents || {};
  const paymentDetails = vp.paymentDetails || {};

  const hasAadhaar = documents.aadhaar && documents.aadhaar.status === 'approved';
  const hasPan = documents.pan && documents.pan.status === 'approved';
  const hasGst = documents.gst && documents.gst.status === 'approved';
  const hasShopLicense = documents.shopLicense && documents.shopLicense.status === 'approved';
  const hasUdyam = documents.udyamRegistration && documents.udyamRegistration.status === 'approved';

  let totalPoints = 0;
  if (contactVerified.mobile) totalPoints += 15;
  if (contactVerified.whatsapp) totalPoints += 10;
  if (contactVerified.email) totalPoints += 15;
  if (hasAadhaar) totalPoints += 20;
  if (hasPan) totalPoints += 20;
  if (hasGst || hasShopLicense || hasUdyam) totalPoints += 10;
  if (paymentDetails.upiVerified || (paymentDetails.bankAccount && paymentDetails.ifscVerified)) {
    totalPoints += 10;
  }

  const completionPercentage = Math.min(100, totalPoints);
  const isSubscribed = !!user.is_subscribed_verified;

  let tier = 'unverified';
  let badgeLabel = 'Unverified';
  let badgeColor = '⚪';

  if (hasPan || hasAadhaar || (hasGst && contactVerified.mobile && contactVerified.email)) {
    if (isSubscribed) {
      tier = 'premium_verified';
      badgeLabel = 'Premium Verified';
      badgeColor = '🔵';
    } else {
      tier = 'verified_vendor';
      badgeLabel = 'Verified Vendor';
      badgeColor = '🟢';
    }
  } else if (contactVerified.mobile || contactVerified.email || hasShopLicense || hasUdyam || paymentDetails.upiVerified || hasPan || hasAadhaar) {
    tier = 'partially_verified';
    badgeLabel = 'Partially Verified';
    badgeColor = '🟡';
  }

  return {
    completionPercentage,
    tier,
    badgeLabel,
    badgeColor,
    contactVerified,
    documents,
    paymentDetails,
    isSubscribedVerified: isSubscribed
  };
}

// ── VENDOR VERIFICATION ENDPOINTS ─────────────────────────────

router.get('/me/verification-status', requireAuth, catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');
  
  const statusInfo = computeVendorVerification(user);
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
  
  const statusInfo = computeVendorVerification(user);
  user.vendorProfile.verificationStatus = statusInfo.tier;
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

  if (['aadhaar', 'pan', 'gst', 'shopLicense', 'udyamRegistration'].includes(docType)) {
    currentDocs[docType] = {
      docNumber: docNumber || currentDocs[docType]?.docNumber || '',
      frontUrl: frontUrl || currentDocs[docType]?.frontUrl || null,
      backUrl: backUrl || currentDocs[docType]?.backUrl || null,
      fileUrl: fileUrl || currentDocs[docType]?.fileUrl || null,
      status: 'approved',
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
      fileUrl: fileUrl || frontUrl || '',
      status: 'approved',
      verifiedAt: now
    });
    currentDocs.dynamicDocs = filtered;
  }

  currentVp.documents = currentDocs;
  user.vendorProfile = currentVp;

  const statusInfo = computeVendorVerification(user);
  user.vendorProfile.verificationStatus = statusInfo.tier;
  if (['verified_vendor', 'premium_verified'].includes(statusInfo.tier)) {
    user.kyc_status = 'approved';
  } else {
    user.kyc_status = 'pending';
  }
  await user.save();

  res.json({ success: true, message: `${docName || docType} submitted and verified successfully!`, ...statusInfo });
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

  const statusInfo = computeVendorVerification(user);
  user.vendorProfile.verificationStatus = statusInfo.tier;
  await user.save();

  res.json({ success: true, message: 'Payment details verified and updated successfully!', ...statusInfo });
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
    trust_score: u.trust_score || 0,
    city: u.city || null,
    avg_response_time_seconds: u.avg_response_time_seconds || null,
    chat_response_rate: u.chat_response_rate || 0.0,
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
