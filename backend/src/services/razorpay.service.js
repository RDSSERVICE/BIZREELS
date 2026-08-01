const crypto = require('crypto');
const config = require('../config');
const settingsService = require('./settings.service');
const logger = require('../utils/logger');

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

/**
 * Log the current Razorpay configuration status on startup.
 */
const logConfigStatus = () => {
  const dev = isDevMode();
  const creds = hasCreds();
  const { keyId } = getCreds();

  if (dev) {
    logger.warn('[Razorpay] DEV MODE is ON — all payments will be mocked. Set RAZORPAY_DEV_MODE=false for real payments.');
  } else if (!creds) {
    logger.error('[Razorpay] PRODUCTION MODE but credentials are MISSING. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env or admin settings.');
  } else {
    logger.info(`[Razorpay] Production mode active. Key ID: ${keyId.substring(0, 12)}...`);
  }
};

const createOrder = async (amountPaise, receipt, notes = {}) => {
  if (isDevMode()) {
    const devId = `order_dev_${crypto.randomBytes(10).toString('hex')}`;
    logger.info(`[Razorpay] DEV MODE: Created mock order ${devId} for ${amountPaise} paise`);
    return {
      id: devId,
      amount: amountPaise,
      currency: 'INR',
      receipt,
      status: 'created',
      mock: true,
    };
  }

  if (!hasCreds()) {
    logger.error('[Razorpay] Cannot create order: Razorpay credentials are not configured.');
    throw new Error('Payment gateway credentials are not configured. Please contact support.');
  }

  const { keyId, keySecret } = getCreds();

  try {
    const Razorpay = require('razorpay');
    const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await rzp.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      notes,
    });

    logger.info(`[Razorpay] Order created: ${order.id}, amount: ${amountPaise} paise, receipt: ${receipt}`);
    return order;
  } catch (err) {
    logger.error(`[Razorpay] Order creation FAILED: ${err.message}`, {
      statusCode: err.statusCode,
      error: err.error,
      amountPaise,
      receipt,
    });
    throw new Error(`Payment order creation failed: ${err.message}`);
  }
};

const verifySignature = (orderId, paymentId, signature) => {
  if (isDevMode()) {
    logger.warn('[Razorpay] DEV MODE: Skipping signature verification');
    return true;
  }

  if (!hasCreds()) {
    logger.error('[Razorpay] Cannot verify signature: credentials missing');
    return false;
  }

  const { keySecret } = getCreds();
  const shasum = crypto.createHmac('sha256', keySecret);
  shasum.update(`${orderId}|${paymentId}`);
  const digest = shasum.digest('hex');
  const isValid = digest === signature;

  if (!isValid) {
    logger.warn(`[Razorpay] Signature verification FAILED for order ${orderId}, payment ${paymentId}`);
  } else {
    logger.info(`[Razorpay] Signature verified for order ${orderId}, payment ${paymentId}`);
  }

  return isValid;
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
  if (isDevMode()) {
    return 'rzp_test_dev_mock';
  }
  const { keyId } = getCreds();
  if (!keyId) {
    logger.error('[Razorpay] publicKeyId called but RAZORPAY_KEY_ID is empty');
  }
  return keyId || '';
};

module.exports = {
  isDevMode,
  createOrder,
  verifySignature,
  verifyWebhookSignature,
  publicKeyId,
  logConfigStatus,
};
