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
  if (!['customer', 'vendor', 'creator', 'admin'].includes(role)) {
    throw ApiError.badRequest(`Invalid target role: ${role}`);
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

  let isOnboardingRequired = false;
  let targetOnboardingPath = null;
  let targetDashboardPath = null;

  if (role === 'vendor') {
    targetDashboardPath = '/vendor/dashboard';
    const vp = user.vendorProfile || {};
    const isComplete = Boolean(vp.shopName || vp.businessName || vp.store_name);
    if (!isComplete) {
      isOnboardingRequired = true;
      targetOnboardingPath = '/vendor/onboarding';
    }
  } else if (role === 'creator') {
    targetDashboardPath = '/creator/dashboard';
    const cp = user.creatorProfile || {};
    const isComplete = Boolean(cp.displayName || cp.name);
    if (!isComplete) {
      isOnboardingRequired = true;
      targetOnboardingPath = '/creator/onboarding';
    }
  } else if (role === 'customer') {
    targetDashboardPath = '/customer/home';
    const custp = user.customerProfile || {};
    const isComplete = Boolean(
      custp.interestsSelectedAt || (Array.isArray(custp.interests) && custp.interests.length >= 5)
    );
    if (!isComplete) {
      isOnboardingRequired = true;
      targetOnboardingPath = '/customer/choose-interests';
    }
  } else if (role === 'admin') {
    targetDashboardPath = '/admin/dashboard';
  }

  const redirectTo = isOnboardingRequired ? targetOnboardingPath : (targetDashboardPath || '/customer/home');

  return {
    user,
    activeRole: role,
    isOnboardingRequired,
    targetOnboardingPath,
    targetDashboardPath,
    redirectTo,
  };
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
