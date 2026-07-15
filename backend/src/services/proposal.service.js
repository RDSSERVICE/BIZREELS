const Proposal = require('../models/Proposal');
const Requirement = require('../models/Requirement');
const User = require('../models/User');
const chatService = require('./chat.service');
const ApiError = require('../utils/ApiError');

const serializeProposal = (doc) => {
  if (!doc) return null;
  const d = doc.toObject ? doc.toObject() : { ...doc };
  if (d._id) {
    d.id = d._id.toString();
    delete d._id;
  }
  const idFields = ['requirement_id', 'vendor_id'];
  for (const k of idFields) {
    if (d[k]) {
      d[k] = d[k].toString();
    }
  }
  delete d.is_deleted;
  delete d.__v;
  return d;
};

const create = async (vendorId, body) => {
  const rid = body.requirement_id;
  if (!rid) {
    throw ApiError.badRequest('requirement_id required');
  }
  const req = await Requirement.findOne({ _id: rid, is_deleted: { $ne: true } });
  if (!req) {
    throw ApiError.notFound('Requirement not found');
  }
  if (req.status !== 'open') {
    throw ApiError.badRequest('Requirement is no longer open');
  }
  if (req.customer_id === vendorId) {
    throw ApiError.badRequest("You can't propose on your own requirement");
  }

  const p = await Proposal.create({
    requirement_id: rid,
    vendor_id: vendorId,
    message: String(body.message || '').trim() || 'I can help with this.',
    quoted_price: body.quoted_price !== undefined && body.quoted_price !== null ? parseFloat(body.quoted_price) : null,
    attachments: body.attachments || [],
  });

  await Requirement.updateOne({ _id: rid }, { $inc: { proposals_count: 1 } });
  return serializeProposal(p);
};

const listByRequirement = async (reqId, customerId) => {
  const req = await Requirement.findById(reqId);
  if (!req || req.customer_id !== customerId) {
    throw ApiError.forbidden('Only requirement owner can view proposals');
  }

  const docs = await Proposal.find({ requirement_id: reqId, is_deleted: { $ne: true } }).sort({ _id: -1 }).limit(200);
  const vids = Array.from(new Set(docs.map(d => d.vendor_id)));
  const vendors = vids.length > 0 ? await User.find({ _id: { $in: vids } }) : [];
  const vmap = {};
  for (const v of vendors) {
    vmap[v._id.toString()] = v;
  }

  const out = [];
  for (const d of docs) {
    const item = serializeProposal(d);
    const v = vmap[item.vendor_id];
    if (v) {
      item.vendor = {
        id: v._id.toString(),
        name: v.name,
        profile_pic: v.profile_pic,
        phone: v.phone,
      };
    }
    out.push(item);
  }
  return out;
};

const mySent = async (vendorId) => {
  const docs = await Proposal.find({ vendor_id: vendorId, is_deleted: { $ne: true } }).sort({ _id: -1 }).limit(100);
  return docs.map(serializeProposal);
};

const updateStatus = async (pid, customerId, newStatus, autoThread = false) => {
  const p = await Proposal.findById(pid);
  if (!p) {
    throw ApiError.notFound('Proposal not found');
  }
  const req = await Requirement.findById(p.requirement_id);
  if (!req || req.customer_id !== customerId) {
    throw ApiError.forbidden('Not your requirement');
  }

  const now = new Date().toISOString();
  await Proposal.updateOne({ _id: pid }, { $set: { status: newStatus, updated_at: now } });

  const result = { status: newStatus };
  if (newStatus === 'accepted' && autoThread) {
    const thread = await chatService.getOrCreateThread(
      customerId,
      p.vendor_id,
      'requirement',
      p.requirement_id
    );
    await chatService.sendMessage(thread.id, customerId, {
      type: 'system',
      text: 'Proposal accepted. Chat opened.',
    });
    result.thread_id = thread.id;
  }
  return result;
};

const shortlist = async (pid, customerId) => {
  return await updateStatus(pid, customerId, 'shortlisted');
};

const reject = async (pid, customerId) => {
  return await updateStatus(pid, customerId, 'rejected');
};

const accept = async (pid, customerId) => {
  return await updateStatus(pid, customerId, 'accepted', true);
};

module.exports = {
  create,
  listByRequirement,
  mySent,
  shortlist,
  reject,
  accept,
};
