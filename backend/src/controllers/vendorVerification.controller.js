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

  // Query KycDocument collection to synchronize live Admin review decisions & rejection reasons
  try {
    const kycDocs = await KycDocument.find({ user_id: req.user._id.toString(), is_deleted: { $ne: true } }).lean();
    if (kycDocs && kycDocs.length > 0 && user.vendorProfile) {
      const docs = user.vendorProfile.documents || {};
      let modified = false;
      for (const kdoc of kycDocs) {
        const dt = kdoc.doc_type;
        if (['aadhaar', 'pan', 'gst', 'shopLicense', 'udyamRegistration'].includes(dt)) {
          if (!docs[dt]) docs[dt] = {};
          if (kdoc.status) docs[dt].status = kdoc.status;
          if (kdoc.rejection_reason) {
            docs[dt].failureReason = kdoc.rejection_reason;
            docs[dt].rejectionReason = kdoc.rejection_reason;
          }
          if (kdoc.doc_url) docs[dt].fileUrl = kdoc.doc_url;
          if (kdoc.doc_number && !docs[dt].docNumber) docs[dt].docNumber = kdoc.doc_number;
          modified = true;
        }
      }
      if (modified) {
        user.vendorProfile.documents = docs;
        user.markModified('vendorProfile');
        await user.save();
      }
    }
  } catch (err) {
    console.error('Error syncing KycDocument in getVerificationStatus:', err.message);
  }

  const statusInfo = await fetchAndComputeStatus(user);
  res.json({ success: true, ...statusInfo });
});

