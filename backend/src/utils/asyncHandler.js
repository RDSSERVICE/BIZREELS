/**
 * Wraps an async Express route handler to catch errors
 * and forward them to Express error-handling middleware.
 *
 * Usage: router.get('/route', asyncHandler(controller.method))
 *
 * @param {Function} fn - Async function (req, res, next) => Promise
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
