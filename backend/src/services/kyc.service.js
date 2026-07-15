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
  const existing = await KycDocument.findOne({ user_id: userId, status: 'pending', is_deleted: { $ne: true } });
  if (existing) {
    throw ApiError.badRequest('You have a KYC pending review');
  }
  if (!['aadhaar', 'pan', 'driving_license', 'passport'].includes(body.doc_type)) {
    throw ApiError.badRequest('Invalid doc_type');
  }

  const doc = await KycDocument.create({
    user_id: userId,
    doc_type: body.doc_type,
    doc_number: body.doc_number,
    doc_url: body.doc_url,
    selfie_url: body.selfie_url || null,
    status: 'pending',
  });

  await User.updateOne({ _id: userId }, { $set: { kyc_status: 'pending' } });
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

const kycQueue = async () => {
  const docs = await KycDocument.find({ status: 'pending', is_deleted: { $ne: true } }).sort({ _id: 1 }).limit(100);
  return docs.map(serializeKyc);
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
  await User.updateOne({ _id: userId }, { $set: { kyc_status: newStatus } });

  await notificationService.create(
    userId,
    'verification',
    `KYC ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
    reason || (approve ? 'Your KYC has been approved.' : 'Please resubmit.'),
    {},
    '/kyc'
  );

  return { ok: true, status: newStatus };
};

module.exports = {
  kycSubmit,
  myKyc,
  kycQueue,
  kycReview,
};
