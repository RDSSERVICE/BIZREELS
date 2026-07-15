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
  if (!user.roles.includes(role)) {
    user.roles.push(role);
    await user.save();
  }
  return user;
};

const switchRole = async (userId, role) => {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');
  if (!user.roles.includes(role)) throw ApiError.badRequest(`You don't have the ${role} role`);
  user.current_role = role;
  await user.save();
  return user;
};

const updateProfile = async (userId, updates) => {
  const allowed = ['name', 'email', 'gender', 'dob', 'profile_pic', 'city'];
  const clean = {};
  for (const k of allowed) {
    if (updates[k] !== undefined) clean[k] = updates[k];
  }
  if (Object.keys(clean).length === 0) throw ApiError.badRequest('No updatable fields');

  const user = await User.findByIdAndUpdate(userId, { $set: clean }, { new: true });
  if (!user) throw ApiError.notFound('User not found');
  return user;
};

module.exports = { getUserById, addRole, switchRole, updateProfile };
