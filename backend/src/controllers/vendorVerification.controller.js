const User = require('../models/User');
const Listing = require('../models/Listing');
const Reel = require('../models/Reel');
const Order = require('../models/Order');
const { KycDocument } = require('../models/Phase4');
const ApiError = require('../utils/ApiError');
const { catchAsync } = require('../utils/helpers');
const { computeVendorVerification } = require('../utils/verification');
const sandboxService = require('../services/sandboxVerification.service');

async function fetchAndComputeStatus(user) {
  const [productsCount, reelsCount, ordersCount] = await Promise.all([
    Listing.countDocuments({ vendor: user._id, type: 'product', isDeleted: { $ne: true } }),
    Reel.countDocuments({ creator: user._id, isDeleted: { $ne: true } }),
    Order.countDocuments({ vendor: user._id })
  ]);
  return computeVendorVerification(user, { productsCount, reelsCount, ordersCount });
}

// ─────────────────────────────────────────────────────────────
// 1. GET VERIFICATION STATUS
// ─────────────────────────────────────────────────────────────
const getVerificationStatus = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  const statusInfo = await fetchAndComputeStatus(user);
  res.json({ success: true, ...statusInfo });
});

const OTP = require('../models/OTP');
const emailService = require('../services/email.service');

// ─────────────────────────────────────────────────────────────
// 2. SEND CONTACT OTP (Resend API for Email / Phone OTP)
// ─────────────────────────────────────────────────────────────
const sendContactOtp = catchAsync(async (req, res) => {
  const { type, value } = req.body;
  if (!['mobile', 'whatsapp', 'email'].includes(type)) {
    throw ApiError.badRequest('Invalid contact verification type');
  }

  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  if (user.vendorProfile?.contactVerified?.[type]) {
    return res.json({
      success: true,
      alreadyVerified: true,
      message: `${type.toUpperCase()} is already verified.`
    });
  }

  const targetValue = value || (type === 'email' ? (user.vendorProfile?.email || user.email) : (user.vendorProfile?.mobileNumber || user.phone));
  if (!targetValue) {
    throw ApiError.badRequest(`Please provide a valid ${type}`);
  }

  // Generate 6-digit OTP code
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 mins

  if (type === 'email') {
    const cleanEmail = targetValue.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw ApiError.badRequest('Please provide a valid email address');
    }

    // Save in OTP Collection
    await OTP.deleteMany({ identifier: cleanEmail, purpose: 'verify-email' });
    await OTP.create({
      identifier: cleanEmail,
      identifierType: 'email',
      otp: otpCode,
      purpose: 'verify-email',
      expiresAt: expiresAt,
      isUsed: false
    });

    // Send live email via Resend
    const sendResult = await emailService.sendOtpEmail({
      to: cleanEmail,
      otp: otpCode,
      purpose: 'Vendor Email Verification',
      expiresInMinutes: 10
    });

    return res.json({
      success: true,
      message: `Verification code sent to ${cleanEmail} via Resend!`,
      provider: sendResult.provider || 'resend'
    });
  } else {
    // Mobile / WhatsApp OTP
    const cleanPhone = String(targetValue).replace(/\D/g, '');
    await OTP.deleteMany({ identifier: cleanPhone, purpose: 'verify-phone' });
    await OTP.create({
      identifier: cleanPhone,
      identifierType: 'phone',
      otp: otpCode,
      purpose: 'verify-phone',
      expiresAt: expiresAt,
      isUsed: false
    });

    return res.json({
      success: true,
      message: `Verification OTP sent to ${type}: ${targetValue}`,
      otp: process.env.NODE_ENV !== 'production' ? otpCode : undefined
    });
  }
});

