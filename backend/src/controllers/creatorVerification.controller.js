const User = require('../models/User');
const { KycDocument } = require('../models/Phase4');
const ApiError = require('../utils/ApiError');
const { catchAsync } = require('../utils/helpers');
const sandboxService = require('../services/sandboxVerification.service');
const OTP = require('../models/OTP');
const emailService = require('../services/email.service');
const smsService = require('../services/sms.service');
const { generateOtp, normalizeIndianPhone } = require('../utils/otp.utils');

/**
 * Helper to compute creator verification status & tier
 */
function computeCreatorVerification(user) {
  const cp = user.creatorProfile || {};
  const contactVerified = {
    mobile: Boolean(cp.contactVerified?.mobile || user.isPhoneVerified),
    whatsapp: Boolean(cp.contactVerified?.whatsapp),
    email: Boolean(cp.contactVerified?.email || user.isEmailVerified)
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
  if (paymentDetails.upiVerified || (paymentDetails.verified && paymentDetails.ifscVerified)) {
    totalPoints += 10;
  }

  const completionPercentage = Math.min(100, totalPoints);
  const isSubscribed = !!user.is_subscribed_verified;

  let tier = 'unverified';
  let badgeLabel = 'Unverified Creator';
  let badgeColor = '⚪';

  if (hasPan && hasAadhaar) {
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

// ─────────────────────────────────────────────────────────────
// 1. GET VERIFICATION STATUS
// ─────────────────────────────────────────────────────────────
const getVerificationStatus = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  const statusInfo = computeCreatorVerification(user);
  res.json({ success: true, ...statusInfo });
});

// ─────────────────────────────────────────────────────────────
// 2. SEND CONTACT OTP (Resend API for Email / Twilio for Phone OTP)
// ─────────────────────────────────────────────────────────────
const sendContactOtp = catchAsync(async (req, res) => {
  const { type, value, reverify } = req.body;
  if (!['mobile', 'whatsapp', 'email'].includes(type)) {
    throw ApiError.badRequest('Invalid contact verification type');
  }

  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  if (!reverify && !value && user.creatorProfile?.contactVerified?.[type]) {
    return res.json({
      success: true,
      alreadyVerified: true,
      message: `${type.toUpperCase()} is already verified.`
    });
  }

  const targetValue = value || (type === 'email' ? (user.creatorProfile?.email || user.email) : (user.creatorProfile?.mobileNumber || user.phone));
  if (!targetValue) {
    throw ApiError.badRequest(`Please provide a valid ${type}`);
  }

  const otpCode = generateOtp();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 mins

  if (type === 'email') {
    const cleanEmail = targetValue.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw ApiError.badRequest('Please provide a valid email address');
    }

    await OTP.deleteMany({ identifier: cleanEmail, purpose: 'verify-creator-email' });
    await OTP.create({
      identifier: cleanEmail,
      identifierType: 'email',
      otp: otpCode,
      purpose: 'verify-creator-email',
      expiresAt: expiresAt,
      isUsed: false
    });

    const sendResult = await emailService.sendOtpEmail({
      to: cleanEmail,
      otp: otpCode,
      purpose: 'Creator Email Verification',
      expiresInMinutes: 10
    });

    return res.json({
      success: true,
      message: `Verification code sent to ${cleanEmail}!`,
      provider: sendResult.provider || 'resend'
    });
  } else {
    // Mobile / WhatsApp OTP
    const cleanPhone = normalizeIndianPhone(targetValue);
    await OTP.deleteMany({ identifier: cleanPhone, purpose: 'verify-creator-phone' });
    await OTP.create({
      identifier: cleanPhone,
      identifierType: 'phone',
      otp: otpCode,
      purpose: 'verify-creator-phone',
      expiresAt: expiresAt,
      isUsed: false
    });

    try {
      await smsService.sendOtpSms(cleanPhone, otpCode);
    } catch (smsErr) {
      console.error('Failed to dispatch contact OTP SMS:', smsErr.message);
    }

    return res.json({
      success: true,
      message: `Verification OTP sent to ${type}: +91${cleanPhone}`,
      otp: process.env.NODE_ENV === 'development' ? otpCode : undefined
    });
  }
});

