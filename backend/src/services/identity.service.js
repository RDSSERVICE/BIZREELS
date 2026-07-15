const crypto = require('crypto');
const { KycDocument } = require('../models/Phase4');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const DOC_TYPES = ['aadhaar', 'pan', 'gst', 'bank'];
const KYC_DEV_MODE = process.env.KYC_DEV_MODE !== 'false';

const maskDocNumber = (number) => {
  if (!number) return '';
  return 'X'.repeat(Math.max(0, number.length - 4)) + number.slice(-4);
};

const hashDocNumber = (number) => {
  return crypto.createHash('sha256').update(number || '').digest('hex');
};

const serializeIdentityDoc = (doc) => {
  if (!doc) return null;
  const d = doc.toObject ? doc.toObject() : { ...doc };
  const addData = {};
  if (d.additional_data) {
    const keys = ['bank_name', 'holder_name', 'ifsc_last4'];
    for (const k of keys) {
      if (d.additional_data[k] !== undefined) {
        addData[k] = d.additional_data[k];
      }
    }
  }
  return {
    id: (d._id || d.id).toString(),
    doc_type: d.doc_type,
    doc_number_masked: maskDocNumber(d.doc_number || ''),
    doc_url: d.doc_url,
    status: d.status,
    verification_method: d.verification_method,
    verification_provider: d.verification_provider,
    additional_data: addData,
    submitted_at: d.submitted_at || null,
    verified_at: d.verified_at || null,
    rejection_reason: d.rejection_reason || null,
  };
};

const hasVerifiedIdentity = async (userId) => {
  const count = await KycDocument.countDocuments({
    user_id: userId,
    status: 'approved',
    is_deleted: { $ne: true },
  });
  return count > 0;
};

const submitDocument = async (userId, docType, docNumber, docUrl, additionalData = null) => {
  if (!DOC_TYPES.includes(docType)) {
    throw ApiError.badRequest(`Invalid doc_type. Allowed: ${DOC_TYPES.join(', ')}`);
  }
  if (!docUrl || docUrl.length > 800) {
    throw ApiError.badRequest('doc_url required (max 800 chars)');
  }
  if (!docNumber || docNumber.length > 32) {
    throw ApiError.badRequest('doc_number required (max 32 chars)');
  }

  const existing = await KycDocument.findOne({
    user_id: userId,
    doc_type: docType,
    is_deleted: { $ne: true },
  });

  const add = { ...(additionalData || {}) };
  if (docType === 'bank') {
    if (!add.ifsc || !add.account_number || !add.holder_name) {
      throw ApiError.badRequest('Bank: ifsc, account_number, holder_name required');
    }
    add.ifsc_last4 = add.ifsc.slice(-4);
    add.account_number_hash = hashDocNumber(add.account_number);
    delete add.account_number;
  }

  const now = new Date().toISOString();
  const status = KYC_DEV_MODE ? 'approved' : 'pending';

  const docData = {
    user_id: userId,
    doc_type: docType,
    doc_number: docNumber,
    doc_number_hash: hashDocNumber(docNumber),
    doc_url: docUrl,
    additional_data: add,
    status,
    verification_method: KYC_DEV_MODE ? 'api_auto' : 'admin_manual',
    verification_provider: KYC_DEV_MODE ? 'mock' : null,
    submitted_at: now,
    verified_at: status === 'approved' ? now : null,
    is_deleted: false,
  };

  let saved;
  if (existing) {
    saved = await KycDocument.findOneAndUpdate(
      { _id: existing._id },
      { $set: { ...docData, resubmitted_at: now } },
      { new: true }
    );
  } else {
    saved = await KycDocument.create(docData);
  }

  const verified = await hasVerifiedIdentity(userId);
  if (verified) {
    await User.updateOne({ _id: userId }, { $set: { kyc_status: 'approved' } });
  }

  return serializeIdentityDoc(saved);
};

const listDocuments = async (userId) => {
  const docs = await KycDocument.find({
    user_id: userId,
    is_deleted: { $ne: true },
  }).limit(50);
  return docs.map(serializeIdentityDoc);
};

const getStatusSummary = async (userId) => {
  const docs = await listDocuments(userId);
  const byType = {};
  for (const d of docs) {
    byType[d.doc_type] = d;
  }
  const hasVerified = docs.some(d => d.status === 'approved');
  const summaryDocs = {};
  for (const t of DOC_TYPES) {
    summaryDocs[t] = byType[t] || null;
  }
  return {
    has_verified_identity: hasVerified,
    docs: summaryDocs,
  };
};

const deleteDocument = async (userId, docId) => {
  const doc = await KycDocument.findById(docId);
  if (!doc) {
    throw ApiError.notFound('Not found');
  }
  if (doc.user_id !== userId) {
    throw ApiError.forbidden('Not yours');
  }
  if (doc.status === 'approved') {
    throw ApiError.badRequest('Approved documents cannot be deleted — contact support');
  }
  await KycDocument.updateOne(
    { _id: docId },
    { $set: { is_deleted: true, deleted_at: new Date().toISOString() } }
  );
  return { ok: true };
};

const requireVerifiedIdentity = async (userId) => {
  const verified = await hasVerifiedIdentity(userId);
  if (!verified) {
    throw new ApiError(
      403,
      'Please verify at least one identity document (Aadhaar / PAN / GST / Bank) to unlock this action. Visit /profile/complete?step=verification.'
    );
  }
};

module.exports = {
  submitDocument,
  listDocuments,
  getStatusSummary,
  deleteDocument,
  hasVerifiedIdentity,
  requireVerifiedIdentity,
};
