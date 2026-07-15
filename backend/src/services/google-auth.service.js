const axios = require('axios');
const User = require('../models/User');
const authService = require('./auth.service');
const walletService = require('./wallet.service');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const EMERGENT_SESSION_DATA_URL = 'https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data';

const fetchGoogleIdentity = async (sessionId) => {
  try {
    const res = await axios.get(EMERGENT_SESSION_DATA_URL, {
      headers: { 'X-Session-ID': sessionId },
      timeout: 15000,
    });
    const data = res.data;
    if (!data || !data.email) {
      throw new ApiError(400, 'Missing email in Google response');
    }
    return data;
  } catch (err) {
    if (err.response?.status === 401) {
      throw new ApiError(401, 'Invalid or expired Google session');
    }
    if (err.statusCode) throw err;
    throw new ApiError(502, `Google auth upstream unreachable: ${err.message}`);
  }
};

const exchangeSessionAndLogin = async (sessionId) => {
  const ident = await fetchGoogleIdentity(sessionId);
  const email = String(ident.email).trim().toLowerCase();
  const name = String(ident.name || '').trim() || null;
  const picture = ident.picture || null;

  const nowIso = new Date().toISOString();
  let existing = await User.findOne({ email });
  let isNewUser = false;
  let userDoc;

  if (existing) {
    const providers = existing.auth_providers || [];
    if (!providers.some(p => p.provider === 'google')) {
      providers.push({ provider: 'google', identifier: email, linked_at: nowIso });
    }
    const updates = { auth_providers: providers, updated_at: nowIso };
    if (!existing.name && name) {
      updates.name = name;
    }
    if (!existing.profile_pic && picture) {
      updates.profile_pic = picture;
    }
    if (existing.is_deleted) {
      updates.is_deleted = false;
      updates.is_active = true;
      updates.is_test_data = false;
    }

    await User.updateOne({ _id: existing._id }, { $set: updates });
    userDoc = await User.findById(existing._id);
  } else {
    isNewUser = true;
    userDoc = await User.create({
      phone: null,
      name,
      email,
      profile_pic: picture,
      roles: ['customer'],
      current_role: 'customer',
      auth_providers: [{ provider: 'google', identifier: email, linked_at: nowIso }],
    });

    // Grant signup bonus
    try {
      await walletService.getOrCreate(userDoc._id.toString());
      await walletService.earnCredits(
        userDoc._id.toString(),
        50,
        'google_signup_bonus',
        'signup',
        userDoc._id.toString()
      );
    } catch (err) {
      logger.error('google signup bonus grant failed:', err.message);
    }
  }

  // Issue tokens
  const tokens = await authService.issueTokens(userDoc);
  const userOut = authService.serializeUser(userDoc);

  return {
    ...tokens,
    user: userOut,
    is_new_user: isNewUser,
  };
};

module.exports = {
  exchangeSessionAndLogin,
};
