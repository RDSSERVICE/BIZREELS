const ApiError = require('../utils/ApiError');

/**
 * Role-Based Access Middleware
 * Verifies the authenticated user has at least one of the allowedRoles.
 * Usage: router.get('/vendor/data', authenticate, roleMiddleware('vendor'), controller)
 */
const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required.'));
    }

    const userRoles = req.user.roles || [];
    const hasRole = allowedRoles.some(r => userRoles.includes(r));

    if (!hasRole) {
      return next(ApiError.forbidden('403 Forbidden: You do not have the required role to access this resource.'));
    }

    next();
  };
};

module.exports = { roleMiddleware };
