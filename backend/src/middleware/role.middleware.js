const ApiError = require('../utils/ApiError');

/**
 * Factory that returns middleware requiring user to have at least one of the given roles.
 * Must be used AFTER requireAuth.
 */
const requireRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    const userRoles = req.user.roles || [];
    const hasRole = roles.some(r => userRoles.includes(r));
    if (!hasRole) {
      return next(ApiError.forbidden(`Requires role: ${roles.join(', ')}`));
    }
    next();
  };
};

/**
 * Check if user is admin (helper, not middleware).
 */
const isAdmin = (user) => (user.roles || []).includes('admin');

/**
 * Check if user is vendor.
 */
const isVendor = (user) => (user.roles || []).includes('vendor');

module.exports = { requireRoles, isAdmin, isVendor };
