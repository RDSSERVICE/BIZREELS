const { Subscription } = require('../models/Phase4');
const User = require('../models/User');
const notificationService = require('./notification.service');
const ApiError = require('../utils/ApiError');

const PLAN_PAISE = { verified_monthly: 9900, verified_yearly: 49900 };
const PLAN_DAYS = { verified_monthly: 30, verified_yearly: 365 };

const serializeSub = (d) => {
  if (!d) return null;
  const out = d.toObject ? d.toObject() : { ...d };
  if (out._id) {
    out.id = out._id.toString();
    delete out._id;
  }
  if (out.user_id) out.user_id = out.user_id.toString();
  if (out.payment_id) out.payment_id = out.payment_id.toString();
  return out;
};

const createSubOrder = async (userId, plan) => {
  if (!PLAN_PAISE[plan]) {
    throw ApiError.badRequest('Invalid plan');
  }
  const paymentService = require('./payment.service');
  return await paymentService.createPaymentOrder(
    userId,
    `verified_badge_${plan.split('_')[1]}`,
    PLAN_PAISE[plan],
    plan
  );
};

const activateSubscriptionFromPayment = async (payment) => {
  const purpose = payment.purpose || '';
  let plan = null;
  if (purpose === 'verified_badge_monthly') {
    plan = 'verified_monthly';
  } else if (purpose === 'verified_badge_yearly') {
    plan = 'verified_yearly';
  }
  if (!plan) return {};

  const userId = payment.user_id.toString();
  const now = new Date();
  const addDays = PLAN_DAYS[plan];

  const active = await Subscription.findOne({
    user_id: userId,
    plan,
    status: 'active',
  });

  let extended = false;
  let subDoc;

  if (active) {
    let currentExpiry = now;
    try {
      currentExpiry = new Date(active.expires_at);
    } catch {}
    const baseFrom = currentExpiry > now ? currentExpiry : now;
    const newExpiry = new Date(baseFrom.getTime() + addDays * 24 * 60 * 60 * 1000);

    const updated = await Subscription.findOneAndUpdate(
      { _id: active._id },
      {
        $set: {
          expires_at: newExpiry.toISOString(),
          updated_at: new Date().toISOString(),
          last_payment_id: payment._id.toString(),
        },
        $push: { payment_ids: payment._id.toString() },
      },
      { returnDocument: 'after' }
    );
    subDoc = updated;
    extended = true;
  } else {
    const expires = new Date(now.getTime() + addDays * 24 * 60 * 60 * 1000);
    subDoc = await Subscription.create({
      user_id: userId,
      plan,
      status: 'active',
      started_at: now.toISOString(),
      expires_at: expires.toISOString(),
      auto_renew: false,
      payment_id: payment._id.toString(),
      payment_ids: [payment._id.toString()],
    });
  }

  await User.updateOne({ _id: userId }, { $set: { is_subscribed_verified: true } });
  await notificationService.create(
    userId,
    'verification',
    extended ? 'Verified subscription extended' : 'Verified subscription active',
    `You're subscribed to ${plan}. Verified badge shows when KYC is also approved.`,
    {},
    '/subscriptions',
    null
  );

  return serializeSub(subDoc);
};

const mySubs = async (userId, page = 1, limit = 50) => {
  const skip = (page - 1) * limit;
  const docs = await Subscription.find({ user_id: userId })
    .sort({ _id: -1 })
    .skip(skip)
    .limit(limit);
  return docs.map(serializeSub);
};

const cancelSub = async (subId, userId) => {
  const s = await Subscription.findOne({ _id: subId, user_id: userId });
  if (!s) {
    throw ApiError.notFound('Subscription not found');
  }
  await Subscription.updateOne({ _id: subId }, { $set: { auto_renew: false, updated_at: new Date().toISOString() } });
  return { ok: true };
};

const hasActiveVerifiedSub = async (userId) => {
  const nowIso = new Date().toISOString();
  const sub = await Subscription.findOne({
    user_id: userId,
    status: 'active',
    plan: { $in: ['verified_monthly', 'verified_yearly'] },
    expires_at: { $gt: nowIso },
  });
  return !!sub;
};

const reconcileUserSubscription = async (userId) => {
  const User = require('../models/User');
  const UserSubscription = require('../models/UserSubscription.model');

  const now = new Date();
  let activeSub = await UserSubscription.findOne({
    user_id: userId,
    status: 'active',
    is_deleted: { $ne: true }
  });

  const user = await User.findById(userId);
  if (!user) return null;

  if (activeSub) {
    if (new Date(activeSub.expiry_date) < now) {
      await UserSubscription.updateOne(
        { _id: activeSub._id },
        { $set: { status: 'expired' } }
      );

      try {
        await notificationService.create(
          userId,
          'subscription',
          'Subscription Expired',
          `Your ${activeSub.plan_name} subscription has expired. Renew to keep premium benefits.`,
          {},
          '/subscriptions',
          null
        );
        const { emitToUser, emitToAdmin } = require('../sockets');
        emitToUser(userId, 'subscription:expired', { plan: activeSub.plan_name, expired_at: now.toISOString() });
        emitToUser(userId, 'subscription:updated', { updated: true });
        emitToAdmin('admin:update', { tags: ['UserSubscriptions', 'AdminOverview'] });
      } catch (err) {}

      user.is_subscribed_verified = false;
      user.subscription = {
        plan: 'Free Member',
        plan_id: null,
        startedAt: null,
        expiresAt: null,
        autoRenew: false,
        status: 'inactive'
      };
      await User.updateOne({ _id: userId }, { $set: { is_subscribed_verified: false, subscription: user.subscription } });
    } else {
      const shouldUpdate =
        !user.is_subscribed_verified ||
        !user.subscription ||
        user.subscription.plan !== activeSub.plan_name ||
        user.subscription.plan_id !== activeSub.plan_id ||
        user.subscription.status !== 'active';

      if (shouldUpdate) {
        user.is_subscribed_verified = true;
        user.subscription = {
          plan: activeSub.plan_name,
          plan_id: activeSub.plan_id,
          startedAt: activeSub.start_date,
          expiresAt: activeSub.expiry_date,
          autoRenew: activeSub.auto_renewal || false,
          status: 'active'
        };
        await User.updateOne({ _id: userId }, { $set: { is_subscribed_verified: true, subscription: user.subscription } });
      }
    }
  } else {
    const hasVerifiedSub = await hasActiveVerifiedSub(userId);
    const shouldUpdate =
      user.is_subscribed_verified !== hasVerifiedSub ||
      (user.subscription && user.subscription.plan !== 'Free Member' && !hasVerifiedSub);

    if (shouldUpdate) {
      user.is_subscribed_verified = hasVerifiedSub;
      user.subscription = {
        plan: 'Free Member',
        plan_id: null,
        startedAt: null,
        expiresAt: null,
        autoRenew: false,
        status: 'inactive'
      };
      await User.updateOne({ _id: userId }, { $set: { is_subscribed_verified: hasVerifiedSub, subscription: user.subscription } });
    }
  }

  return user;
};

module.exports = {
  createSubOrder,
  activateSubscriptionFromPayment,
  mySubs,
  cancelSub,
  hasActiveVerifiedSub,
  reconcileUserSubscription,
};
