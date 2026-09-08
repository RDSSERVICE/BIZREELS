const mongoose = require('mongoose');
const User = require('../../models/User');
const { Wallet } = require('../../models/Phase4');
const { AuditLog } = require('../../models/Misc');
const walletService = require('../wallet.service');
const ApiError = require('../../utils/ApiError');
const { deleteCache } = require('../../utils/cache');

const VALID_USER_ROLES_ADD = new Set(['customer', 'vendor', 'creator']);

const serializeUserAdmin = (u) => {
  return {
    id: u._id.toString(),
    phone: u.phone,
    name: u.name,
    roles: u.roles || [],
    kyc_status: u.kyc_status || 'unverified',
    is_active: u.is_active !== false,
    is_banned: u.is_banned || false,
    is_subscribed_verified: u.is_subscribed_verified || false,
    rating_avg: u.rating_avg || 0.0,
    trust_score: u.trust_score,
    created_at: u.created_at,
  };
};

const listUsers = async ({ q, role, is_active, kyc_status, is_subscribed_verified, cursor, limit = 20 }) => {
  const query = { is_deleted: { $ne: true } };

  if (q) {
    const escaped = String(q).trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const _q = escaped.slice(0, 80);
    query.$or = [
      { phone: { $regex: _q } },
      { name: { $regex: _q, $options: 'i' } },
    ];
  }
  if (role) {
    query.roles = role;
  }
  if (is_active !== null && is_active !== undefined) {
    query.is_active = is_active;
  }
  if (kyc_status) {
    query.kyc_status = kycStatusNormalized(kyc_status);
  }
  if (is_subscribed_verified !== null && is_subscribed_verified !== undefined) {
    query.is_subscribed_verified = is_subscribed_verified;
  }
  if (cursor) {
    query._id = { $lt: new mongoose.Types.ObjectId(cursor) };
  }

  const limitNum = Math.min(Math.max(1, parseInt(limit, 10) || 20), 100);

  const [users, total] = await Promise.all([
    User.find(query).sort({ _id: -1 }).limit(limitNum + 1),
    User.countDocuments(query),
  ]);

  const hasNextPage = users.length > limitNum;
  const items = hasNextPage ? users.slice(0, limitNum) : users;
  const nextCursor = hasNextPage ? items[items.length - 1]._id.toString() : null;

  return {
    items: items.map(serializeUserAdmin),
    total,
    next_cursor: nextCursor,
    limit: limitNum,
  };
};

const kycStatusNormalized = (s) => {
  const map = {
    pending: 'pending',
    approved: 'approved',
    verified: 'approved',
    rejected: 'rejected',
    unverified: 'unverified',
  };
  return map[s] || s;
};

const flipUser = async (userId, updates) => {
  const u = await User.findById(userId);
  if (!u) {
    throw ApiError.notFound('User not found');
  }
  if ((u.roles || []).includes('admin')) {
    throw ApiError.forbidden('Cannot modify an admin account');
  }
  updates.updated_at = new Date().toISOString();
  await User.updateOne({ _id: userId }, { $set: updates });

  try {
    const { emitToAdmin } = require('../../sockets');
    emitToAdmin('admin:update', { tags: ['AdminUsers', 'AdminOverview'] });
  } catch (err) {}

  await deleteCache('admin:customer:stats').catch(() => {});
  await deleteCache('admin:vendor:stats').catch(() => {});

  return { ok: true, user_id: userId };
};

const banUser = async (userId) => {
  return await flipUser(userId, { is_banned: true, is_active: false });
};

const unbanUser = async (userId) => {
  return await flipUser(userId, { is_banned: false, is_active: true });
};

const freezeWallet = async (userId) => {
  const uid = userId.toString();
  try {
    await walletService.getOrCreateWallet(uid);
  } catch (err) {}

  await Wallet.updateOne({ user_id: uid }, { $set: { is_frozen: true, updated_at: new Date().toISOString() } });

  try {
    const IsolatedWallet = require('../../models/IsolatedWallet.model');
    await IsolatedWallet.updateMany({ userId: uid }, { $set: { is_frozen: true } });
  } catch (err) {}

  try {
    const { emitToAdmin } = require('../../sockets');
    emitToAdmin('admin:update', { tags: ['AdminUsers', 'AdminWallet'] });
  } catch (err) {}

  return { ok: true, user_id: userId };
};

