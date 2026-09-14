const logger = require('../../utils/logger');

/**
 * Wallet Events & Serialization Helper
 */
class WalletEvents {
  /**
   * Clean serialization of Mongoose transaction document
   */
  _serializeTxn(txn) {
    if (!txn) return null;
    return {
      id: txn._id?.toString() || txn.id,
      transaction_id: txn.transaction_id,
      reference_id: txn.reference_id,
      user_id: txn.user_id,
      transaction_type: txn.transaction_type,
      credit_debit: txn.credit_debit,
      amount: txn.amount,
      previous_balance: txn.previous_balance,
      updated_balance: txn.updated_balance,
      status: txn.status,
      source: txn.source,
      admin_remarks: txn.admin_remarks,
      created_at: txn.created_at,
    };
  }

  /**
   * Emits wallet balance updates to the user and admin channels
   */
  _emitWalletUpdate(userId, newBalance, action, amount, reason) {
    try {
      const { emitToUser, emitToAdmin } = require('../../sockets');
      emitToUser(userId, 'wallet:updated', { action, amount, new_balance: newBalance, reason });
      emitToAdmin('admin:update', { tags: ['AdminWallet', 'AdminWalletTransactions', 'AdminOverview'] });
    } catch (err) {
      logger.warn('Socket emit failed in wallet service', { error: err.message });
    }
  }

  /**
   * Emits subscription updates to the user and admin channels
   */
  _emitSubscriptionUpdate(userId) {
    try {
      const { emitToUser, emitToAdmin } = require('../../sockets');
      emitToUser(userId, 'subscription:updated', { updated: true });
      emitToAdmin('admin:update', { tags: ['UserSubscriptions', 'AdminOverview'] });
    } catch (err) {
      logger.warn('Socket emit failed for subscription update', { error: err.message });
    }
  }
}

module.exports = new WalletEvents();
