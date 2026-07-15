const mongoose = require('mongoose');

/**
 * Serialize a Mongoose document or plain object for API response.
 * Converts _id to id string, stringifies ObjectId fields.
 */
const serializeDoc = (doc, idFields = []) => {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  if (obj._id) {
    obj.id = obj._id.toString();
    delete obj._id;
  }
  delete obj.__v;
  for (const field of idFields) {
    if (obj[field]) {
      obj[field] = obj[field].toString();
    }
  }
  return obj;
};

/**
 * Validate that a string is a valid MongoDB ObjectId.
 */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Get current ISO timestamp string.
 */
const nowISO = () => new Date().toISOString();

const TEST_DATA_REGEX = '^(test\\b|test_|[uv]\\d+ |[uv]\\d+$)';

/**
 * Build a filter to exclude test/seed data from public queries.
 */
const notTestFilter = (nameField = 'title') => ({
  is_test_data: { $ne: true },
  [nameField]: { $not: { $regex: TEST_DATA_REGEX, $options: 'i' } },
});

/**
 * Catch-async wrapper for Express route handlers.
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  serializeDoc,
  isValidObjectId,
  nowISO,
  notTestFilter,
  catchAsync,
};