const unfreezeWallet = async (userId) => {
  const uid = userId.toString();
  try {
    await walletService.getOrCreateWallet(uid);
  } catch (err) {}

  await Wallet.updateOne({ user_id: uid }, { $set: { is_frozen: false, updated_at: new Date().toISOString() } });

  try {
    const IsolatedWallet = require('../../models/IsolatedWallet.model');
    await IsolatedWallet.updateMany({ userId: uid }, { $set: { is_frozen: false } });
  } catch (err) {}

  try {
    const { emitToAdmin } = require('../../sockets');
    emitToAdmin('admin:update', { tags: ['AdminUsers', 'AdminWallet'] });
  } catch (err) {}

  return { ok: true, user_id: userId };
};

const addRole = async (userId, role) => {
  if (!VALID_USER_ROLES_ADD.has(role)) {
    throw ApiError.badRequest(`role must be in ${Array.from(VALID_USER_ROLES_ADD).sort().join(', ')}`);
  }
  const u = await User.findById(userId);
  if (!u) {
    throw ApiError.notFound('User not found');
  }
  await User.updateOne(
    { _id: userId },
    {
      $addToSet: { roles: role },
      $set: { updated_at: new Date().toISOString() },
    }
  );

  try {
    const { emitToAdmin } = require('../../sockets');
    emitToAdmin('admin:update', { tags: ['AdminUsers', 'AdminOverview'] });
  } catch (err) {}

  return { ok: true, user_id: userId, role };
};

const removeRole = async (userId, role) => {
  if (!VALID_USER_ROLES_ADD.has(role)) {
    throw ApiError.badRequest(`role must be in ${Array.from(VALID_USER_ROLES_ADD).sort().join(', ')}`);
  }
  const u = await User.findById(userId);
  if (!u) {
    throw ApiError.notFound('User not found');
  }
  const currentRoles = u.roles || [];
  if (currentRoles.length <= 1 && currentRoles.includes(role)) {
    throw ApiError.badRequest('Cannot remove the only role of a user');
  }
  await User.updateOne(
    { _id: userId },
    {
      $pull: { roles: role },
      $set: { updated_at: new Date().toISOString() },
    }
  );

  try {
    const { emitToAdmin } = require('../../sockets');
    emitToAdmin('admin:update', { tags: ['AdminUsers', 'AdminOverview'] });
  } catch (err) {}

  return { ok: true, user_id: userId, role };
};

const getUserDetail = async (userId) => {
  const u = await User.findById(userId);
  if (!u || u.is_deleted) throw ApiError.notFound('User not found');

  let walletData = null;
  try {
    const w = await Wallet.findOne({ user_id: userId.toString() });
    if (w) {
      walletData = {
        credits: w.credits,
        balance_inr_paise: w.balance_inr_paise,
        is_frozen: w.is_frozen,
      };
    }
  } catch (e) {}

  return {
    ...serializeUserAdmin(u),
    email: u.email,
    gender: u.gender,
    dob: u.dob,
    city: u.city || u.location?.city,
    state: u.location?.state,
    pincode: u.location?.pincode,
    profile_pic: u.profile_pic || u.avatarUrl,
    vendor_profile: u.vendorProfile,
    creator_profile: u.creatorProfile,
    followersCount: u.followersCount || 0,
    followingCount: u.followingCount || 0,
    wallet: walletData,
  };
};

const updateUser = async (userId, updates) => {
  const u = await User.findById(userId);
  if (!u) throw ApiError.notFound('User not found');
  if ((u.roles || []).includes('admin')) throw ApiError.forbidden('Cannot modify an admin account');

  const allowed = ['name', 'email', 'gender', 'dob', 'city'];
  const safeUpdates = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) safeUpdates[key] = updates[key];
  }
  safeUpdates.updated_at = new Date().toISOString();
  await User.updateOne({ _id: userId }, { $set: safeUpdates });

  try {
    const { emitToAdmin } = require('../../sockets');
    emitToAdmin('admin:update', { tags: ['AdminUsers', 'AdminOverview'] });
  } catch (err) {}

  return { ok: true, user_id: userId };
};