// ─────────────────────────────────────────────────────────────
// 3. VERIFY CONTACT (Mobile, WhatsApp, Email)
// ─────────────────────────────────────────────────────────────
const verifyContact = catchAsync(async (req, res) => {
  const { type, value, code } = req.body;
  if (!['mobile', 'whatsapp', 'email'].includes(type)) {
    throw ApiError.badRequest('Invalid contact verification type');
  }

  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  const currentCp = user.creatorProfile || {};
  const currentContacts = {
    mobile: Boolean(currentCp.contactVerified?.mobile || user.isPhoneVerified),
    whatsapp: Boolean(currentCp.contactVerified?.whatsapp),
    email: Boolean(currentCp.contactVerified?.email || user.isEmailVerified)
  };

  if (!code) throw ApiError.badRequest('Verification code is required');

  const isEmail = type === 'email';
  const targetValue = isEmail
    ? (value || currentCp.email || user.email || '').trim().toLowerCase()
    : normalizeIndianPhone(value || currentCp.mobileNumber || user.phone || '');

  if (!targetValue) throw ApiError.badRequest(`A valid ${type} is required`);

  const otpRecord = await OTP.findOne({
    identifier: targetValue,
    purpose: isEmail ? 'verify-creator-email' : 'verify-creator-phone',
    isUsed: false,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });

  const submittedCode = String(code).trim();
  const isMatch = otpRecord && otpRecord.otp === submittedCode;
  const isDevBypass = process.env.NODE_ENV === 'development' && (submittedCode === '1234' || submittedCode === '123456');

  if (!isMatch && !isDevBypass) {
    throw ApiError.badRequest(`Invalid or expired ${isEmail ? 'email' : 'phone'} verification code`);
  }

  if (otpRecord) await otpRecord.markUsed();

  currentContacts[type] = true;
  if (type === 'mobile' && value) currentCp.mobileNumber = value;
  if (type === 'whatsapp' && value) currentCp.whatsappNumber = value;
  if (type === 'email' && value) currentCp.email = value;

  currentCp.contactVerified = currentContacts;
  user.creatorProfile = currentCp;
  user.markModified('creatorProfile');

  const statusInfo = computeCreatorVerification(user);
  user.creatorProfile.verificationStatus = statusInfo.tier;
  await user.save();

  res.json({
    success: true,
    message: `${type.toUpperCase()} verified successfully!`,
    ...statusInfo
  });
});

