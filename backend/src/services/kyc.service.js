const mongoose = require('mongoose');
const { KycDocument } = require('../models/Phase4');
const User = require('../models/User');
const notificationService = require('./notification.service');
const ApiError = require('../utils/ApiError');

const serializeKyc = (d) => {
  if (!d) return null;
  const out = d.toObject ? d.toObject() : { ...d };
  if (out._id) {
    out.id = out._id.toString();
    delete out._id;
  }
  if (out.user_id) out.user_id = out.user_id.toString();
  delete out.is_deleted;
  return out;
};

const kycSubmit = async (userId, body) => {
  if (!['aadhaar', 'pan', 'driving_license', 'passport'].includes(body.doc_type)) {
    throw ApiError.badRequest('Invalid doc_type');
  }

  const now = new Date().toISOString();
  const doc = await KycDocument.findOneAndUpdate(
    { user_id: userId, doc_type: body.doc_type, is_deleted: { $ne: true } },
    {
      $set: {
        doc_number: body.doc_number,
        doc_url: body.doc_url,
        selfie_url: body.selfie_url || null,
        status: 'pending',
        submitted_at: now,
      }
    },
    { upsert: true, returnDocument: 'after' }
  );

  if (mongoose.Types.ObjectId.isValid(userId)) {
    await User.updateOne({ _id: userId }, { $set: { kyc_status: 'pending' } });
  }
  
  try {
    const { emitToAdmin } = require('../sockets');
    emitToAdmin('admin:update', { tags: ['AdminKyc', 'AdminOverview'] });
  } catch (err) {}

  return serializeKyc(doc);
};

const myKyc = async (userId) => {
  const doc = await KycDocument.findOne({ user_id: userId, is_deleted: { $ne: true } }).sort({ _id: -1 });
  if (!doc) return null;
  const out = serializeKyc(doc);
  const num = out.doc_number || '';
  out.doc_number = 'X'.repeat(Math.max(0, num.length - 4)) + num.slice(-4);
  return out;
};

const kycQueue = async (status = null) => {
  const filter = { is_deleted: { $ne: true } };
  if (status) {
    filter.status = status;
  }
  // Sort newest first
  const docs = await KycDocument.find(filter).sort({ _id: -1 }).limit(200);
  
  // Deduplicate by user_id + doc_type (keeping latest submission per doc_type per user)
  const seenUserDoc = new Set();
  const dedupedDocs = [];
  for (const d of docs) {
    const key = `${d.user_id}_${d.doc_type}`;
    if (!seenUserDoc.has(key)) {
      seenUserDoc.add(key);
      dedupedDocs.push(d);
    }
  }

  const validUserIds = [...new Set(dedupedDocs.map((d) => d.user_id))].filter((id) => mongoose.Types.ObjectId.isValid(id));
  const users = validUserIds.length > 0 ? await User.find({ _id: { $in: validUserIds } }) : [];
  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  return dedupedDocs.map((d) => {
    const out = serializeKyc(d);
    const user = userMap.get(out.user_id);
    if (user) {
      out.user = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        roles: user.roles || [],
        current_role: user.current_role,
        activeRole: user.activeRole,
        profile_pic: user.profile_pic,
        avatarUrl: user.avatarUrl,
        vendorProfile: user.vendorProfile,
        creatorProfile: user.creatorProfile,
        city: user.city,
      };
      out.role = user.roles && user.roles.includes('vendor')
        ? 'vendor'
        : (user.roles && user.roles.includes('creator') ? 'creator' : 'customer');
    } else {
      out.role = 'customer';
    }
    return out;
  });
};

