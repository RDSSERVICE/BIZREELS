const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const CACHE_TTL_MS = 30 * 1000;
const _cache = { phones: new Set(), loadedAt: 0 };
const ENV_PATH = path.resolve(__dirname, '..', '..', '.env');

const getRandomIndianPhone = () => {
  const prefixes = ['6', '7', '8', '9'];
  const start = prefixes[Math.floor(Math.random() * prefixes.length)];
  let body = '';
  for (let i = 0; i < 9; i++) {
    body += Math.floor(Math.random() * 10);
  }
  return start + body;
};

const loadAdminPhonesFromDB = async () => {
  const docs = await User.find(
    { roles: 'admin', is_deleted: { $ne: true }, phone: { $exists: true } },
    { phone: 1 }
  );
  return new Set(docs.map(d => d.phone).filter(Boolean));
};

const refreshCache = async () => {
  const phonesSet = await loadAdminPhonesFromDB();
  _cache.phones = phonesSet;
  _cache.loadedAt = Date.now();
};

const getAdminPhones = async () => {
  if (Date.now() - _cache.loadedAt > CACHE_TTL_MS) {
    await refreshCache();
  }
  return new Set(_cache.phones);
};

const isAdminPhoneSync = (phone) => {
  return _cache.phones.has(phone);
};

const isOtpHidden = (phone) => {
  const raw = (process.env.HIDDEN_OTP_PHONES || '').trim();
  if (!raw) {
    const seed = (process.env.ADMIN_SEED_PHONE || '').trim();
    return !!seed && phone === seed;
  }
  const hidden = new Set(raw.split(',').map(p => p.trim()).filter(Boolean));
  return hidden.has(phone);
};

const persistEnvVar = (key, value) => {
  try {
    let lines = [];
    if (fs.existsSync(ENV_PATH)) {
      lines = fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/);
    }
    let found = false;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith(`${key}=`)) {
        lines[i] = `${key}=${value}`;
        found = true;
        break;
      }
    }
    if (!found) {
      lines.push(`${key}=${value}`);
    }
    fs.writeFileSync(ENV_PATH, lines.join('\n') + '\n');
  } catch (err) {
    logger.error(`Failed to persist env ${key}:`, err.message);
  }
};

const persistTestCredentials = (phone) => {
  try {
    const backendDir = path.resolve(__dirname, '..', '..');
    const credPath = path.join(backendDir, 'admin_phone.txt');
    let text = `# Current admin phone (auto-rotated). OTP is dev-mode only and\n` +
               `# is NOT echoed in HTTP responses for admin phones — grep the\n` +
               `# backend logs for 'Mock OTP for ${phone}' to fetch it.\n` +
               `${phone}\n`;
    fs.writeFileSync(credPath, text);
  } catch (err) {
    logger.error('Failed to write admin_phone.txt:', err.message);
  }
};

const ensureDevAdminToken = async () => {
  let tok = (process.env.DEV_ADMIN_OVERRIDE_TOKEN || '').trim();
  if (!tok) {
    tok = crypto.randomBytes(48).toString('base64url');
    persistEnvVar('DEV_ADMIN_OVERRIDE_TOKEN', tok);
    process.env.DEV_ADMIN_OVERRIDE_TOKEN = tok;
  }
  try {
    const credPath = path.join(__dirname, '..', '..', 'admin_phone.txt');
    if (fs.existsSync(credPath)) {
      let text = fs.readFileSync(credPath, 'utf8');
      if (!text.includes('DEV_ADMIN_OVERRIDE_TOKEN')) {
        text = text.trim() + `\n\n# Dev-mode admin override (POST /api/v1/auth/dev/admin-login with {token})\nDEV_ADMIN_OVERRIDE_TOKEN=${tok}\n`;
        fs.writeFileSync(credPath, text);
      }
    }
  } catch (err) {
    logger.error('Failed to write admin override token to admin_phone.txt:', err.message);
  }
  return tok;
};

