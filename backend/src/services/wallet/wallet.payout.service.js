const { Wallet } = require('../../models/Phase4');
const WalletTransactionV2 = require('../../models/WalletTransactionV2.model');
const User = require('../../models/User');
const ApiError = require('../../utils/ApiError');
const cache = require('../../utils/cache');
const walletEvents = require('./wallet.events');
const walletCoreService = require('./wallet.core.service');

/**
 * Wallet Payout Service
 * Handles merchant order sales fiat revenue (balance_inr_paise), bank transfer withdrawal requests, and INR deposits.
 */
class WalletPayoutService {
  /**
   * Request Payout (Merchant Fiat Sales Revenue strictly from balance_inr_paise)
   */
  async requestPayout({ userId, amount }) {
    const numAmt = parseFloat(amount);
    if (!numAmt || numAmt <= 0) {
      throw ApiError.badRequest('Payout amount must be positive.');
    }
    const uid = userId.toString();
    const wallet = await walletCoreService.getOrCreateWallet(userId);
    const availablePaise = wallet.balance_inr_paise || 0;
    const requestedPaise = Math.round(numAmt * 100);

    if (requestedPaise > availablePaise) {
      throw ApiError.badRequest(
        `Withdrawal amount cannot exceed available sales earnings. Available: ₹${(availablePaise / 100).toFixed(2)}, Requested: ₹${numAmt.toFixed(2)}`
      );
    }

    const previousPaise = availablePaise;
    const updatedPaise = previousPaise - requestedPaise;

    await Wallet.updateOne(
      { user_id: uid },
      {
        $inc: {
          balance_inr_paise: -requestedPaise,
          lifetime_spent_paise: requestedPaise,
        },
      }
    );

    const refId = `payout_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const user = await User.findById(uid).select('name current_role roles vendorProfile').lean();

    const txn = await WalletTransactionV2.create({
      user_id: uid,
      user_name: user?.name || 'Vendor',
      user_role: user?.current_role || user?.roles?.[0] || 'vendor',
      transaction_type: 'withdrawal',
      credit_debit: 'debit',
      amount: numAmt,
      previous_balance: previousPaise / 100,
      updated_balance: updatedPaise / 100,
      payment_method: 'bank_transfer',
      source: 'payout',
      status: 'pending',
      reference_id: refId,
      admin_remarks: `Merchant sales revenue bank withdrawal request (₹${numAmt.toLocaleString('en-IN')})`,
      meta: {
        amount_inr: numAmt,
        amount_paise: requestedPaise,
        bank_details: user?.vendorProfile?.bankDetails || null,
        domain: 'merchant_revenue',
      },
    });

    await cache.deleteCache(`wallet:balance:${uid}`);
    walletEvents._emitWalletUpdate(uid, wallet.credits, 'debit', numAmt, `Payout withdrawal request for ₹${numAmt}`);

    return {
      success: true,
      withdrawable_inr: updatedPaise / 100,
      transaction: txn,
      wallet: {
        credits: wallet.credits,
        balance_inr_paise: updatedPaise,
      },
    };
  }

  /**
   * Deposit INR (Paise conversion)
   */
  async depositInr(userId, paise, reason) {
    const walletCreditsService = require('./wallet.credits.service');
    return walletCreditsService.rechargeWallet({ userId, amount: paise / 100 });
  }
}

module.exports = new WalletPayoutService();
