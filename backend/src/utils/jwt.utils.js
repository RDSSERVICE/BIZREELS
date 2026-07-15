const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');

/**
 * Create an access token (short-lived).
 */
const createAccessToken = (userId, roles, currentRole) => {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: userId,
    roles,
    role: currentRole,
    type: 'access',
    iat: now,
    exp: now + config.accessTokenMinutes * 60,
  };
  return jwt.sign(payload, config.jwtSecret, { algorithm: config.jwtAlgorithm });
};

/**
 * Create a refresh token pair (opaque token + hash + expiry).
 * @returns {{ raw: string, tokenHash: string, expiresAt: Date }}
 */
const createRefreshTokenPair = (userId) => {
  const raw = crypto.randomBytes(48).toString('base64url');
  const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
  const expiresAt = new Date(Date.now() + config.refreshTokenDays * 24 * 60 * 60 * 1000);
  return { raw, tokenHash, expiresAt };
};

/**
 * Hash a raw refresh token for comparison.
 */
const hashRefreshToken = (raw) => {
  return crypto.createHash('sha256').update(raw).digest('hex');
};

/**
 * Decode/verify an access token.
 */
const decodeAccessToken = (token) => {
  return jwt.verify(token, config.jwtSecret, { algorithms: [config.jwtAlgorithm] });
};

module.exports = {
  createAccessToken,
  createRefreshTokenPair,
  hashRefreshToken,
  decodeAccessToken,
};
