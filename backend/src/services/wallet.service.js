const { Wallet, WalletTransaction } = require('../models/Phase4');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const socketService = require('./socket.service');

const emitWalletUpdate = (userId, serializedWallet) => {
  try {
    socketService.emitToUser(userId, 'wallet:updated', serializedWallet);
  } catch (err) {
    logger.warn(`Failed to emit wallet update for user ${userId}: ${err.message}`);
  }
};

const CREDIT_RULES = {
  signup: 50,
  first_listing: 100,
  deal_completed: 25,
  verified_purchase_review: 10,
  referral: 200,
};

const serializeWallet = (d) => {
  if (!d) return null;
  const out = d.toObject ? d.toObject() : { ...d };
  if (out._id) {
    out.id = out._id.toString();
    delete out._id;
  }
  delete out.__v;
  return out;
};

const getOrCreate = async (userId) => {
  let w = await Wallet.findOne({ user_id: userId });
  if (w) {
    return serializeWallet(w);
  }
  const now = new Date().toISOString();
  w = await Wallet.create({
    user_id: userId,
    credits: 0,
    balance_inr_paise: 0,
    lifetime_earned_credits: 0,
    lifetime_spent_credits: 0,
    lifetime_deposited_paise: 0,
    lifetime_spent_paise: 0,
    is_frozen: false,
    created_at: now,
    updated_at: now,
  });
  return serializeWallet(w);
};

const recordTxn = async (userId, walletId, ttype, bucket, amount, balanceAfter, reason, refType = null, refId = null, extra = {}) => {
  await WalletTransaction.create({
    wallet_id: walletId.toString(),
    user_id: userId,
    type: ttype,
    bucket,
    amount: parseInt(amount, 10),
    balance_after: parseInt(balanceAfter, 10),
    reason,
    ref_type: refType,
    ref_id: refId,
    status: 'success',
    meta: extra,
  });
};

const earnCredits = async (userId, amount, reason, refType = null, refId = null) => {
  if (amount <= 0) return {};
  await getOrCreate(userId);
  const now = new Date().toISOString();
  const res = await Wallet.findOneAndUpdate(
    { user_id: userId },
    {
      $inc: { credits: amount, lifetime_earned_credits: amount },
      $set: { updated_at: now },
    },
    { new: true }
  );
  await recordTxn(userId, res._id, 'credit_earn', 'credits', amount, res.credits, reason, refType, refId);
  const serialized = serializeWallet(res);
  emitWalletUpdate(userId, serialized);
  return serialized;
};

const spendCredits = async (userId, amount, reason, refType = null, refId = null) => {
  const w = await Wallet.findOne({ user_id: userId });
  if (!w || w.credits < amount) {
    throw ApiError.badRequest('Insufficient credits');
  }
  const now = new Date().toISOString();
  const res = await Wallet.findOneAndUpdate(
    { user_id: userId, credits: { $gte: amount } },
    {
      $inc: { credits: -amount, lifetime_spent_credits: amount },
      $set: { updated_at: now },
    },
    { new: true }
  );
  if (!res) {
    throw ApiError.badRequest('Insufficient credits');
  }
  await recordTxn(userId, res._id, 'credit_spend', 'credits', amount, res.credits, reason, refType, refId);
  const serialized = serializeWallet(res);
  emitWalletUpdate(userId, serialized);
  return serialized;
};

const FIRST_TOPUP_BONUS_CREDITS = 50;
const FIRST_TOPUP_MIN_PAISE = 20000; // ₹200
const FIRST_TOPUP_WINDOW_HOURS = 24;

const maybeFirstTopupBonus = async (userId, paise) => {
  if (paise < FIRST_TOPUP_MIN_PAISE) {
    return;
  }
  const u = await User.findById(userId, { created_at: 1, has_received_first_topup_bonus: 1 });
  if (!u || u.has_received_first_topup_bonus) {
    return;
  }

  try {
    const created = new Date(u.created_at);
    if (new Date() - created > FIRST_TOPUP_WINDOW_HOURS * 60 * 60 * 1000) {
      return;
    }
  } catch {
    return;
  }

  // Double-grant mitigation
  const marker = await User.findOneAndUpdate(
    { _id: userId, has_received_first_topup_bonus: { $ne: true } },
    { $set: { has_received_first_topup_bonus: true, updated_at: new Date() } },
    { new: true }
  );
  if (!marker) {
    return;
  }

  await earnCredits(userId, FIRST_TOPUP_BONUS_CREDITS, 'First topup bonus', 'first_topup_bonus', userId);

  try {
    const notificationService = require('./notification.service');
    await notificationService.create(
      userId,
      'reward',
      `+${FIRST_TOPUP_BONUS_CREDITS} bonus credits!`,
      'Welcome bonus for your first ₹200+ topup.',
      {},
      '/wallet'
    );
  } catch {}
};

const depositInr = async (userId, paise, reason, paymentId = null, razorpayPaymentId = null) => {
  await getOrCreate(userId);
  const wCurr = await Wallet.findOne({ user_id: userId });
  if (wCurr && wCurr.is_frozen) {
    throw ApiError.forbidden('Wallet is frozen');
  }

  const now = new Date().toISOString();
  const res = await Wallet.findOneAndUpdate(
    { user_id: userId },
    {
      $inc: { balance_inr_paise: paise, lifetime_deposited_paise: paise },
      $set: { updated_at: now },
    },
    { new: true }
  );

  await recordTxn(userId, res._id, 'deposit', 'balance_inr', paise, res.balance_inr_paise, reason, 'razorpay', paymentId, { razorpay_payment_id: razorpayPaymentId });

  try {
    await maybeFirstTopupBonus(userId, paise);
  } catch {}

  const serialized = serializeWallet(res);
  emitWalletUpdate(userId, serialized);
  return serialized;
};

const purchaseInr = async (userId, paise, reason, refType, refId, paymentId = null) => {
  const w = await Wallet.findOne({ user_id: userId });
  if (!w || w.balance_inr_paise < paise) {
    throw ApiError.badRequest('Insufficient balance');
  }

  const now = new Date().toISOString();
  const res = await Wallet.findOneAndUpdate(
    { user_id: userId, balance_inr_paise: { $gte: paise } },
    {
      $inc: { balance_inr_paise: -paise, lifetime_spent_paise: paise },
      $set: { updated_at: now },
    },
    { new: true }
  );
  if (!res) {
    throw ApiError.badRequest('Insufficient balance');
  }

  await recordTxn(userId, res._id, 'purchase', 'balance_inr', paise, res.balance_inr_paise, reason, refType, refId, { payment_id: paymentId });
  const serialized = serializeWallet(res);
  emitWalletUpdate(userId, serialized);
  return serialized;
};

const listTransactions = async (userId, limit = 50) => {
  const docs = await WalletTransaction.find({ user_id: userId }).sort({ _id: -1 }).limit(limit);
  return docs.map(d => {
    const obj = d.toObject();
    obj.id = obj._id.toString();
    delete obj._id;
    return obj;
  });
};

const backfillAll = async () => {
  const users = await User.find({ is_deleted: { $ne: true } }).select('_id');
  for (const u of users) {
    const exists = await Wallet.findOne({ user_id: u._id.toString() });
    if (!exists) {
      await getOrCreate(u._id.toString());
    }
  }
};

module.exports = {
  CREDIT_RULES,
  getOrCreate,
  earnCredits,
  spendCredits,
  depositInr,
  purchaseInr,
  listTransactions,
  backfillAll,
};
