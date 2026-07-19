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
  return user;
};

const switchRole = async (userId, role) => {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');
  if (user.roles.includes('admin') && role !== 'admin') {
    throw ApiError.forbidden('Admin accounts cannot switch to non-admin roles');
  }
  if (!user.roles.includes(role)) throw ApiError.badRequest(`You don't have the ${role} role`);
  user.current_role = role;
  user.activeRole = role;
  await user.save();
  return user;
};

const updateProfile = async (userId, updates) => {
  const allowed = [
    'name', 'email', 'phone', 'gender', 'dob', 'occupation', 'language',
    'profile_pic', 'avatarUrl', 'city', 'location', 'customerProfile',
    'vendorProfile', 'creatorProfile'
  ];
  const clean = {};
  for (const k of allowed) {
    if (updates[k] !== undefined) clean[k] = updates[k];
  }
  if (Object.keys(clean).length === 0) throw ApiError.badRequest('No updatable fields');

  const user = await User.findByIdAndUpdate(userId, { $set: clean }, { returnDocument: 'after' });
  if (!user) throw ApiError.notFound('User not found');
  return user;
};

const serialize = (user) => {
  if (!user) return null;
  const obj = user.toObject ? user.toObject() : user;
  delete obj.password;
  delete obj.resetPasswordOtpHash;
  return obj;
};

module.exports = { getUserById, addRole, switchRole, updateProfile, serialize };
