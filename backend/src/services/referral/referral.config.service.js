const { PlatformSettings } = require('../../models/Misc');
const logger = require('../../utils/logger');

/**
 * ReferralConfigService
 * Admin-configurable referral settings using PlatformSettings collection.
 */

const DEFAULT_CONFIG = {
  referrer_reward: 200,
  referred_reward: 100,
  max_referrals_per_day: 10,
  max_referrals_per_ip_daily: 5,
  eligibility_event: 'first_listing', // 'registration', 'first_listing', 'kyc_approved', 'first_deal'
  require_kyc: false,
  is_active: true,
  min_days_before_reward: 0,
};

const CONFIG_KEY = 'referral_config';

let cachedConfig = null;
let lastFetched = 0;
const CACHE_TTL_MS = 60 * 1000;

/**
 * Get referral configuration from PlatformSettings, or return defaults.
 */
async function getReferralConfig() {
  const now = Date.now();
  if (cachedConfig && (now - lastFetched < CACHE_TTL_MS)) {
    return cachedConfig;
  }
  try {
    const setting = await PlatformSettings.findOne({ key: CONFIG_KEY }).lean();
    if (setting && setting.value) {
      cachedConfig = { ...DEFAULT_CONFIG, ...setting.value };
      lastFetched = now;
      return cachedConfig;
    }
  } catch (err) {
    logger.warn('Failed to load referral config, using defaults', { error: err.message });
  }
  return { ...DEFAULT_CONFIG };
}

/**
 * Update referral configuration (admin only).
 */
async function updateReferralConfig(updates) {
  const current = await getReferralConfig();
  const merged = { ...current, ...updates };

  await PlatformSettings.updateOne(
    { key: CONFIG_KEY },
    { $set: { value: merged } },
    { upsert: true }
  );

  cachedConfig = merged;
  lastFetched = Date.now();

  logger.info('Referral config updated', { service: 'referral-config' });
  return merged;
}

module.exports = {
  getReferralConfig,
  updateReferralConfig,
  DEFAULT_CONFIG,
};
