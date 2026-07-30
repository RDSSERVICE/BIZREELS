const { Referral } = require('../../models/Misc');
const User = require('../../models/User');
const { getReferralConfig, updateReferralConfig } = require('./referral.config.service');
const ApiError = require('../../utils/ApiError');
const logger = require('../../utils/logger');

/**
 * ReferralAdminService
 * Admin panel referral management: analytics, config, and manual status changes.
 */

/**
 * Get referral analytics for the admin dashboard.
 */
async function getReferralAnalytics() {
  const [totalReferrals, creditedReferrals, pendingReferrals, rejectedReferrals] = await Promise.all([
    Referral.countDocuments({ is_deleted: { $ne: true } }),
    Referral.countDocuments({ status: 'credited', is_deleted: { $ne: true } }),
    Referral.countDocuments({ status: 'pending', is_deleted: { $ne: true } }),
    Referral.countDocuments({ status: 'rejected', is_deleted: { $ne: true } }),
  ]);

  const totalRewardsAgg = await Referral.aggregate([
    { $match: { status: 'credited', is_deleted: { $ne: true } } },
    { $group: { _id: null, total_referrer: { $sum: '$referrer_reward' }, total_referred: { $sum: '$referred_reward' } } },
  ]);

  const topReferrers = await Referral.aggregate([
    { $match: { is_deleted: { $ne: true } } },
    { $group: { _id: '$referrer_id', total: { $sum: 1 }, credited: { $sum: { $cond: [{ $eq: ['$status', 'credited'] }, 1, 0] } } } },
    { $sort: { total: -1 } },
    { $limit: 10 },
  ]);

  // Enrich top referrers with names
  const referrerIds = topReferrers.map(r => r._id);
  const users = referrerIds.length > 0
    ? await User.find({ _id: { $in: referrerIds } }).select('name phone').lean()
    : [];
  const userMap = {};
  users.forEach(u => { userMap[u._id.toString()] = u; });

  const config = await getReferralConfig();

  return {
    total_referrals: totalReferrals,
    credited_referrals: creditedReferrals,
    pending_referrals: pendingReferrals,
    rejected_referrals: rejectedReferrals,
    conversion_rate: totalReferrals > 0 ? Math.round((creditedReferrals / totalReferrals) * 100) : 0,
    total_rewards_given: totalRewardsAgg[0]?.total_referrer || 0,
    total_bonuses_given: totalRewardsAgg[0]?.total_referred || 0,
    top_referrers: topReferrers.map(r => ({
      user_id: r._id,
      name: userMap[r._id]?.name || 'Unknown',
      total_referrals: r.total,
      credited: r.credited,
    })),
    config,
  };
}

/**
 * List all referrals (admin, paginated, filterable).
 */
async function listAllReferrals({ page = 1, limit = 25, status, search, from_date, to_date }) {
  const query = { is_deleted: { $ne: true } };
  if (status) query.status = status;
  if (search) {
    const escaped = String(search).trim().replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    query.$or = [
      { referrer_id: { $regex: escaped, $options: 'i' } },
      { referred_user_id: { $regex: escaped, $options: 'i' } },
      { code_used: { $regex: escaped, $options: 'i' } },
      { referrer_name: { $regex: escaped, $options: 'i' } },
      { referred_name: { $regex: escaped, $options: 'i' } },
    ];
  }
  if (from_date || to_date) {
    query.created_at = {};
    if (from_date) query.created_at.$gte = new Date(from_date);
    if (to_date) query.created_at.$lte = new Date(to_date);
  }

  const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
  const [items, total] = await Promise.all([
    Referral.find(query).sort({ _id: -1 }).skip(skip).limit(parseInt(limit)).lean(),
    Referral.countDocuments(query),
  ]);

  return {
    items: items.map(r => ({
      id: r._id.toString(),
      referrer_id: r.referrer_id,
      referrer_name: r.referrer_name || null,
      referred_user_id: r.referred_user_id,
      referred_name: r.referred_name || null,
      code_used: r.code_used,
      status: r.status,
      referrer_reward: r.referrer_reward || 0,
      referred_reward: r.referred_reward || 0,
      trigger_event: r.trigger_event || null,
      ip_address: r.ip_address || null,
      created_at: r.created_at,
      credited_at: r.credited_at || null,
    })),
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    total_pages: Math.ceil(total / parseInt(limit)),
  };
}

/**
 * Manually update referral status (admin).
 */
async function updateReferralStatus(referralId, status, adminRemarks) {
  const ref = await Referral.findById(referralId);
  if (!ref) throw ApiError.notFound('Referral not found');

  const updateFields = { status };
  if (status === 'credited') {
    // Trigger reward processing
    const { processReward } = require('./referral.reward.service');
    const result = await processReward(referralId);
    if (!result.processed) {
      throw ApiError.badRequest(`Cannot credit: ${result.reason}`);
    }
    return { ok: true, result };
  }

  if (status === 'rejected') {
    updateFields.admin_remarks = adminRemarks || 'Rejected by admin';
  }

  await Referral.updateOne({ _id: referralId }, { $set: updateFields });

  // Emit events
  try {
    const { emitToAdmin } = require('../../sockets');
    emitToAdmin('admin:update', { tags: ['AdminReferrals'] });
  } catch (err) {}

  return { ok: true };
}

module.exports = {
  getReferralAnalytics,
  listAllReferrals,
  updateReferralStatus,
  getReferralConfig,
  updateReferralConfig,
};
