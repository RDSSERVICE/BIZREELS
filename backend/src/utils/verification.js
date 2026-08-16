const mongoose = require('mongoose');

/**
 * Calculates verification completion percentage, tier, and badge description.
 * Weightage:
 * - Contact: Mobile (5%), WhatsApp (5%), Email (5%) -> 15%
 * - Identity/Business Docs: Aadhaar (15%), PAN (15%), GST (20%), Shop License (5%), Udyam (5%), Dynamic (5%) -> 65%
 * - Payout: UPI (10%), Bank Account (10%) -> 20%
 * Total = 100%
 */
function computeVendorVerification(user, counts = {}) {
  const vp = user.vendorProfile || {};
  const contactVerified = vp.contactVerified || {
    mobile: !!user.phone,
    whatsapp: false,
    email: !!user.email,
    website: false
  };
  const documents = vp.documents || {};
  const paymentDetails = vp.paymentDetails || {};

  let totalPoints = 0;

  // 1. Contact Verification (15%)
  if (contactVerified.mobile || !!user.phone) totalPoints += 5;
  if (contactVerified.whatsapp) totalPoints += 5;
  if (contactVerified.email || !!user.email) totalPoints += 5;

  // 2. Identity & Business Documents (65%)
  if (documents.aadhaar?.status === 'approved' || documents.aadhaar?.verified === true) totalPoints += 15;
  if (documents.pan?.status === 'approved' || documents.pan?.verified === true) totalPoints += 15;
  if (documents.gst?.status === 'approved' || documents.gst?.verified === true) totalPoints += 20;
  if (documents.shopLicense?.status === 'approved' || documents.shopLicense?.verified === true) totalPoints += 5;
  if (documents.udyamRegistration?.status === 'approved' || documents.udyamRegistration?.verified === true) totalPoints += 5;

  const hasApprovedDynamic = Array.isArray(documents.dynamicDocs) && 
    documents.dynamicDocs.some(d => d.status === 'approved' || d.verified === true);
  if (hasApprovedDynamic) totalPoints += 5;

  // 3. Payout & Payment Details (20%)
  const hasUpi = !!(paymentDetails.upiId && paymentDetails.upiVerified !== false);
  const hasBank = !!(paymentDetails.bankAccount && paymentDetails.ifscCode && (paymentDetails.status === 'approved' || paymentDetails.verified === true || paymentDetails.ifscVerified !== false));

  if (hasUpi) totalPoints += 10;
  if (hasBank) totalPoints += 10;

  const completionPercentage = Math.min(100, totalPoints);

  // Determine standard tier
  let tier = 'unverified';
  let badgeLabel = 'Unverified';
  let badgeColor = '⚪';

  if (completionPercentage === 100) {
    tier = 'trusted_vendor';
    badgeLabel = 'Trusted Vendor';
    badgeColor = '👑';
  } else if (completionPercentage >= 85) {
    tier = 'verified_vendor';
    badgeLabel = 'Verified Vendor';
    badgeColor = '🟢';
  } else if (completionPercentage >= 50) {
    tier = 'partially_verified';
    badgeLabel = 'Partially Verified';
    badgeColor = '🟡';
  }

  // Premium Vendor criteria override
  const pCount = counts.productsCount || 0;
  const rCount = counts.reelsCount || 0;
  const oCount = counts.ordersCount || 0;

  if (pCount >= 100 && rCount >= 100 && oCount >= 10000) {
    tier = 'premium_vendor';
    badgeLabel = 'Premium Vendor';
    badgeColor = '💎';
  }

  return {
    completionPercentage,
    tier,
    badgeLabel,
    badgeColor,
    contactVerified,
    documents,
    paymentDetails
  };
}

module.exports = {
  computeVendorVerification
};