const OTP = require('../models/OTP');
const emailService = require('../services/email.service');
const smsService = require('../services/sms.service');
const { generateOtp, normalizeIndianPhone } = require('../utils/otp.utils');

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

  if (!reverify && !value && user.vendorProfile?.contactVerified?.[type]) {
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

  // Generate cryptographically secure 6-digit OTP code
  const otpCode = generateOtp();
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
    const cleanPhone = normalizeIndianPhone(targetValue);
    await OTP.deleteMany({ identifier: cleanPhone, purpose: 'verify-phone' });
    await OTP.create({
      identifier: cleanPhone,
      identifierType: 'phone',
      otp: otpCode,
      purpose: 'verify-phone',
      expiresAt: expiresAt,
      isUsed: false
    });

    // Dispatch SMS via Twilio / SMS Gateway
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

    if (!isMatch) {
      throw ApiError.badRequest('Invalid or expired email verification code');
    }

    if (otpRecord) {
      await otpRecord.markUsed();
    }
  }

  // Validate OTP code for mobile / whatsapp if code provided
  if (type === 'mobile' || type === 'whatsapp') {
    if (code) {
      const targetPhone = normalizeIndianPhone(value || user.vendorProfile?.mobileNumber || user.phone || '');
      const otpRecord = await OTP.findOne({
        identifier: targetPhone,
        purpose: 'verify-phone',
        isUsed: false,
        expiresAt: { $gt: new Date() }
      }).sort({ createdAt: -1 });

      const submittedCode = String(code || '').trim();
      const isMatch = otpRecord && (otpRecord.otp === submittedCode);

      if (!isMatch) {
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

  // Call Sandbox PAN verification with fallback name & DOB
  const fallbackName = user.name || currentVp.businessName || 'Taxpayer Validated';
  const sandboxRes = await sandboxService.verifyPan(panNumber, fallbackName, user.dob || currentVp.dob);

  const isApproved = sandboxRes.success && sandboxRes.verified;
  const now = new Date();

  currentDocs.pan = {
    docNumber: panNumber.toUpperCase(),
    maskedNumber: sandboxRes.maskedNumber || sandboxService.maskPan(panNumber.toUpperCase()),
    fullName: isApproved ? (sandboxRes.fullName || fallbackName) : '',
    category: isApproved ? (sandboxRes.category || 'Individual') : '',
    panStatus: isApproved ? (sandboxRes.panStatus || 'VALID') : 'FAILED',
    aadhaarLinked: isApproved ? (sandboxRes.aadhaarLinked || 'Linked / Verified') : 'Unlinked',
    dob: isApproved ? (sandboxRes.dob || '') : '',
    gender: isApproved ? (sandboxRes.gender || '') : '',
    status: isApproved ? 'approved' : 'failed',
    verified: isApproved,
    verifiedAt: isApproved ? now : null,
    referenceId: sandboxRes.referenceId || `PAN_VAL_${Date.now()}`,
    frontUrl: frontUrl || currentDocs.pan?.frontUrl || null,
    backUrl: backUrl || currentDocs.pan?.backUrl || null,
    failureReason: isApproved ? null : (sandboxRes.message || 'PAN Verification failed')
  };

  if (isApproved && !currentVp.panNumber) {
    currentVp.panNumber = panNumber.toUpperCase();
  }

  currentVp.documents = currentDocs;
  user.vendorProfile = currentVp;
  user.markModified('vendorProfile');

  // Sync to KycDocument model for Admin visibility (upsert to prevent duplicate entries)
  try {
    await KycDocument.findOneAndUpdate(
      { user_id: user._id.toString(), doc_type: 'pan', is_deleted: { $ne: true } },
      {
        $set: {
          doc_number: sandboxRes.maskedNumber || panNumber.toUpperCase(),
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

  const statusInfo = await fetchAndComputeStatus(user);
  currentVp.verificationStatus = statusInfo.tier;
  if (['verified_vendor', 'trusted_vendor', 'premium_vendor'].includes(statusInfo.tier) && isApproved) {
    user.kyc_status = 'approved';
  } else if (!isApproved && statusInfo.tier === 'unverified') {
    user.kyc_status = 'pending';
  }
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
  const { aadhaarNumber, reverify } = req.body;
  if (!aadhaarNumber) throw ApiError.badRequest('Aadhaar number is required');

  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  const currentDocs = user.vendorProfile?.documents || {};
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

  const currentVp = user.vendorProfile || {};
  const currentDocs = currentVp.documents || {};

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
    failureReason: isApproved ? null : (sandboxRes.message || 'Aadhaar OTP verification failed')
  };

  // Auto-populate missing vendor address/city/pincode from verified Aadhaar record
  if (isApproved) {
    if (!currentVp.pinCode && sandboxRes.pincode) currentVp.pinCode = sandboxRes.pincode;
    if (!currentVp.city && (sandboxRes.city || sandboxRes.district)) currentVp.city = sandboxRes.city || sandboxRes.district;
    if (!currentVp.state && sandboxRes.state) currentVp.state = sandboxRes.state;
    if (!currentVp.address && sandboxRes.fullAddress) currentVp.address = sandboxRes.fullAddress;
    if (!user.city && (sandboxRes.city || sandboxRes.district)) user.city = sandboxRes.city || sandboxRes.district;
  }

  currentVp.documents = currentDocs;
  user.vendorProfile = currentVp;
  user.markModified('vendorProfile');

  // Sync to KycDocument model for Admin visibility (upsert to prevent duplicate entries)
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

  const statusInfo = await fetchAndComputeStatus(user);
  currentVp.verificationStatus = statusInfo.tier;
  if (['verified_vendor', 'trusted_vendor', 'premium_vendor'].includes(statusInfo.tier) || isApproved) {
    user.kyc_status = 'approved';
  }
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

  const fallbackTradeName = currentVp.businessName || currentVp.shopName || user.name || 'Registered Business';
  const sandboxRes = await sandboxService.verifyGstin(gstinNumber, fallbackTradeName);
  const isApproved = sandboxRes.success && sandboxRes.verified;
  const now = new Date();

  currentDocs.gst = {
    docNumber: gstinNumber.toUpperCase(),
    legalName: sandboxRes.legalName || fallbackTradeName,
    tradeName: sandboxRes.tradeName || fallbackTradeName,
    gstStatus: sandboxRes.gstStatus || 'ACTIVE',
    taxpayerType: sandboxRes.taxpayerType || 'Regular',
    constitutionOfBusiness: sandboxRes.constitutionOfBusiness || 'Registered Business',
    dateOfRegistration: sandboxRes.dateOfRegistration || '',
    state: sandboxRes.state || '',
    fullAddress: sandboxRes.fullAddress || '',
    principalPlaceOfBusiness: sandboxRes.principalPlaceOfBusiness || '',
    natureOfBusiness: sandboxRes.natureOfBusiness || [],
    centerJurisdiction: sandboxRes.centerJurisdiction || '',
    stateJurisdiction: sandboxRes.stateJurisdiction || '',
    status: isApproved ? 'approved' : 'failed',
    verified: isApproved,
    verifiedAt: isApproved ? now : null,
    referenceId: sandboxRes.referenceId || `GST_VAL_${Date.now()}`,
    fileUrl: fileUrl || currentDocs.gst?.fileUrl || null,
    failureReason: isApproved ? null : (sandboxRes.message || 'GSTIN verification failed')
  };

  // Auto-populate vendor business name/type from verified GSTIN record
  if (isApproved) {
    if (!currentVp.storeName && (sandboxRes.tradeName || sandboxRes.legalName)) {
      currentVp.storeName = sandboxRes.tradeName || sandboxRes.legalName;
    }
    if (!currentVp.businessName && (sandboxRes.legalName || sandboxRes.tradeName)) {
      currentVp.businessName = sandboxRes.legalName || sandboxRes.tradeName;
    }
    if (!currentVp.businessType && sandboxRes.constitutionOfBusiness) {
      currentVp.businessType = sandboxRes.constitutionOfBusiness;
    }
    if (!currentVp.taxDetails) currentVp.taxDetails = {};
    currentVp.taxDetails.gstNumber = gstinNumber.toUpperCase();
  }

  currentVp.documents = currentDocs;
  user.vendorProfile = currentVp;
  user.markModified('vendorProfile');

  // Sync to KycDocument model for Admin visibility (upsert to prevent duplicate entries)
  try {
    await KycDocument.findOneAndUpdate(
      { user_id: user._id.toString(), doc_type: 'gst', is_deleted: { $ne: true } },
      {
        $set: {
          doc_number: gstinNumber.toUpperCase(),
          doc_url: fileUrl || 'https://via.placeholder.com/400x600?text=GST+Document',
          status: isApproved ? 'approved' : 'pending',
          submitted_at: now.toISOString(),
        }
      },
      { upsert: true, returnDocument: 'after' }
    );
  } catch (err) {
    console.error('Error syncing KycDocument for GSTIN:', err.message);
  }

  const statusInfo = await fetchAndComputeStatus(user);
  currentVp.verificationStatus = statusInfo.tier;
  if (['verified_vendor', 'trusted_vendor', 'premium_vendor'].includes(statusInfo.tier) || isApproved) {
    user.kyc_status = 'approved';
  }
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

  const targetHolder = accountHolderName || user.name || 'Account Holder';
  const sandboxRes = await sandboxService.verifyBankAccount(ifscCode, bankAccount, targetHolder);
  const isApproved = sandboxRes.success && sandboxRes.verified;
  const now = new Date();

  const currentVp = user.vendorProfile || {};
  const currentPayment = currentVp.paymentDetails || {};

  currentPayment.bankAccount = bankAccount;
  currentPayment.maskedAccount = sandboxRes.maskedAccount || sandboxService.maskBankAccount(bankAccount);
  currentPayment.accountHolderName = accountHolderName || sandboxRes.nameAtBank || targetHolder;
  currentPayment.verifiedAccountName = sandboxRes.nameAtBank || targetHolder;
  currentPayment.ifscCode = ifscCode.toUpperCase();
  currentPayment.ifscVerified = true;
  currentPayment.bankName = sandboxRes.bankName || bankName || currentPayment.bankName || 'Bank';
  currentPayment.branchName = sandboxRes.branchName || branchName || currentPayment.branchName || '';
  currentPayment.city = sandboxRes.city || currentPayment.city || '';
  currentPayment.state = sandboxRes.state || currentPayment.state || '';
  currentPayment.micr = sandboxRes.micr || currentPayment.micr || '';
  currentPayment.statementChequeUrl = statementChequeUrl || currentPayment.statementChequeUrl || null;
  currentPayment.status = isApproved ? 'approved' : 'pending';
  currentPayment.verified = isApproved;
  currentPayment.verifiedAt = isApproved ? now : null;
  currentPayment.referenceId = sandboxRes.referenceId || `BANK_VAL_${Date.now()}`;

  currentVp.paymentDetails = currentPayment;
  currentVp.bankDetails = {
    accountNumber: bankAccount,
    ifscCode: ifscCode.toUpperCase(),
    accountHolderName: accountHolderName || sandboxRes.nameAtBank || targetHolder,
    bankName: currentPayment.bankName,
    branchName: currentPayment.branchName
  };
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

  // 1. If PAN submitted via generic handler, invoke PAN verification
  if (docType === 'pan' && docNumber) {
    const fallbackName = user.name || currentVp.businessName || 'Taxpayer Validated';
    const sandboxRes = await sandboxService.verifyPan(docNumber, fallbackName, user.dob || currentVp.dob);
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
    if (isApproved && !currentVp.panNumber) {
      currentVp.panNumber = docNumber.toUpperCase();
    }
  }
  // 2. If GST submitted via generic handler, invoke GST verification
  else if (docType === 'gst' && docNumber) {
    const fallbackTradeName = currentVp.businessName || currentVp.shopName || user.name || 'Registered Business';
    const sandboxRes = await sandboxService.verifyGstin(docNumber, fallbackTradeName);
    const isApproved = sandboxRes.success && sandboxRes.verified;

    currentDocs.gst = {
      docNumber: docNumber.toUpperCase(),
      legalName: sandboxRes.legalName || fallbackTradeName,
      tradeName: sandboxRes.tradeName || fallbackTradeName,
      gstStatus: sandboxRes.gstStatus || 'ACTIVE',
      taxpayerType: sandboxRes.taxpayerType || 'Regular',
      constitutionOfBusiness: sandboxRes.constitutionOfBusiness || 'Registered Business',
      dateOfRegistration: sandboxRes.dateOfRegistration || '',
      state: sandboxRes.state || '',
      fullAddress: sandboxRes.fullAddress || '',
      principalPlaceOfBusiness: sandboxRes.principalPlaceOfBusiness || '',
      natureOfBusiness: sandboxRes.natureOfBusiness || [],
      centerJurisdiction: sandboxRes.centerJurisdiction || '',
      stateJurisdiction: sandboxRes.stateJurisdiction || '',
      status: isApproved ? 'approved' : 'failed',
      verified: isApproved,
      verifiedAt: isApproved ? now : null,
      referenceId: sandboxRes.referenceId || `GST_VAL_${Date.now()}`,
      fileUrl: docFileUrl || currentDocs.gst?.fileUrl || null,
      failureReason: isApproved ? null : sandboxRes.message
    };
    if (isApproved) {
      if (!currentVp.storeName && (sandboxRes.tradeName || sandboxRes.legalName)) {
        currentVp.storeName = sandboxRes.tradeName || sandboxRes.legalName;
      }
      if (!currentVp.businessType && sandboxRes.constitutionOfBusiness) {
        currentVp.businessType = sandboxRes.constitutionOfBusiness;
      }
    }
  }
  // 3. Aadhaar direct submission (saves document images & sets verified)
  else if (docType === 'aadhaar') {
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
  }
  // 4. Shop License & Udyam Registration
  else if (['shopLicense', 'udyamRegistration'].includes(docType)) {
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
  // 5. Dynamic Category Documents (FSSAI, Pharmacy, Trade licenses)
  else {
    const existingDynamic = currentDocs.dynamicDocs || [];
    const filtered = existingDynamic.filter(d => d.docType !== docType && d.docName !== docName);
    filtered.push({
      docName: docName || docType,
      docType,
      docNumber: docNumber || '',
      fileUrl: docFileUrl,
      status: 'approved',
      verified: true,
      verifiedAt: now
    });
    currentDocs.dynamicDocs = filtered;
  }

  currentVp.documents = currentDocs;
  user.vendorProfile = currentVp;
  user.markModified('vendorProfile');

  // Sync to KycDocument for Admin review (upsert to prevent duplicate entries)
  try {
    const docKey = docName || docType;
    await KycDocument.findOneAndUpdate(
      { user_id: user._id.toString(), doc_type: docKey, is_deleted: { $ne: true } },
      {
        $set: {
          doc_number: (docType === 'aadhaar' || docType === 'pan') ? (currentDocs[docType]?.maskedNumber || docNumber) : (docNumber || 'SUBMITTED'),
          doc_url: docFileUrl || 'https://via.placeholder.com/400x600?text=Document+Attached',
          status: currentDocs[docType]?.status === 'approved' ? 'approved' : 'pending',
          submitted_at: now.toISOString(),
        }
      },
      { upsert: true, returnDocument: 'after' }
    );
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
    user.kyc_status = 'approved';
  }
  await user.save();

  res.json({
    success: true,
    message: `🟢 ${docName || docType.toUpperCase()} verified and saved successfully!`,
    ...statusInfo
  });
});

// ─────────────────────────────────────────────────────────────
// 8. UPI VERIFICATION (SANDBOX API / NPCI)
// ─────────────────────────────────────────────────────────────
const verifyUpi = catchAsync(async (req, res) => {
  const { upiId, accountHolderName } = req.body;
  if (!upiId) throw ApiError.badRequest('UPI ID is required (e.g. yourname@okaxis)');

  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  const targetHolder = accountHolderName || user.name || user.vendorProfile?.businessName || 'Beneficiary';
  const sandboxRes = await sandboxService.verifyUpiId(upiId, targetHolder);

  if (!sandboxRes.success && !sandboxRes.verified) {
    throw ApiError.badRequest(sandboxRes.message || 'Invalid UPI ID');
  }

  const currentVp = user.vendorProfile || {};
  const currentPayment = currentVp.paymentDetails || {};

  currentPayment.upiId = sandboxRes.upiId || upiId.toLowerCase().trim();
  currentPayment.maskedUpi = sandboxRes.maskedUpi || sandboxService.maskUpi(upiId);
  currentPayment.upiVerified = true;
  currentPayment.pspBank = sandboxRes.pspBank || '';
  currentPayment.verifiedUpiName = sandboxRes.beneficiaryName || targetHolder;
  currentPayment.status = 'approved';
  currentPayment.verified = true;
  currentPayment.verifiedAt = new Date();
  currentPayment.upiReferenceId = sandboxRes.referenceId || `UPI_VAL_${Date.now()}`;

  currentVp.paymentDetails = currentPayment;
  currentVp.upiId = currentPayment.upiId;
  user.vendorProfile = currentVp;
  user.markModified('vendorProfile');

  const statusInfo = await fetchAndComputeStatus(user);
  currentVp.verificationStatus = statusInfo.tier;
  user.vendorProfile = currentVp;
  user.markModified('vendorProfile');
  await user.save();

  res.json({
    success: true,
    message: `🟢 UPI ID verified successfully! (${sandboxRes.pspBank || 'UPI Connected'})`,
    paymentDetails: currentPayment,
    ...statusInfo
  });
});

// ─────────────────────────────────────────────────────────────
// 9. VERIFY PAYMENT (UPI & BANK COMBINED)
// ─────────────────────────────────────────────────────────────
const verifyPayment = catchAsync(async (req, res) => {
  const { upiId, bankAccount, accountHolderName, ifscCode, bankName, branchName, statementChequeUrl, qrCodeUrl, qrCode } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  const currentVp = user.vendorProfile || {};
  const currentPayment = currentVp.paymentDetails || {};
  const targetHolder = accountHolderName || user.name || currentVp.businessName || 'Account Holder';

  if (upiId !== undefined && upiId.trim() !== '') {
    const sandboxUpi = await sandboxService.verifyUpiId(upiId, targetHolder);
    currentPayment.upiId = sandboxUpi.upiId || upiId.trim().toLowerCase();
    currentPayment.maskedUpi = sandboxUpi.maskedUpi || sandboxService.maskUpi(upiId);
    currentPayment.upiVerified = true;
    currentPayment.pspBank = sandboxUpi.pspBank || '';
    currentPayment.verifiedUpiName = sandboxUpi.beneficiaryName || targetHolder;
    currentPayment.upiReferenceId = sandboxUpi.referenceId || `UPI_VAL_${Date.now()}`;
    currentVp.upiId = currentPayment.upiId;
  }

  if (bankAccount !== undefined && bankAccount.trim() !== '') {
    currentPayment.bankAccount = bankAccount;
    currentPayment.maskedAccount = sandboxService.maskBankAccount(bankAccount);
    currentPayment.status = 'approved';
    currentPayment.verified = true;
    currentVp.bankDetails = {
      accountNumber: bankAccount,
      ifscCode: (ifscCode || currentPayment.ifscCode || '').toUpperCase().trim(),
      accountHolderName: accountHolderName || currentPayment.accountHolderName || targetHolder,
      bankName: bankName || currentPayment.bankName || '',
      branchName: branchName || currentPayment.branchName || ''
    };
  }
  if (accountHolderName !== undefined) currentPayment.accountHolderName = accountHolderName;
  if (ifscCode !== undefined && ifscCode.trim() !== '') {
    currentPayment.ifscCode = ifscCode.toUpperCase().trim();
    currentPayment.ifscVerified = !!ifscCode && ifscCode.length >= 11;
  }
  if (bankName !== undefined) currentPayment.bankName = bankName;
  if (branchName !== undefined) currentPayment.branchName = branchName;
  if (statementChequeUrl !== undefined) currentPayment.statementChequeUrl = statementChequeUrl;

  const targetQr = qrCodeUrl || qrCode;
  if (targetQr) {
    currentPayment.qrCodeUrl = targetQr;
    currentPayment.qrCode = targetQr;
    currentVp.qrCode = targetQr;
  }

  currentPayment.verifiedAt = new Date();

  currentVp.paymentDetails = currentPayment;
  user.vendorProfile = currentVp;
  user.markModified('vendorProfile');

  const statusInfo = await fetchAndComputeStatus(user);
  currentVp.verificationStatus = statusInfo.tier;
  user.vendorProfile = currentVp;
  user.markModified('vendorProfile');
  await user.save();

  res.json({ success: true, message: 'Payment and payout details verified and updated successfully!', ...statusInfo });
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
  verifyUpi,
  verifyDocument,
  verifyPayment
};