const sanitizeAdminUsers = async () => {
  try {
    const adminDocs = await User.find({
      $or: [{ roles: 'admin' }, { email: 'admin@bidzord.com' }, { name: 'Super Admin' }]
    });

    for (const doc of adminDocs) {
      let changed = false;
      if (!Array.isArray(doc.roles) || doc.roles.length !== 1 || doc.roles[0] !== 'admin') {
        doc.roles = ['admin'];
        changed = true;
      }
      if (doc.current_role !== 'admin') {
        doc.current_role = 'admin';
        changed = true;
      }
      if (doc.activeRole !== 'admin') {
        doc.activeRole = 'admin';
        changed = true;
      }
      if (changed) {
        await doc.save();
        logger.info(`Sanitized admin user ${doc._id} (${doc.email || doc.phone}): roles reset to ['admin'] strictly.`);
      }
    }
  } catch (err) {
    logger.error('Failed to sanitize admin users:', err.message);
  }
};

const ensureAdminSeed = async () => {
  await sanitizeAdminUsers();

  if (process.env.SEED_ADMIN_ON_STARTUP !== 'true') {
    await refreshCache();
    return '';
  }

  let existing = await User.findOne({ roles: 'admin', is_deleted: { $ne: true } }).sort({ created_at: 1 });
  if (existing) {
    const phone = existing.phone || '';
    await refreshCache();
    await ensureDevAdminToken();
    return phone;
  }

  const phone = (process.env.ADMIN_SEED_PHONE || '').trim() || getRandomIndianPhone();
  await User.create({
    phone,
    name: 'Admin',
    roles: ['admin'],
    current_role: 'admin',
    activeRole: 'admin',
  });
  persistEnvVar('ADMIN_SEED_PHONE', phone);
  persistTestCredentials(phone);
  logger.info(`Seeded admin user with randomised phone: ${phone}`);
  await refreshCache();
  await ensureDevAdminToken();
  return phone;
};

const devAdminLogin = async (token) => {
  if (process.env.OTP_DEV_MODE === 'false' || process.env.MSG91_DEV_MODE === 'false') {
    throw ApiError.forbidden('Dev-only endpoint');
  }
  const expected = (process.env.DEV_ADMIN_OVERRIDE_TOKEN || '').trim();
  if (!expected || !token || !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))) {
    throw ApiError.unauthorized('Invalid admin override token');
  }

  const adminDoc = await User.findOne({ roles: 'admin', is_deleted: { $ne: true } }).sort({ created_at: 1 });
  if (!adminDoc) {
    throw ApiError.notFound('No admin user seeded');
  }

  const authService = require('./auth.service');
  const tokens = await authService.issueTokens(adminDoc);
  return {
    ...tokens,
    user: authService.serializeUser(adminDoc),
    via: 'dev_admin_override',
  };
};

const rotateAdminPhone = async (adminUserId, newPhone = null) => {
  if (newPhone) {
    const authService = require('./auth.service');
    newPhone = authService.validatePhone(newPhone);
  } else {
    for (let i = 0; i < 10; i++) {
      const candidate = getRandomIndianPhone();
      const exists = await User.findOne({ phone: candidate });
      if (!exists) {
        newPhone = candidate;
        break;
      }
    }
    if (!newPhone) {
      throw new Error('Could not find a free random phone after 10 tries');
    }
  }

  const coll = await User.findOne({ phone: newPhone, _id: { $ne: adminUserId } });
  if (coll) {
    throw ApiError.badRequest('Phone already in use by another account');
  }

  const result = await User.updateOne(
    { _id: adminUserId },
    { $set: { phone: newPhone } }
  );
  if (result.matchedCount === 0) {
    throw ApiError.notFound('Admin user not found');
  }

  persistEnvVar('ADMIN_SEED_PHONE', newPhone);
  persistTestCredentials(newPhone);
  await refreshCache();
  logger.info(`Rotated admin phone -> ${newPhone}`);
  return { ok: true, new_admin_phone: newPhone };
};

module.exports = {
  ensureAdminSeed,
  sanitizeAdminUsers,
  isAdminPhoneSync,
  isOtpHidden,
  devAdminLogin,
  rotateAdminPhone,
  getAdminPhones,
  refreshCache,
};