const kycReview = async (kid, adminId, approve, reason = null) => {
  const doc = await KycDocument.findById(kid);
  if (!doc) {
    throw ApiError.notFound('KYC doc not found');
  }

  const newStatus = approve ? 'approved' : 'rejected';
  await KycDocument.updateOne(
    { _id: kid },
    {
      $set: {
        status: newStatus,
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        rejection_reason: reason,
      },
    }
  );

  const userId = doc.user_id.toString();
  const user = await User.findById(userId);
  if (user) {
    user.kyc_status = newStatus;
    if (user.vendorProfile) {
      const docType = doc.doc_type;
      const vp = user.vendorProfile || {};
      const docs = vp.documents || {};
      
      if (['aadhaar', 'pan', 'gst', 'shopLicense', 'udyamRegistration'].includes(docType)) {
        if (docs[docType]) {
          docs[docType].status = newStatus;
          docs[docType].verifiedAt = new Date();
        } else {
          docs[docType] = {
            docNumber: doc.doc_number || '',
            fileUrl: doc.doc_url || '',
            status: newStatus,
            verifiedAt: new Date()
          };
        }
      } else {
        if (!Array.isArray(docs.dynamicDocs)) {
          docs.dynamicDocs = [];
        }
        const found = docs.dynamicDocs.find(d => d.docType === docType || d.docName === docType);
        if (found) {
          found.status = newStatus;
          found.verifiedAt = new Date();
        } else {
          docs.dynamicDocs.push({
            docName: docType,
            docType: docType,
            docNumber: doc.doc_number || '',
            fileUrl: doc.doc_url || '',
            status: newStatus,
            verifiedAt: new Date()
          });
        }
      }
      
      vp.documents = docs;
      user.vendorProfile = vp;
      user.markModified('vendorProfile');

      // Re-calculate verification status
      try {
        const Listing = require('../models/Listing');
        const Reel = require('../models/Reel');
        const Order = require('../models/Order');
        const { computeVendorVerification } = require('../utils/verification');

        const [productsCount, reelsCount, ordersCount] = await Promise.all([
          Listing.countDocuments({ vendor: userId, type: 'product', isDeleted: { $ne: true } }),
          Reel.countDocuments({ creator: userId, isDeleted: { $ne: true } }),
          Order.countDocuments({ vendor: userId })
        ]);

        const statusInfo = computeVendorVerification(user, { productsCount, reelsCount, ordersCount });
        user.vendorProfile.verificationStatus = statusInfo.tier;
      } catch (err) {
        console.error('Error re-calculating verification status during KYC review:', err);
      }
    }

    if (user.creatorProfile) {
      const docType = doc.doc_type;
      const cp = user.creatorProfile || {};
      const docs = cp.documents || {};
      
      if (!docs[docType]) {
        docs[docType] = {
          docNumber: doc.doc_number || '',
          fileUrl: doc.doc_url || '',
          frontUrl: doc.doc_url || '',
          status: newStatus,
          verifiedAt: approve ? new Date() : null,
          rejectionReason: reason || null,
          failureReason: reason || null
        };
      } else {
        docs[docType].status = newStatus;
        if (approve) {
          docs[docType].verifiedAt = new Date();
          docs[docType].rejectionReason = null;
          docs[docType].failureReason = null;
        } else {
          docs[docType].rejectionReason = reason;
          docs[docType].failureReason = reason;
        }
      }
      
      cp.documents = docs;
      user.creatorProfile = cp;
      user.markModified('creatorProfile');

      try {
        const { computeCreatorVerification } = require('../controllers/creatorVerification.controller');
        const statusInfo = computeCreatorVerification(user);
        user.creatorProfile.verificationStatus = statusInfo.tier;
      } catch (err) {
        console.error('Error re-calculating creator verification status during KYC review:', err);
      }
    }
    await user.save();
    if (approve) {
      try {
        const referralService = require('./referral.service');
        await referralService.maybeAwardOnKYC(userId);
      } catch (err) {
        console.error('Error triggering referral check on KYC approval:', err);
      }
    }
  }

  await notificationService.create(
    userId,
    'verification',
    `KYC ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
    reason || (approve ? 'Your KYC has been approved.' : 'Please resubmit.'),
    {},
    '/kyc',
    null
  );

  try {
    const { emitToAdmin } = require('../sockets');
    emitToAdmin('admin:update', { tags: ['AdminKyc', 'AdminOverview'] });
  } catch (err) {}

  return { ok: true, status: newStatus };
};

module.exports = {
  kycSubmit,
  myKyc,
  kycQueue,
  kycReview,
};