const suspendUser = async (userId) => {
  return await flipUser(userId, { is_active: false });
};

const activateUser = async (userId) => {
  return await flipUser(userId, { is_active: true, is_banned: false });
};

const verifyUser = async (userId) => {
  return await flipUser(userId, { kyc_status: 'approved' });
};

const resetUserPassword = async (userId, newPassword) => {
  const u = await User.findById(userId);
  if (!u) throw ApiError.notFound('User not found');
  if ((u.roles || []).includes('admin')) throw ApiError.forbidden('Cannot modify an admin account');

  u.password = newPassword;
  u.updated_at = new Date().toISOString();
  await u.save();

  try {
    const { emitToAdmin } = require('../../sockets');
    emitToAdmin('admin:update', { tags: ['AdminUsers'] });
  } catch (err) {}

  return { ok: true, user_id: userId };
};

const deleteUser = async (userId) => {
  const result = await flipUser(userId, { is_deleted: true, isDeleted: true, is_active: false, isActive: false });

  // Cascade delete user-related collections
  try {
    const Reel = require('../../models/Reel');
    const Listing = require('../../models/Listing');
    const Comment = require('../../models/Comment');
    const ReelLike = require('../../models/ReelLike');
    const Requirement = require('../../models/Requirement');
    const Review = require('../../models/Review');
    const Offer = require('../../models/Offer');
    const Inquiry = require('../../models/Inquiry');
    const HireRequest = require('../../models/HireRequest');
    const Follow = require('../../models/Follow');
    const Conversation = require('../../models/Conversation');
    const Message = require('../../models/Message');
    const RefreshToken = require('../../models/RefreshToken');
    const Order = require('../../models/Order');
    const Deal = require('../../models/Deal');
    const Notification = require('../../models/Notification');
    const Proposal = require('../../models/Proposal');
    const Quote = require('../../models/Quote');

    await Promise.all([
      Reel.deleteMany({ creator: userId }),
      Listing.deleteMany({ vendor: userId }),
      Comment.deleteMany({ user: userId }),
      ReelLike.deleteMany({ user: userId }),
      Requirement.deleteMany({ customer: userId }),
      Review.deleteMany({ $or: [{ author: userId }, { targetUser: userId }] }),
      Offer.deleteMany({ $or: [{ userId: userId }, { createdBy: userId }] }),
      Inquiry.deleteMany({ $or: [{ customer: userId }, { vendor: userId }] }),
      HireRequest.deleteMany({ $or: [{ vendor: userId }, { creator: userId }] }),
      Follow.deleteMany({ $or: [{ follower_id: userId.toString() }, { following_id: userId.toString() }] }),
      Conversation.deleteMany({ participants: userId }),
      Message.deleteMany({ sender: userId }),
      RefreshToken.deleteMany({ user: userId }),
      Order.deleteMany({ $or: [{ customer: userId }, { vendor: userId }] }),
      Deal.deleteMany({ $or: [{ buyer_id: userId.toString() }, { seller_id: userId.toString() }] }),
      Notification.deleteMany({ $or: [{ recipient: userId }, { sender: userId }, { recipient: userId.toString() }, { sender: userId.toString() }] }),
      Proposal.deleteMany({ vendor_id: userId }),
      Quote.deleteMany({ vendor: userId })
    ]);
  } catch (err) {
    console.error('Error cascading deletion for user ' + userId + ' in admin deleteUser:', err);
  }

  return result;
};

const getLoginHistory = async (userId, limit = 20) => {
  const logs = await AuditLog.find({
    user_id: userId,
    action: { $in: ['login', 'logout', 'login_failed'] },
  }).sort({ _id: -1 }).limit(limit);

  return {
    items: logs.map(l => ({
      id: l._id.toString(),
      action: l.action,
      ip: l.ip || l.meta?.ip || null,
      user_agent: l.meta?.user_agent || null,
      created_at: l.created_at,
    })),
  };
};

module.exports = {
  serializeUserAdmin,
  listUsers,
  banUser,
  unbanUser,
  freezeWallet,
  unfreezeWallet,
  addRole,
  removeRole,
  getUserDetail,
  updateUser,
  suspendUser,
  activateUser,
  verifyUser,
  resetUserPassword,
  deleteUser,
  getLoginHistory,
};
