const crypto = require('crypto');
const config = require('../config');
const settingsService = require('./settings.service');

const isDevMode = () => {
  return settingsService.getBool('razorpay', 'dev_mode', 'RAZORPAY_DEV_MODE', false);
};

const getCreds = () => {
  return {
    keyId: settingsService.getValue('razorpay', 'key_id', 'RAZORPAY_KEY_ID'),
    keySecret: settingsService.getValue('razorpay', 'key_secret', 'RAZORPAY_KEY_SECRET'),
  };
};

const hasCreds = () => {
  const { keyId, keySecret } = getCreds();
  return !!(keyId && keySecret);
};

const createOrder = async (amountPaise, receipt, notes = {}) => {
  if (isDevMode() || !hasCreds()) {
    const devId = `order_dev_${crypto.randomBytes(10).toString('hex')}`;
    return {
      id: devId,
      amount: amountPaise,
      currency: 'INR',
      receipt,
      status: 'created',
      mock: true,
    };
  }

  const { keyId, keySecret } = getCreds();
  const Razorpay = require('razorpay');
  const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });

  return new Promise((resolve, reject) => {
    rzp.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      notes,
    }, (err, order) => {
      if (err) reject(err);
      else resolve(order);
    });
  });
};

const verifySignature = (orderId, paymentId, signature) => {
  if (isDevMode() || !hasCreds()) {
    return true; // dev-mode always succeeds
  }
  const { keySecret } = getCreds();
  const shasum = crypto.createHmac('sha256', keySecret);
  shasum.update(`${orderId}|${paymentId}`);
  const digest = shasum.digest('hex');
  return digest === signature;
};

const verifyWebhookSignature = (bodyBytes, signature) => {
  const wh = settingsService.getValue('razorpay', 'webhook_secret', 'RAZORPAY_WEBHOOK_SECRET');
  if (isDevMode() || !wh) {
    return true;
  }
  const shasum = crypto.createHmac('sha256', wh);
  shasum.update(bodyBytes);
  const digest = shasum.digest('hex');
  return digest === signature;
};

const publicKeyId = () => {
  const { keyId } = getCreds();
  return keyId || 'rzp_test_dev_mock';
};

module.exports = {
  isDevMode,
  createOrder,
  verifySignature,
  verifyWebhookSignature,
  publicKeyId,
};
