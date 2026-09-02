const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user || user.is_deleted) return null;
  return user;
};

const addRole = async (userId, role) => {
  const validRoles = ['customer', 'vendor', 'creator'];
  if (!validRoles.includes(role)) throw ApiError.badRequest('Invalid role');
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');
  if (user.roles.includes('admin')) {
    throw ApiError.forbidden('Admin accounts cannot add user roles');
  }
  if (!user.roles.includes(role)) {
    user.roles.push(role);
  }
  user.current_role = role;
  user.activeRole = role;
  await user.save();
  try {
    const cache = require('../utils/cache');
    await cache.deleteCache(`user:auth:${userId}`);
  } catch (err) {}
  return user;
};

const switchRole = async (userId, role) => {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');
  if (user.roles.includes('admin') && role !== 'admin') {
    throw ApiError.forbidden('Admin accounts cannot switch to non-admin roles');
  }
  if (!user.roles.includes(role)) {
    const hasVendorProfile = role === 'vendor' && user.vendorProfile && (user.vendorProfile.shopName || user.vendorProfile.businessName || user.vendorProfile.businessType || (user.vendorProfile.categories && user.vendorProfile.categories.length > 0));
    const hasCreatorProfile = role === 'creator' && user.creatorProfile && (user.creatorProfile.displayName || user.creatorProfile.name || user.creatorProfile.handle || (user.creatorProfile.categories && user.creatorProfile.categories.length > 0));

    if (hasVendorProfile || hasCreatorProfile) {
      user.roles.push(role);
    } else {
      throw ApiError.badRequest(`You don't have the ${role} role`);
    }
  }
  user.current_role = role;
  user.activeRole = role;
  await user.save();
  try {
    const cache = require('../utils/cache');
    await cache.deleteCache(`user:auth:${userId}`);
  } catch (err) {}
  return user;
};

const updateProfile = async (userId, updates) => {
  const allowed = [
    'name', 'email', 'phone', 'gender', 'dob', 'occupation', 'profession', 'language',
    'profile_pic', 'avatarUrl', 'city', 'location', 'customerProfile',
    'vendorProfile', 'creatorProfile'
  ];

  const clean = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) {
      clean[key] = updates[key];
    }
  }
  if (clean.phone) {
    const digits = String(clean.phone).replace(/\D/g, '');
    if (digits.length === 10) {
      clean.phone = `+91${digits}`;
    } else if (digits.length === 12 && digits.startsWith('91')) {
      clean.phone = `+${digits}`;
    }
  }
  if (Object.keys(clean).length === 0) throw ApiError.badRequest('No updatable fields');

  const user = await User.findByIdAndUpdate(userId, { $set: clean }, { returnDocument: 'after' });
  if (!user) throw ApiError.notFound('User not found');
  try {
    const cache = require('../utils/cache');
    await cache.deleteCache(`user:auth:${userId}`);
  } catch (err) {}
  return user;
};

const serialize = (user) => {
  if (!user) return null;
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.resetPasswordOtpHash;
  delete obj.resetPasswordExpires;

  if (!Array.isArray(obj.roles)) {
    obj.roles = ['customer'];
  }
  const vp = obj.vendorProfile;
  if (vp && (vp.shopName || vp.businessName || vp.businessType || (vp.categories && vp.categories.length > 0)) && !obj.roles.includes('vendor')) {
    obj.roles.push('vendor');
  }
  const cp = obj.creatorProfile;
  if (cp && (cp.displayName || cp.name || cp.handle || (cp.categories && cp.categories.length > 0)) && !obj.roles.includes('creator')) {
    obj.roles.push('creator');
  }

  return obj;
};

module.exports = { getUserById, addRole, switchRole, updateProfile, serialize };
