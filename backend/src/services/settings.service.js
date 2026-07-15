const { PlatformSettings } = require('../models/Misc');
const config = require('../config');
const logger = require('../utils/logger');

const SINGLETON_ID = 'singleton';
const CACHE_TTL_MS = 60 * 1000;

let _cache = {};
let _cacheLoadedAt = 0;

const INTEGRATIONS = ['msg91', 'cloudinary', 'razorpay', 'fcm', 'ai_content'];

const SECRET_FIELDS = {
  msg91: ['auth_key'],
  cloudinary: ['api_secret'],
  razorpay: ['key_secret', 'webhook_secret'],
  fcm: ['service_account_json'],
  ai_content: ['api_key'],
};

const getEnvDefaults = () => {
  return {
    msg91: {
      auth_key: (process.env.MSG91_AUTH_KEY || '').trim(),
      template_id: (process.env.MSG91_TEMPLATE_ID || '').trim(),
      sender_id: (process.env.MSG91_SENDER_ID || '').trim(),
      txn_template_id: (process.env.MSG91_TXN_TEMPLATE_ID || '').trim(),
      dev_mode: process.env.OTP_DEV_MODE === 'true' || process.env.MSG91_DEV_MODE === 'true',
    },
    cloudinary: {
      cloud_name: (process.env.CLOUDINARY_CLOUD_NAME || '').trim(),
      api_key: (process.env.CLOUDINARY_API_KEY || '').trim(),
      api_secret: (process.env.CLOUDINARY_API_SECRET || '').trim(),
      upload_preset: (process.env.CLOUDINARY_UPLOAD_PRESET || '').trim(),
      dev_mode: process.env.CLOUDINARY_DEV_MODE === 'true',
    },
    razorpay: {
      key_id: (process.env.RAZORPAY_KEY_ID || '').trim(),
      key_secret: (process.env.RAZORPAY_KEY_SECRET || '').trim(),
      webhook_secret: (process.env.RAZORPAY_WEBHOOK_SECRET || '').trim(),
      dev_mode: process.env.RAZORPAY_DEV_MODE === 'true',
    },
    fcm: {
      service_account_json: (process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '').trim(),
      dev_mode: process.env.FCM_DEV_MODE === 'true',
    },
    ai_content: {
      provider: (process.env.AI_PROVIDER || 'openai').trim(),
      model: (process.env.AI_MODEL || 'gpt-5.4').trim(),
      api_key: '',
      enabled: process.env.AI_DEV_MODE !== 'true',
    },
  };
};

const applyToCache = (doc) => {
  const snap = {};
  for (const name of INTEGRATIONS) {
    snap[name] = { ...(doc[name] || {}) };
  }
  _cache = snap;
  _cacheLoadedAt = Date.now();
};

const initializeDefaultsOnStartup = async () => {
  try {
    let doc = await PlatformSettings.findOne({ key: SINGLETON_ID });
    const defaults = getEnvDefaults();
    if (!doc) {
      const now = new Date().toISOString();
      doc = await PlatformSettings.create({
        key: SINGLETON_ID,
        value: defaults,
      });
      logger.info('platform_settings: seeded singleton from env defaults');
    } else {
      // Schema evolution over time / backfill
      const val = doc.value || {};
      let updated = false;
      for (const name of INTEGRATIONS) {
        if (!val[name]) {
          val[name] = defaults[name];
          updated = true;
        }
      }
      if (updated) {
        doc.value = val;
        doc.markModified('value');
        await doc.save();
        logger.info(`platform_settings: backfilled missing blocks`);
      }
    }
    applyToCache(doc.value || {});
  } catch (err) {
    logger.error('platform_settings initialize error:', err.message);
  }
};

const refreshCache = async () => {
  const doc = await PlatformSettings.findOne({ key: SINGLETON_ID });
  if (doc && doc.value) {
    applyToCache(doc.value);
  }
};

const getFullDoc = async () => {
  if (Date.now() - _cacheLoadedAt > CACHE_TTL_MS) {
    await refreshCache();
  }
  const doc = await PlatformSettings.findOne({ key: SINGLETON_ID });
  return doc ? doc.value : {};
};

const getIntegrationSync = (name) => {
  return _cache[name] || {};
};

const getValue = (integration, key, envFallback = null) => {
  const v = getIntegrationSync(integration)[key];
  if (v !== undefined && v !== null && v !== '') {
    return String(v).trim();
  }
  if (envFallback) {
    return (process.env[envFallback] || '').trim();
  }
  return '';
};

const getBool = (integration, key, envFallback, defaultValue = false) => {
  const snap = getIntegrationSync(integration);
  if (snap[key] !== undefined && snap[key] !== null) {
    const val = snap[key];
    if (typeof val === 'boolean') {
      return val;
    }
    return ['1', 'true', 'yes'].includes(String(val).trim().toLowerCase());
  }
  const v = process.env[envFallback];
  if (v === undefined || v === null) {
    return defaultValue;
  }
  return ['1', 'true', 'yes'].includes(v.trim().toLowerCase());
};

const maskString = (val) => {
  if (!val) return '';
  if (val.length <= 8) return '****';
  return `****${val.slice(-4)}`;
};

const getMasked = async () => {
  const doc = await getFullDoc();
  const out = {};
  for (const name of INTEGRATIONS) {
    const block = { ...(doc[name] || {}) };
    const secrets = SECRET_FIELDS[name] || [];
    for (const secretKey of secrets) {
      if (block[secretKey]) {
        block[secretKey] = maskString(String(block[secretKey]));
      }
    }
    out[name] = block;
  }
  return out;
};

const updateSettings = async (patch, updatedBy = null) => {
  const doc = await PlatformSettings.findOne({ key: SINGLETON_ID });
  const currentValue = doc ? doc.value : {};

  const newValue = { ...currentValue };
  for (const name of INTEGRATIONS) {
    if (patch[name] && typeof patch[name] === 'object') {
      const blockPatch = patch[name];
      const currentBlock = currentValue[name] || {};
      const mergedBlock = { ...currentBlock };
      const secrets = SECRET_FIELDS[name] || [];

      for (const k of Object.keys(blockPatch)) {
        const v = blockPatch[k];
        if (secrets.includes(k)) {
          if (typeof v === 'string' && (v === '' || v.startsWith('****'))) {
            continue;
          }
          mergedBlock[k] = v;
        } else {
          mergedBlock[k] = v;
        }
      }
      newValue[name] = mergedBlock;
    }
  }

  await PlatformSettings.updateOne(
    { key: SINGLETON_ID },
    { $set: { value: newValue } },
    { upsert: true }
  );

  await refreshCache();
  return await getMasked();
};

module.exports = {
  initializeDefaultsOnStartup,
  getIntegrationSync,
  getValue,
  getBool,
  getMasked,
  updateSettings,
};
