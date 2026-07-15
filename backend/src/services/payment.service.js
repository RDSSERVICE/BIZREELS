const crypto = require('crypto');
const { Payment } = require('../models/Phase4');
const razorpayService = require('./razorpay.service');
const walletService = require('./wallet.service');
const subscriptionService = require('./subscription.service');
const notificationService = require('./notification.service');
const ApiError = require('../utils/ApiError');

const serializePayment = (d) => {
  if (!d) return null;
  const out = d.toObject ? d.toObject() : { ...d };
  if (out._id) {
    out.id = out._id.toString();
    delete out._id;
  }
  if (out.user_id) out.user_id = out.user_id.toString();
  return out;
};

const createPaymentOrder = async (userId, purpose, amountPaise, refId = null) => {
  if (amountPaise <= 0) {
    throw ApiError.badRequest('amount must be > 0');
  }
  const receipt = `rcpt_${crypto.randomBytes(6).toString('hex')}`;
  const order = await razorpayService.createOrder(amountPaise, receipt, { purpose, user_id: userId });

  const payment = await Payment.create({
    user_id: userId,
    purpose,
    ref_id: refId,
    amount_paise: amountPaise,
    currency: 'INR',
    razorpay_order_id: order.id,
    razorpay_payment_id: null,
    razorpay_signature: null,
    status: 'created',
    receipt,
    notes: order.notes || {},
    attempts: [],
  });

  return {
    payment_id: payment._id.toString(),
    razorpay_order_id: order.id,
    amount_paise: amountPaise,
    currency: 'INR',
    key_id: razorpayService.publicKeyId(),
    receipt,
    dev_mode: razorpayService.isDevMode(),
  };
};

const applySuccess = async (payment, razorpayPaymentId, signature) => {
  const dbPayment = await Payment.findById(payment._id);
  if (!dbPayment) {
    throw ApiError.notFound('Payment not found');
  }

  const now = new Date().toISOString();
  if (dbPayment.status === 'captured') {
    const out = serializePayment(dbPayment);
    if (dbPayment.purpose.startsWith('verified_badge')) {
      const { Subscription } = require('../models/Phase4');
      const sub = await Subscription.findOne({ payment_id: dbPayment._id.toString() });
      if (sub) {
        out.subscription = sub.toObject();
      }
    }
    return out;
  }

  const updated = await Payment.findOneAndUpdate(
    { _id: dbPayment._id },
    {
      $set: {
        status: 'captured',
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: signature,
        updated_at: now,
      },
      $push: { attempts: { at: now, event: 'captured' } },
    },
    { new: true }
  );

  const userId = updated.user_id.toString();
  const purpose = updated.purpose;
  let subscriptionOut = null;

  if (purpose === 'wallet_topup') {
    await walletService.depositInr(userId, updated.amount_paise, 'Wallet top-up', updated._id.toString(), razorpayPaymentId);
  } else if (['verified_badge_monthly', 'verified_badge_yearly'].includes(purpose)) {
    subscriptionOut = await subscriptionService.activateSubscriptionFromPayment(updated);
  } else if (purpose === 'listing_boost') {
    try {
      const boostService = require('./boost.service');
      await boostService.activateBoostFromPayment(updated);
    } catch {}
  }

  await notificationService.create(
    userId,
    'payment',
    'Payment successful',
    `₹${(updated.amount_paise / 100).toFixed(2)} · ${purpose}`,
    {},
    '/wallet'
  );

  const out = serializePayment(updated);
  if (subscriptionOut) {
    out.subscription = subscriptionOut;
  }
  return out;
};

const verifyAndCapture = async (userId, razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  const payment = await Payment.findOne({ razorpay_order_id: razorpayOrderId, user_id: userId });
  if (!payment) {
    throw ApiError.notFound('Payment not found');
  }

  const isValid = razorpayService.verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
  if (!isValid) {
    await Payment.updateOne({ _id: payment._id }, { $set: { status: 'failed', updated_at: new Date().toISOString() } });
    throw ApiError.badRequest('Invalid signature');
  }

  return await applySuccess(payment, razorpayPaymentId, razorpaySignature);
};

const devSimulateSuccess = async (paymentId, userId) => {
  const isDev = razorpayService.isDevMode();
  if (!isDev) {
    throw ApiError.forbidden('Dev-mode only');
  }

  const payment = await Payment.findOne({ _id: paymentId, user_id: userId });
  if (!payment) {
    throw ApiError.notFound('Not found');
  }

  const fakePayId = `pay_dev_${crypto.randomBytes(10).toString('hex')}`;
  return await applySuccess(payment, fakePayId, 'dev_signature');
};

const myPayments = async (userId) => {
  const docs = await Payment.find({ user_id: userId }).sort({ _id: -1 }).limit(50);
  return docs.map(serializePayment);
};

module.exports = {
  createPaymentOrder,
  verifyAndCapture,
  devSimulateSuccess,
  myPayments,
};
