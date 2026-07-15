const User = require('../models/User');
const settingsService = require('./settings.service');
const logger = require('../utils/logger');

let firebaseAdmin = null;
let fbApp = null;

const isDevMode = () => {
  return settingsService.getBool('fcm', 'dev_mode', 'FCM_DEV_MODE', true);
};

const getServiceAccountJson = () => {
  return settingsService.getValue('fcm', 'service_account_json', 'FIREBASE_SERVICE_ACCOUNT_JSON');
};

const getFirebaseApp = () => {
  if (fbApp !== null) return fbApp;
  if (isDevMode()) return null;

  const cfg = getServiceAccountJson();
  if (!cfg) return null;

  try {
    firebaseAdmin = require('firebase-admin');
    let cred;
    if (cfg.startsWith('{')) {
      cred = firebaseAdmin.credential.cert(JSON.parse(cfg));
    } else {
      cred = firebaseAdmin.credential.cert(cfg);
    }
    fbApp = firebaseAdmin.initializeApp({ credential: cred });
    return fbApp;
  } catch (err) {
    logger.warn(`firebase-admin init failed: ${err.message} — falling back to dev log mode`);
    return null;
  }
};

const registerToken = async (userId, token, platform) => {
  let cleanPlatform = platform;
  if (!['web', 'android', 'ios'].includes(platform)) {
    cleanPlatform = 'web';
  }
  if (!token || token.length > 4096) {
    return { ok: false, reason: 'invalid_token' };
  }

  const nowIso = new Date().toISOString();
  await User.updateOne(
    { _id: userId },
    { $pull: { fcm_tokens: { token } } }
  );
  await User.updateOne(
    { _id: userId },
    { $push: { fcm_tokens: { token, platform: cleanPlatform, added_at: nowIso } } }
  );
  return { ok: true };
};

const removeToken = async (userId, token) => {
  await User.updateOne(
    { _id: userId },
    { $pull: { fcm_tokens: { token } } }
  );
  return { ok: true };
};

const getUserTokens = async (userId) => {
  const u = await User.findById(userId, { fcm_tokens: 1 });
  if (!u || !u.fcm_tokens) return [];
  return u.fcm_tokens.map(t => t.token).filter(Boolean);
};

const sendPush = async (userId, title, body, data = {}) => {
  const tokens = await getUserTokens(userId);
  const app = getFirebaseApp();

  if (isDevMode() || !app) {
    logger.info(`[FCM DEV] push user=${userId} tokens=${tokens.length} title="${title}" body="${body}" data=${JSON.stringify(data)}`);
    return { ok: true, dev: true, tokens: tokens.length };
  }

  try {
    if (tokens.length === 0) {
      return { ok: true, sent: 0 };
    }
    const cleanData = {};
    for (const k of Object.keys(data)) {
      cleanData[k] = String(data[k]);
    }
    const response = await firebaseAdmin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: cleanData,
    });
    return { ok: true, sent: response.successCount, failed: response.failureCount };
  } catch (err) {
    logger.warn(`FCM send failed: ${err.message}`);
    return { ok: false, error: err.message };
  }
};

module.exports = {
  registerToken,
  removeToken,
  sendPush,
};
