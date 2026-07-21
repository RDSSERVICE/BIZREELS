const express = require('express');
const creatorController = require('../controllers/creatorController');
const { authenticate } = require('../middleware/auth');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { catchAsync } = require('../utils/helpers');

const router = express.Router();

/**
 * Helper to compute creator verification status & tier
 */
function computeCreatorVerification(user) {
  const cp = user.creatorProfile || {};
  const contactVerified = cp.contactVerified || {
    mobile: !!user.phone,
    whatsapp: false,
    email: !!user.email
  };
  const documents = cp.documents || {};
  const paymentDetails = cp.paymentDetails || {};

  const hasAadhaar = documents.aadhaar && documents.aadhaar.status === 'approved';
  const hasPan = documents.pan && documents.pan.status === 'approved';

  let totalPoints = 0;
  if (contactVerified.mobile) totalPoints += 20;
  if (contactVerified.whatsapp) totalPoints += 15;
  if (contactVerified.email) totalPoints += 15;
  if (hasAadhaar) totalPoints += 25;
  if (hasPan) totalPoints += 25;
  if (paymentDetails.upiVerified || (paymentDetails.bankAccount && paymentDetails.ifscVerified)) {
    totalPoints += 10;
  }

  const completionPercentage = Math.min(100, totalPoints);
  const isSubscribed = !!user.is_subscribed_verified;

  let tier = 'unverified';
  let badgeLabel = 'Unverified Creator';
  let badgeColor = '⚪';

  if (hasPan || hasAadhaar) {
    if (isSubscribed) {
      tier = 'pro_verified';
      badgeLabel = 'Pro Verified Creator';
      badgeColor = '🔵';
    } else {
      tier = 'verified_creator';
      badgeLabel = 'Verified Creator';
      badgeColor = '🟢';
    }
  } else if (contactVerified.mobile || contactVerified.email || paymentDetails.upiVerified) {
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

// ── CREATOR VERIFICATION ENDPOINTS ────────────────────────────

router.get('/me/verification-status', authenticate, catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  const statusInfo = computeCreatorVerification(user);
  res.json({ success: true, ...statusInfo });
}));

router.post('/me/verify-contact', authenticate, catchAsync(async (req, res) => {
  const { type, value } = req.body;
  if (!['mobile', 'whatsapp', 'email'].includes(type)) {
    throw ApiError.badRequest('Invalid contact verification type');
  }

  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  const currentCp = user.creatorProfile || {};
  const currentContacts = currentCp.contactVerified || {
    mobile: !!user.phone,
    whatsapp: false,
    email: !!user.email
  };

  currentContacts[type] = true;
  if (type === 'mobile' && value) currentCp.mobileNumber = value;
  if (type === 'whatsapp' && value) currentCp.whatsappNumber = value;
  if (type === 'email' && value) currentCp.email = value;

  currentCp.contactVerified = currentContacts;
  user.creatorProfile = currentCp;

  const statusInfo = computeCreatorVerification(user);
  user.creatorProfile.verificationStatus = statusInfo.tier;
  await user.save();

  res.json({ success: true, message: `${type} verified successfully!`, ...statusInfo });
}));

router.post('/me/verify-document', authenticate, catchAsync(async (req, res) => {
  const { docType, docNumber, frontUrl, backUrl, fileUrl, docName } = req.body;
  if (!docType) throw ApiError.badRequest('docType is required');

  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  const currentCp = user.creatorProfile || {};
  const currentDocs = currentCp.documents || {};
  const now = new Date();

  currentDocs[docType] = {
    docNumber: docNumber || currentDocs[docType]?.docNumber || '',
    frontUrl: frontUrl || currentDocs[docType]?.frontUrl || null,
    backUrl: backUrl || currentDocs[docType]?.backUrl || null,
    fileUrl: fileUrl || currentDocs[docType]?.fileUrl || null,
    status: 'approved',
    verifiedAt: now
  };

  currentCp.documents = currentDocs;
  user.creatorProfile = currentCp;

  const statusInfo = computeCreatorVerification(user);
  user.creatorProfile.verificationStatus = statusInfo.tier;
  if (['verified_creator', 'pro_verified'].includes(statusInfo.tier)) {
    user.kyc_status = 'approved';
  }
  await user.save();

  res.json({ success: true, message: `${docName || docType} verified successfully!`, ...statusInfo });
}));

router.post('/me/verify-payment', authenticate, catchAsync(async (req, res) => {
  const { upiId, bankAccount, accountHolderName, ifscCode, bankName, branchName } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  const currentCp = user.creatorProfile || {};
  const currentPayment = currentCp.paymentDetails || {};

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

  currentPayment.verifiedAt = new Date();

  currentCp.paymentDetails = currentPayment;
  user.creatorProfile = currentCp;

  const statusInfo = computeCreatorVerification(user);
  user.creatorProfile.verificationStatus = statusInfo.tier;
  await user.save();

  res.json({ success: true, message: 'Payment & payout details verified successfully!', ...statusInfo });
}));

/**
 * Creator Studio Routes — /api/v1/creator
 */

router.get('/dashboard', authenticate, creatorController.getDashboard);

router.get('/portfolio', authenticate, creatorController.getPortfolio);
router.post('/portfolio/reels', authenticate, creatorController.addPortfolioReel);
router.post('/portfolio/images', authenticate, creatorController.addPortfolioImage);
router.delete('/portfolio/:type/:id', authenticate, creatorController.deletePortfolioItem);

router.get('/pricing', authenticate, creatorController.getPricing);
router.patch('/pricing', authenticate, creatorController.updatePricing);

router.get('/availability', authenticate, creatorController.getAvailability);
router.patch('/availability', authenticate, creatorController.updateAvailability);

router.get('/orders', authenticate, creatorController.getOrders);
router.patch('/orders/:id/status', authenticate, creatorController.updateOrderStatus);

module.exports = router;