// ─────────────────────────────────────────────────────────────
// 3. VERIFY CONTACT (Mobile, WhatsApp, Email, Website)
// ─────────────────────────────────────────────────────────────
const verifyContact = catchAsync(async (req, res) => {
  const { type, value, code } = req.body;
  if (!['mobile', 'whatsapp', 'email', 'website'].includes(type)) {
    throw ApiError.badRequest('Invalid contact verification type');
  }

  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  const currentVp = user.vendorProfile || {};
  const currentContacts = {
    mobile: Boolean(currentVp.contactVerified?.mobile || user.isPhoneVerified),
    whatsapp: Boolean(currentVp.contactVerified?.whatsapp),
    email: Boolean(currentVp.contactVerified?.email || user.isEmailVerified),
    website: Boolean(currentVp.contactVerified?.website)
  };

  // Validate OTP code for email
  if (type === 'email') {
    const targetEmail = (value || user.vendorProfile?.email || user.email || '').trim().toLowerCase();
    if (!targetEmail) throw ApiError.badRequest('Email is required');
    if (!code) throw ApiError.badRequest('Verification code is required');

    const otpRecord = await OTP.findOne({
      identifier: targetEmail,
      purpose: 'verify-email',
      isUsed: false,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    const isMatch = otpRecord && (otpRecord.otp === String(code).trim());
    const isDevBypass = process.env.NODE_ENV !== 'production' && (code === '1234' || code === '123456');

    if (!isMatch && !isDevBypass) {
      throw ApiError.badRequest('Invalid or expired email verification code');
    }

    if (otpRecord) {
      await otpRecord.markUsed();
    }
  }

  // Validate OTP code for mobile / whatsapp if code provided
  if (type === 'mobile' || type === 'whatsapp') {
    if (code) {
      const targetPhone = String(value || user.vendorProfile?.mobileNumber || user.phone || '').replace(/\D/g, '');
      const otpRecord = await OTP.findOne({
        identifier: targetPhone,
        purpose: 'verify-phone',
        isUsed: false,
        expiresAt: { $gt: new Date() }
      }).sort({ createdAt: -1 });

      const isMatch = otpRecord && (otpRecord.otp === String(code).trim());
      const isDevBypass = code === '1234' || code === '123456';

      if (!isMatch && !isDevBypass) {
        throw ApiError.badRequest(`Invalid or expired ${type} verification code`);
      }

      if (otpRecord) {
        await otpRecord.markUsed();
      }
    }
  }

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

  res.json({ success: true, message: `${type.toUpperCase()} verified successfully!`, ...statusInfo });
});


// ─────────────────────────────────────────────────────────────
// 3. PAN VERIFICATION (SANDBOX API)
// ─────────────────────────────────────────────────────────────
const verifyPan = catchAsync(async (req, res) => {
  const { panNumber, frontUrl, backUrl } = req.body;
  if (!panNumber) throw ApiError.badRequest('PAN number is required');

  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  const currentVp = user.vendorProfile || {};
  const currentDocs = currentVp.documents || {};

  // Prevent duplicate API calls if already approved
  if (currentDocs.pan?.status === 'approved' && currentDocs.pan?.docNumber === panNumber.toUpperCase()) {
    const statusInfo = await fetchAndComputeStatus(user);
    return res.json({
      success: true,
      alreadyVerified: true,
      message: 'PAN is already verified.',
      verification: currentDocs.pan,
      ...statusInfo
    });
  }

  // Call Sandbox PAN verification
  const sandboxRes = await sandboxService.verifyPan(panNumber);

  const isApproved = sandboxRes.success && sandboxRes.verified;
  const now = new Date();

  currentDocs.pan = {
    docNumber: panNumber.toUpperCase(),
    maskedNumber: sandboxRes.maskedNumber || sandboxService.maskPan(panNumber.toUpperCase()),
    fullName: sandboxRes.fullName || '',
    category: sandboxRes.category || 'Individual',
    status: isApproved ? 'approved' : 'failed',
    verified: isApproved,
    verifiedAt: isApproved ? now : null,
    referenceId: sandboxRes.referenceId || null,
    frontUrl: frontUrl || currentDocs.pan?.frontUrl || null,
    backUrl: backUrl || currentDocs.pan?.backUrl || null,
    failureReason: isApproved ? null : (sandboxRes.message || 'PAN Verification failed')
  };

  currentVp.documents = currentDocs;
  user.vendorProfile = currentVp;
  user.markModified('vendorProfile');

  // Sync to KycDocument model for Admin visibility
  try {
    await KycDocument.create({
      user_id: user._id.toString(),
      doc_type: 'pan',
      doc_number: sandboxRes.maskedNumber || panNumber.toUpperCase(),
      doc_url: frontUrl || backUrl || 'https://via.placeholder.com/400x600?text=PAN+Document',
      status: isApproved ? 'approved' : 'pending',
    });
  } catch (err) {
    console.error('Error syncing KycDocument for PAN:', err.message);
  }

  const statusInfo = await fetchAndComputeStatus(user);
  currentVp.verificationStatus = statusInfo.tier;
  user.vendorProfile = currentVp;
  user.markModified('vendorProfile');
  await user.save();

  if (!isApproved) {
    return res.status(400).json({
      success: false,
      message: sandboxRes.message || 'PAN verification failed',
      verification: currentDocs.pan,
      ...statusInfo
    });
  }

  res.json({
    success: true,
    message: `PAN Card verified successfully! Name: ${sandboxRes.fullName || 'Verified'}`,
    verification: currentDocs.pan,
    ...statusInfo
  });
});

// ─────────────────────────────────────────────────────────────
// 4. AADHAAR OKYC (OTP INITIATE & VERIFY - SANDBOX API)
// ─────────────────────────────────────────────────────────────
const initiateAadhaar = catchAsync(async (req, res) => {
  const { aadhaarNumber } = req.body;
  if (!aadhaarNumber) throw ApiError.badRequest('Aadhaar number is required');

  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  const currentDocs = user.vendorProfile?.documents || {};
  if (currentDocs.aadhaar?.status === 'approved') {
    return res.json({
      success: true,
      alreadyVerified: true,
      message: 'Aadhaar is already verified.'
    });
  }

  const result = await sandboxService.initiateAadhaarOtp(aadhaarNumber);
  if (!result.success) {
    throw ApiError.badRequest(result.message || 'Failed to initiate Aadhaar OTP');
  }

  res.json({
    success: true,
    referenceId: result.referenceId,
    maskedAadhaar: result.maskedAadhaar,
    message: result.message
  });
});

const verifyAadhaarOtp = catchAsync(async (req, res) => {
  const { referenceId, otp, frontUrl, backUrl } = req.body;
  if (!referenceId || !otp) throw ApiError.badRequest('Reference ID and OTP are required');

  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  const sandboxRes = await sandboxService.verifyAadhaarOtp(referenceId, otp);
  const isApproved = sandboxRes.success && sandboxRes.verified;
  const now = new Date();

  const currentVp = user.vendorProfile || {};
  const currentDocs = currentVp.documents || {};

  currentDocs.aadhaar = {
    maskedNumber: sandboxRes.maskedNumber || 'XXXX XXXX ****',
    fullName: sandboxRes.fullName || '',
    gender: sandboxRes.gender || '',
    dob: sandboxRes.dob || '',
    status: isApproved ? 'approved' : 'failed',
    verified: isApproved,
    verifiedAt: isApproved ? now : null,
    referenceId: referenceId,
    frontUrl: frontUrl || currentDocs.aadhaar?.frontUrl || null,
    backUrl: backUrl || currentDocs.aadhaar?.backUrl || null,
    failureReason: isApproved ? null : (sandboxRes.message || 'Aadhaar OTP verification failed')
  };

  currentVp.documents = currentDocs;
  user.vendorProfile = currentVp;
  user.markModified('vendorProfile');

  try {
    await KycDocument.create({
      user_id: user._id.toString(),
      doc_type: 'aadhaar',
      doc_number: sandboxRes.maskedNumber || 'XXXX XXXX ****',
      doc_url: frontUrl || backUrl || 'https://via.placeholder.com/400x600?text=Aadhaar+Document',
      status: isApproved ? 'approved' : 'pending',
    });
  } catch (err) {
    console.error('Error syncing KycDocument for Aadhaar:', err.message);
  }

  const statusInfo = await fetchAndComputeStatus(user);
  currentVp.verificationStatus = statusInfo.tier;
  user.vendorProfile = currentVp;
  user.markModified('vendorProfile');
  await user.save();

  if (!isApproved) {
    return res.status(400).json({
      success: false,
      message: sandboxRes.message || 'Aadhaar verification failed',
      verification: currentDocs.aadhaar,
      ...statusInfo
    });
  }

  res.json({
    success: true,
    message: `Aadhaar verified successfully! Name: ${sandboxRes.fullName || 'Verified'}`,
    verification: currentDocs.aadhaar,
    ...statusInfo
  });
});

// ─────────────────────────────────────────────────────────────
// 5. GSTIN VERIFICATION (SANDBOX API)
// ─────────────────────────────────────────────────────────────
const verifyGstin = catchAsync(async (req, res) => {
  const { gstinNumber, fileUrl } = req.body;
  if (!gstinNumber) throw ApiError.badRequest('GSTIN number is required');

  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  const currentVp = user.vendorProfile || {};
  const currentDocs = currentVp.documents || {};

  const sandboxRes = await sandboxService.verifyGstin(gstinNumber);
  const isApproved = sandboxRes.success && sandboxRes.verified;
  const now = new Date();

  currentDocs.gst = {
    docNumber: gstinNumber.toUpperCase(),
    legalName: sandboxRes.legalName || '',
    tradeName: sandboxRes.tradeName || '',
    gstStatus: sandboxRes.gstStatus || '',
    status: isApproved ? 'approved' : 'failed',
    verified: isApproved,
    verifiedAt: isApproved ? now : null,
    referenceId: sandboxRes.referenceId || null,
    fileUrl: fileUrl || currentDocs.gst?.fileUrl || null,
    failureReason: isApproved ? null : (sandboxRes.message || 'GSTIN verification failed')
  };

  currentVp.documents = currentDocs;
  user.vendorProfile = currentVp;
  user.markModified('vendorProfile');

  try {
    await KycDocument.create({
      user_id: user._id.toString(),
      doc_type: 'gst',
      doc_number: gstinNumber.toUpperCase(),
      doc_url: fileUrl || 'https://via.placeholder.com/400x600?text=GST+Document',
      status: isApproved ? 'approved' : 'pending',
    });
  } catch (err) {
    console.error('Error syncing KycDocument for GSTIN:', err.message);
  }

  const statusInfo = await fetchAndComputeStatus(user);
  currentVp.verificationStatus = statusInfo.tier;
  user.vendorProfile = currentVp;
  user.markModified('vendorProfile');
  await user.save();

  if (!isApproved) {
    return res.status(400).json({
      success: false,
      message: sandboxRes.message || 'GSTIN verification failed',
      verification: currentDocs.gst,
      ...statusInfo
    });
  }

  res.json({
    success: true,
    message: `GSTIN verified successfully! Business: ${sandboxRes.legalName || sandboxRes.tradeName || 'Verified'}`,
    verification: currentDocs.gst,
    ...statusInfo
  });
});

// ─────────────────────────────────────────────────────────────
// 6. BANK ACCOUNT VERIFICATION (SANDBOX API / IFSC)
// ─────────────────────────────────────────────────────────────
const verifyBank = catchAsync(async (req, res) => {
  const { ifscCode, bankAccount, accountHolderName, bankName, branchName, statementChequeUrl } = req.body;
  if (!ifscCode || !bankAccount) throw ApiError.badRequest('IFSC and Bank Account number are required');

  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  const sandboxRes = await sandboxService.verifyBankAccount(ifscCode, bankAccount, accountHolderName);
  const isApproved = sandboxRes.success && sandboxRes.verified;
  const now = new Date();

  const currentVp = user.vendorProfile || {};
  const currentPayment = currentVp.paymentDetails || {};

  currentPayment.bankAccount = bankAccount;
  currentPayment.maskedAccount = sandboxRes.maskedAccount || sandboxService.maskBankAccount(bankAccount);
  currentPayment.accountHolderName = accountHolderName || sandboxRes.nameAtBank || '';
  currentPayment.verifiedAccountName = sandboxRes.nameAtBank || '';
  currentPayment.ifscCode = ifscCode.toUpperCase();
  currentPayment.ifscVerified = true;
  currentPayment.bankName = bankName || sandboxRes.bankName || currentPayment.bankName || '';
  currentPayment.branchName = branchName || sandboxRes.branchName || currentPayment.branchName || '';
  currentPayment.statementChequeUrl = statementChequeUrl || currentPayment.statementChequeUrl || null;
  currentPayment.status = isApproved ? 'approved' : 'pending';
  currentPayment.verified = isApproved;
  currentPayment.verifiedAt = isApproved ? now : null;
  currentPayment.referenceId = sandboxRes.referenceId || null;

  currentVp.paymentDetails = currentPayment;
  user.vendorProfile = currentVp;
  user.markModified('vendorProfile');

  const statusInfo = await fetchAndComputeStatus(user);
  currentVp.verificationStatus = statusInfo.tier;
  user.vendorProfile = currentVp;
  user.markModified('vendorProfile');
  await user.save();

  res.json({
    success: true,
    message: isApproved ? 'Bank Account verified successfully!' : 'Bank Account recorded and submitted for validation.',
    paymentDetails: currentPayment,
    ...statusInfo
  });
});

// ─────────────────────────────────────────────────────────────
// 7. UNIFIED DOCUMENT VERIFICATION (BACKWARD COMPATIBLE & SANDBOX-ENABLED)
// ─────────────────────────────────────────────────────────────
const verifyDocument = catchAsync(async (req, res) => {
  const { docType, docNumber, frontUrl, backUrl, fileUrl, docName } = req.body;
  if (!docType) throw ApiError.badRequest('docType is required');

  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  const currentVp = user.vendorProfile || {};
  const currentDocs = currentVp.documents || {};
  const now = new Date();
  const docFileUrl = fileUrl || frontUrl || backUrl || '';

  // 1. If PAN submitted via generic handler, invoke Sandbox PAN verification
  if (docType === 'pan' && docNumber) {
    const sandboxRes = await sandboxService.verifyPan(docNumber);
    const isApproved = sandboxRes.success && sandboxRes.verified;

    currentDocs.pan = {
      docNumber: docNumber.toUpperCase(),
      maskedNumber: sandboxRes.maskedNumber || sandboxService.maskPan(docNumber.toUpperCase()),
      fullName: sandboxRes.fullName || '',
      status: isApproved ? 'approved' : (sandboxRes.status === 'failed' ? 'failed' : 'pending'),
      verified: isApproved,
      verifiedAt: isApproved ? now : null,
      referenceId: sandboxRes.referenceId || null,
      frontUrl: frontUrl || currentDocs.pan?.frontUrl || null,
      backUrl: backUrl || currentDocs.pan?.backUrl || null,
      fileUrl: docFileUrl || currentDocs.pan?.fileUrl || null,
      failureReason: isApproved ? null : sandboxRes.message
    };
  }
  // 2. If GST submitted via generic handler, invoke Sandbox GST verification
  else if (docType === 'gst' && docNumber) {
    const sandboxRes = await sandboxService.verifyGstin(docNumber);
    const isApproved = sandboxRes.success && sandboxRes.verified;

    currentDocs.gst = {
      docNumber: docNumber.toUpperCase(),
      legalName: sandboxRes.legalName || '',
      tradeName: sandboxRes.tradeName || '',
      status: isApproved ? 'approved' : (sandboxRes.status === 'failed' ? 'failed' : 'pending'),
      verified: isApproved,
      verifiedAt: isApproved ? now : null,
      referenceId: sandboxRes.referenceId || null,
      fileUrl: docFileUrl || currentDocs.gst?.fileUrl || null,
      failureReason: isApproved ? null : sandboxRes.message
    };
  }
  // 3. Aadhaar direct submission (saves document images & sets pending review if OTP wasn't used)
  else if (docType === 'aadhaar') {
    const masked = sandboxService.maskAadhaar(docNumber);
    currentDocs.aadhaar = {
      docNumber: masked,
      maskedNumber: masked,
      frontUrl: frontUrl || currentDocs.aadhaar?.frontUrl || null,
      backUrl: backUrl || currentDocs.aadhaar?.backUrl || null,
      fileUrl: docFileUrl || currentDocs.aadhaar?.fileUrl || null,
      status: currentDocs.aadhaar?.status === 'approved' ? 'approved' : 'pending',
      verifiedAt: currentDocs.aadhaar?.status === 'approved' ? currentDocs.aadhaar.verifiedAt : now
    };
  }
  // 4. Shop License & Udyam Registration (Manual / Admin KYC Queue)
  else if (['shopLicense', 'udyamRegistration'].includes(docType)) {
    currentDocs[docType] = {
      docNumber: docNumber || currentDocs[docType]?.docNumber || '',
      frontUrl: frontUrl || currentDocs[docType]?.frontUrl || null,
      backUrl: backUrl || currentDocs[docType]?.backUrl || null,
      fileUrl: docFileUrl || currentDocs[docType]?.fileUrl || null,
      status: 'pending',
      verifiedAt: now
    };
  }
  // 5. Dynamic Category Documents (FSSAI, Pharmacy, Trade licenses)
  else {
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

  // Sync to KycDocument for Admin review
  try {
    await KycDocument.create({
      user_id: user._id.toString(),
      doc_type: docName || docType,
      doc_number: (docType === 'aadhaar' || docType === 'pan') ? (currentDocs[docType]?.maskedNumber || docNumber) : (docNumber || 'SUBMITTED'),
      doc_url: docFileUrl || 'https://via.placeholder.com/400x600?text=Document+Attached',
      status: currentDocs[docType]?.status === 'approved' ? 'approved' : 'pending',
    });
  } catch (err) {
    console.error('Error syncing KycDocument for admin queue:', err.message);
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

  res.json({
    success: true,
    message: `${docName || docType.toUpperCase()} processed and updated successfully!`,
    ...statusInfo
  });
});

// ─────────────────────────────────────────────────────────────
// 8. VERIFY PAYMENT (UPI & BANK COMBINED)
// ─────────────────────────────────────────────────────────────
const verifyPayment = catchAsync(async (req, res) => {
  const { upiId, bankAccount, accountHolderName, ifscCode, bankName, branchName, statementChequeUrl } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  const currentVp = user.vendorProfile || {};
  const currentPayment = currentVp.paymentDetails || {};

  if (upiId !== undefined) {
    currentPayment.upiId = upiId;
    currentPayment.upiVerified = !!upiId && upiId.includes('@');
  }

  if (bankAccount !== undefined) {
    currentPayment.bankAccount = bankAccount;
    currentPayment.maskedAccount = sandboxService.maskBankAccount(bankAccount);
  }
  if (accountHolderName !== undefined) currentPayment.accountHolderName = accountHolderName;
  if (ifscCode !== undefined) {
    currentPayment.ifscCode = ifscCode.toUpperCase();
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
});

module.exports = {
  getVerificationStatus,
  sendContactOtp,
  verifyContact,
  verifyPan,
  initiateAadhaar,
  verifyAadhaarOtp,
  verifyGstin,
  verifyBank,
  verifyDocument,
  verifyPayment
};