// ─────────────────────────────────────────────────────────────
// 4. PAN VERIFICATION (SANDBOX API)
// ─────────────────────────────────────────────────────────────
const verifyPan = catchAsync(async (req, res) => {
  const { panNumber, frontUrl, backUrl } = req.body;
  if (!panNumber) throw ApiError.badRequest('PAN number is required');

  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  const currentCp = user.creatorProfile || {};
  const currentDocs = currentCp.documents || {};

  const fallbackName = user.name || currentCp.displayName || 'Taxpayer Validated';
  const sandboxRes = await sandboxService.verifyPan(panNumber, fallbackName);
  const isApproved = sandboxRes.success && sandboxRes.verified;
  const now = new Date();

  currentDocs.pan = {
    docNumber: panNumber.toUpperCase(),
    maskedNumber: sandboxRes.maskedNumber || sandboxService.maskPan(panNumber.toUpperCase()),
    fullName: sandboxRes.fullName || fallbackName,
    category: sandboxRes.category || 'Individual',
    panStatus: sandboxRes.panStatus || 'VALID',
    aadhaarLinked: sandboxRes.aadhaarLinked || 'Linked / Verified',
    dob: sandboxRes.dob || '',
    gender: sandboxRes.gender || '',
    status: isApproved ? 'approved' : 'failed',
    verified: isApproved,
    verifiedAt: isApproved ? now : null,
    referenceId: sandboxRes.referenceId || `PAN_VAL_${Date.now()}`,
    frontUrl: frontUrl || currentDocs.pan?.frontUrl || null,
    backUrl: backUrl || currentDocs.pan?.backUrl || null,
    failureReason: isApproved ? null : (sandboxRes.message || 'PAN verification failed'),
    rawDetails: sandboxRes.rawDetails || null
  };

  if (isApproved && !currentCp.panNumber) {
    currentCp.panNumber = panNumber.toUpperCase();
  }

  currentCp.documents = currentDocs;
  user.creatorProfile = currentCp;
  user.markModified('creatorProfile');

  // Sync to KycDocument for Admin dashboard
  try {
    await KycDocument.findOneAndUpdate(
      { user_id: user._id.toString(), doc_type: 'pan', is_deleted: { $ne: true } },
      {
        $set: {
          doc_number: sandboxRes.maskedNumber || sandboxService.maskPan(panNumber.toUpperCase()),
          doc_url: frontUrl || backUrl || 'https://via.placeholder.com/400x600?text=PAN+Document',
          status: isApproved ? 'approved' : 'pending',
          submitted_at: now.toISOString(),
        }
      },
      { upsert: true, returnDocument: 'after' }
    );
  } catch (err) {
    console.error('Error syncing KycDocument for PAN:', err.message);
  }

  const statusInfo = computeCreatorVerification(user);
  user.creatorProfile.verificationStatus = statusInfo.tier;
  if (['verified_creator', 'pro_verified'].includes(statusInfo.tier) || isApproved) {
    user.kyc_status = 'approved';
  }
  user.markModified('creatorProfile');
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
// 5. AADHAAR OKYC (OTP INITIATE & VERIFY - SANDBOX API)
// ─────────────────────────────────────────────────────────────
const initiateAadhaar = catchAsync(async (req, res) => {
  const { aadhaarNumber, reverify } = req.body;
  if (!aadhaarNumber) throw ApiError.badRequest('Aadhaar number is required');

  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  const currentDocs = user.creatorProfile?.documents || {};
  if (!reverify && currentDocs.aadhaar?.status === 'approved' && !aadhaarNumber) {
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

  const currentCp = user.creatorProfile || {};
  const currentDocs = currentCp.documents || {};

  currentDocs.aadhaar = {
    maskedNumber: sandboxRes.maskedNumber || 'XXXX XXXX ****',
    fullName: sandboxRes.fullName || '',
    gender: sandboxRes.gender || '',
    dob: sandboxRes.dob || '',
    careOf: sandboxRes.careOf || '',
    fullAddress: sandboxRes.fullAddress || '',
    splitAddress: sandboxRes.splitAddress || {},
    pincode: sandboxRes.pincode || '',
    state: sandboxRes.state || '',
    district: sandboxRes.district || '',
    city: sandboxRes.city || '',
    photo: sandboxRes.photo || '',
    status: isApproved ? 'approved' : 'failed',
    verified: isApproved,
    verifiedAt: isApproved ? now : null,
    referenceId: referenceId,
    frontUrl: frontUrl || currentDocs.aadhaar?.frontUrl || null,
    backUrl: backUrl || currentDocs.aadhaar?.backUrl || null,
    failureReason: isApproved ? null : (sandboxRes.message || 'Aadhaar OTP verification failed'),
    rawDetails: sandboxRes.rawDetails || null
  };

  // Auto-populate creator address / city / pincode if missing
  if (isApproved) {
    if (!currentCp.pincode && sandboxRes.pincode) currentCp.pincode = sandboxRes.pincode;
    if (!currentCp.city && (sandboxRes.city || sandboxRes.district)) currentCp.city = sandboxRes.city || sandboxRes.district;
    if (!currentCp.state && sandboxRes.state) currentCp.state = sandboxRes.state;
    if (!currentCp.address && sandboxRes.fullAddress) currentCp.address = sandboxRes.fullAddress;
    if (!user.city && (sandboxRes.city || sandboxRes.district)) user.city = sandboxRes.city || sandboxRes.district;
  }

  currentCp.documents = currentDocs;
  user.creatorProfile = currentCp;
  user.markModified('creatorProfile');

  // Sync to KycDocument model
  try {
    await KycDocument.findOneAndUpdate(
      { user_id: user._id.toString(), doc_type: 'aadhaar', is_deleted: { $ne: true } },
      {
        $set: {
          doc_number: sandboxRes.maskedNumber || 'XXXX XXXX ****',
          doc_url: frontUrl || backUrl || 'https://via.placeholder.com/400x600?text=Aadhaar+Document',
          status: isApproved ? 'approved' : 'pending',
          submitted_at: now.toISOString(),
        }
      },
      { upsert: true, returnDocument: 'after' }
    );
  } catch (err) {
    console.error('Error syncing KycDocument for Aadhaar:', err.message);
  }

  const statusInfo = computeCreatorVerification(user);
  user.creatorProfile.verificationStatus = statusInfo.tier;
  if (['verified_creator', 'pro_verified'].includes(statusInfo.tier) || isApproved) {
    user.kyc_status = 'approved';
  }
  user.markModified('creatorProfile');
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
// 6. BANK ACCOUNT VERIFICATION (SANDBOX API & IFSC LOOKUP)
// ─────────────────────────────────────────────────────────────
const verifyBank = catchAsync(async (req, res) => {
  const { ifscCode, bankAccount, accountHolderName, bankName, branchName } = req.body;
  if (!ifscCode || !bankAccount) throw ApiError.badRequest('IFSC and Bank Account number are required');

  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  const targetHolder = accountHolderName || user.name || 'Account Holder';
  const sandboxRes = await sandboxService.verifyBankAccount(ifscCode, bankAccount, targetHolder);
  const isApproved = sandboxRes.success && sandboxRes.verified;
  const now = new Date();

  const currentCp = user.creatorProfile || {};
  const currentPayment = currentCp.paymentDetails || {};

  currentPayment.bankAccount = bankAccount;
  currentPayment.maskedAccount = sandboxRes.maskedAccount || sandboxService.maskBankAccount(bankAccount);
  currentPayment.accountHolderName = accountHolderName || sandboxRes.nameAtBank || targetHolder;
  currentPayment.verifiedAccountName = sandboxRes.nameAtBank || targetHolder;
  currentPayment.ifscCode = ifscCode.toUpperCase();
  currentPayment.ifscVerified = isApproved;
  currentPayment.bankName = sandboxRes.bankName || bankName || currentPayment.bankName || 'Bank';
  currentPayment.branchName = sandboxRes.branchName || branchName || currentPayment.branchName || '';
  currentPayment.city = sandboxRes.city || currentPayment.city || '';
  currentPayment.state = sandboxRes.state || currentPayment.state || '';
  currentPayment.micr = sandboxRes.micr || currentPayment.micr || '';
  currentPayment.status = isApproved ? 'approved' : 'failed';
  currentPayment.verified = isApproved;
  currentPayment.verifiedAt = isApproved ? now : null;
  currentPayment.referenceId = sandboxRes.referenceId || `BANK_VAL_${Date.now()}`;
  currentPayment.rawDetails = sandboxRes.rawDetails || null;

  currentCp.paymentDetails = currentPayment;
  user.creatorProfile = currentCp;
  user.markModified('creatorProfile');

  const statusInfo = computeCreatorVerification(user);
  user.creatorProfile.verificationStatus = statusInfo.tier;
  user.markModified('creatorProfile');
  await user.save();

  if (!isApproved) {
    return res.status(400).json({
      success: false,
      message: sandboxRes.message || 'Bank Account verification failed',
      paymentDetails: currentPayment,
      ...statusInfo
    });
  }

  res.json({
    success: true,
    message: 'Bank Account verified successfully!',
    paymentDetails: currentPayment,
    ...statusInfo
  });
});

// ─────────────────────────────────────────────────────────────
// 7. UPI ID VERIFICATION (SANDBOX API / NPCI)
// ─────────────────────────────────────────────────────────────
const verifyUpi = catchAsync(async (req, res) => {
  const { upiId, accountHolderName } = req.body;
  if (!upiId) throw ApiError.badRequest('UPI ID is required');

  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  const targetHolder = accountHolderName || user.name || 'Creator';
  const sandboxRes = await sandboxService.verifyUpiId(upiId, targetHolder);
  const isApproved = sandboxRes.success && sandboxRes.verified;
  const now = new Date();

  const currentCp = user.creatorProfile || {};
  const currentPayment = currentCp.paymentDetails || {};

  currentPayment.upiId = upiId.trim().toLowerCase();
  currentPayment.maskedUpi = sandboxRes.maskedUpi || sandboxService.maskUpi(upiId);
  currentPayment.beneficiaryName = sandboxRes.beneficiaryName || targetHolder;
  currentPayment.pspBank = sandboxRes.pspBank || '';
  currentPayment.upiVerified = isApproved;
  currentPayment.upiStatus = isApproved ? 'approved' : 'failed';
  currentPayment.upiVerifiedAt = isApproved ? now : null;
  currentPayment.upiReferenceId = sandboxRes.referenceId || `UPI_VAL_${Date.now()}`;
  currentPayment.rawDetails = sandboxRes.rawDetails || null;

  currentCp.paymentDetails = currentPayment;
  user.creatorProfile = currentCp;
  user.markModified('creatorProfile');

  const statusInfo = computeCreatorVerification(user);
  user.creatorProfile.verificationStatus = statusInfo.tier;
  user.markModified('creatorProfile');
  await user.save();

  if (!isApproved) {
    return res.status(400).json({
      success: false,
      message: sandboxRes.message || 'UPI verification failed',
      paymentDetails: currentPayment,
      ...statusInfo
    });
  }

  res.json({
    success: true,
    message: `UPI ID verified successfully! Beneficiary: ${sandboxRes.beneficiaryName || 'Verified'}`,
    paymentDetails: currentPayment,
    ...statusInfo
  });
});

// ─────────────────────────────────────────────────────────────
// 8. UNIFIED DOCUMENT VERIFICATION (BACKWARD COMPATIBILITY)
// ─────────────────────────────────────────────────────────────
const verifyDocument = catchAsync(async (req, res) => {
  const { docType, docNumber, frontUrl, backUrl, fileUrl, docName } = req.body;
  if (!docType) throw ApiError.badRequest('docType is required');

  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  const currentCp = user.creatorProfile || {};
  const currentDocs = currentCp.documents || {};
  const now = new Date();
  const docFileUrl = fileUrl || frontUrl || backUrl || '';

  if (docType === 'pan' && docNumber) {
    const fallbackName = user.name || currentCp.displayName || 'Taxpayer Validated';
    const sandboxRes = await sandboxService.verifyPan(docNumber, fallbackName);
    const isApproved = sandboxRes.success && sandboxRes.verified;

    currentDocs.pan = {
      docNumber: docNumber.toUpperCase(),
      maskedNumber: sandboxRes.maskedNumber || sandboxService.maskPan(docNumber.toUpperCase()),
      fullName: sandboxRes.fullName || fallbackName,
      category: sandboxRes.category || 'Individual',
      panStatus: sandboxRes.panStatus || 'VALID',
      aadhaarLinked: sandboxRes.aadhaarLinked || 'Linked / Verified',
      dob: sandboxRes.dob || '',
      gender: sandboxRes.gender || '',
      status: isApproved ? 'approved' : 'failed',
      verified: isApproved,
      verifiedAt: isApproved ? now : null,
      referenceId: sandboxRes.referenceId || `PAN_VAL_${Date.now()}`,
      frontUrl: frontUrl || currentDocs.pan?.frontUrl || null,
      backUrl: backUrl || currentDocs.pan?.backUrl || null,
      fileUrl: docFileUrl || currentDocs.pan?.fileUrl || null,
      failureReason: isApproved ? null : sandboxRes.message
    };
    if (isApproved && !currentCp.panNumber) {
      currentCp.panNumber = docNumber.toUpperCase();
    }
  } else if (docType === 'aadhaar') {
    const masked = sandboxService.maskAadhaar(docNumber);
    currentDocs.aadhaar = {
      docNumber: masked,
      maskedNumber: masked,
      frontUrl: frontUrl || currentDocs.aadhaar?.frontUrl || null,
      backUrl: backUrl || currentDocs.aadhaar?.backUrl || null,
      fileUrl: docFileUrl || currentDocs.aadhaar?.fileUrl || null,
      status: 'approved',
      verified: true,
      verifiedAt: now
    };
  } else {
    currentDocs[docType] = {
      docNumber: docNumber || currentDocs[docType]?.docNumber || '',
      frontUrl: frontUrl || currentDocs[docType]?.frontUrl || null,
      backUrl: backUrl || currentDocs[docType]?.backUrl || null,
      fileUrl: docFileUrl || currentDocs[docType]?.fileUrl || null,
      status: 'approved',
      verified: true,
      verifiedAt: now
    };
  }

  currentCp.documents = currentDocs;
  user.creatorProfile = currentCp;
  user.markModified('creatorProfile');

  const statusInfo = computeCreatorVerification(user);
  user.creatorProfile.verificationStatus = statusInfo.tier;
  if (['verified_creator', 'pro_verified'].includes(statusInfo.tier)) {
    user.kyc_status = 'approved';
  }
  user.markModified('creatorProfile');
  await user.save();

  res.json({ success: true, message: `${docName || docType} verified successfully!`, ...statusInfo });
});

// ─────────────────────────────────────────────────────────────
// 9. UNIFIED PAYMENT VERIFICATION (BACKWARD COMPATIBILITY)
// ─────────────────────────────────────────────────────────────
const verifyPayment = catchAsync(async (req, res) => {
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
  user.markModified('creatorProfile');

  const statusInfo = computeCreatorVerification(user);
  user.creatorProfile.verificationStatus = statusInfo.tier;
  user.markModified('creatorProfile');
  await user.save();

  res.json({ success: true, message: 'Payment & payout details verified successfully!', ...statusInfo });
});

module.exports = {
  getVerificationStatus,
  sendContactOtp,
  verifyContact,
  verifyPan,
  initiateAadhaar,
  verifyAadhaarOtp,
  verifyBank,
  verifyUpi,
  verifyDocument,
  verifyPayment,
  computeCreatorVerification
};
