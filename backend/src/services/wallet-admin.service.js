const mongoose = require('mongoose');
const { Wallet } = require('../models/Phase4');
const WalletTransactionV2 = require('../models/WalletTransactionV2.model');
const WalletRecharge = require('../models/WalletRecharge.model');
const RefundRequest = require('../models/RefundRequest.model');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * WalletAdminService
 * Production-grade wallet management for admin panel.
 * All operations create proper transaction logs and emit real-time events.
 */
class WalletAdminService {

  // ─── Wallet Get/Create ────────────────────────────────────
  async getOrCreateWallet(userId) {
    let wallet = await Wallet.findOne({ user_id: userId });
    if (!wallet) {
      wallet = await Wallet.create({
        user_id: userId,
        credits: 0,
        balance_inr_paise: 0,
        lifetime_earned_credits: 0,
        lifetime_spent_credits: 0,
        lifetime_deposited_paise: 0,
        lifetime_spent_paise: 0,
        is_frozen: false,
      });
    }
    return wallet;
  }

  // ─── User Search ──────────────────────────────────────────
  async searchUsers(query, limit = 20) {
    if (!query || query.length < 2) return [];
    const escaped = String(query).trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').slice(0, 80);
    
    const users = await User.find({
      is_deleted: { $ne: true },
      $or: [
        { phone: { $regex: escaped } },
        { name: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
      ],
    })
    .select('_id name phone email roles current_role walletBalance')
    .limit(limit)
    .lean();

    const result = [];
    for (const u of users) {
      const wallet = await Wallet.findOne({ user_id: u._id.toString() }).lean();
      result.push({
        id: u._id.toString(),
        name: u.name || 'Unknown',
        phone: u.phone || '',
        email: u.email || '',
        roles: u.roles || ['customer'],
        current_role: u.current_role || u.roles?.[0] || 'customer',
        wallet_balance: wallet ? wallet.credits : (u.walletBalance || 0),
        balance_inr_paise: wallet ? wallet.balance_inr_paise : 0,
      });
    }
    return result;
  }

  // ─── Wallet Stats ─────────────────────────────────────────
  async getWalletStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const [totalWallets, frozenWallets, todayCredits, todayDebits, pendingRefunds] = await Promise.all([
      Wallet.countDocuments({}),
      Wallet.countDocuments({ is_frozen: true }),
      WalletTransactionV2.aggregate([
        { $match: { credit_debit: 'credit', status: 'completed', created_at: { $gte: todayISO }, is_deleted: { $ne: true } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      WalletTransactionV2.aggregate([
        { $match: { credit_debit: 'debit', status: 'completed', created_at: { $gte: todayISO }, is_deleted: { $ne: true } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      RefundRequest.countDocuments({ status: 'pending', is_deleted: { $ne: true } }),
    ]);

    const totalBalance = await Wallet.aggregate([
      { $group: { _id: null, total_credits: { $sum: '$credits' }, total_inr: { $sum: '$balance_inr_paise' } } },
    ]);

    return {
      total_wallets: totalWallets,
      frozen_wallets: frozenWallets,
      total_credits: totalBalance[0]?.total_credits || 0,
      total_inr_paise: totalBalance[0]?.total_inr || 0,
      today_credits: todayCredits[0]?.total || 0,
      today_credits_count: todayCredits[0]?.count || 0,
      today_debits: todayDebits[0]?.total || 0,
      today_debits_count: todayDebits[0]?.count || 0,
      pending_refunds: pendingRefunds,
    };
  }

  // ─── Manual Credit ────────────────────────────────────────
  async manualCredit({ user_id, amount, reason, category, notes, admin_id }) {
    if (!user_id) throw ApiError.badRequest('User ID is required');
    if (!amount || amount <= 0) throw ApiError.badRequest('Amount must be positive');
    if (!reason) throw ApiError.badRequest('Reason is required');

    const user = await User.findById(user_id).lean();
    if (!user) throw ApiError.notFound('User not found');

    const wallet = await this.getOrCreateWallet(user_id);
    if (wallet.is_frozen) throw ApiError.badRequest('User wallet is frozen');

    const previousBalance = wallet.credits || 0;
    const updatedBalance = previousBalance + amount;

    // Update wallet
    await Wallet.updateOne(
      { user_id },
      {
        $inc: { credits: amount, lifetime_earned_credits: amount },
        $set: { updated_at: new Date().toISOString() },
      }
    );

    // Update User.walletBalance for backward compatibility
    await User.updateOne({ _id: user_id }, { $inc: { walletBalance: amount } });

    // Create transaction record
    const txn = await WalletTransactionV2.create({
      user_id,
      user_name: user.name || 'Unknown',
      user_role: user.current_role || user.roles?.[0] || 'customer',
      transaction_type: 'manual_credit',
      credit_debit: 'credit',
      amount,
      previous_balance: previousBalance,
      updated_balance: updatedBalance,
      payment_method: 'manual',
      source: 'admin_panel',
      status: 'completed',
      admin_id,
      admin_remarks: reason,
      category: category || 'manual',
      notes,
    });

    // Emit real-time events
    this._emitWalletUpdate(user_id, 'wallet:updated', {
      action: 'credit',
      amount,
      new_balance: updatedBalance,
      reason,
    });

    // Notify user
    this._notifyUser(user_id, 'wallet_credit', `₹${amount} credits added to your wallet`, reason);

    logger.info(`Admin manual credit: ${amount} credits to user ${user_id} by admin ${admin_id}`, { service: 'wallet-admin' });

    return { transaction: this._serializeTxn(txn), wallet: { credits: updatedBalance } };
  }

  // ─── Manual Debit ─────────────────────────────────────────
  async manualDebit({ user_id, amount, reason, notes, admin_id }) {
    if (!user_id) throw ApiError.badRequest('User ID is required');
    if (!amount || amount <= 0) throw ApiError.badRequest('Amount must be positive');
    if (!reason) throw ApiError.badRequest('Reason is required');

    const user = await User.findById(user_id).lean();
    if (!user) throw ApiError.notFound('User not found');

    const wallet = await this.getOrCreateWallet(user_id);
    if (wallet.is_frozen) throw ApiError.badRequest('User wallet is frozen');

    const previousBalance = wallet.credits || 0;
    if (amount > previousBalance) {
      throw ApiError.badRequest(`Cannot debit ${amount} credits. User only has ${previousBalance} credits.`);
    }

    const updatedBalance = previousBalance - amount;

    // Update wallet
    await Wallet.updateOne(
      { user_id },
      {
        $inc: { credits: -amount, lifetime_spent_credits: amount },
        $set: { updated_at: new Date().toISOString() },
      }
    );

    // Update User.walletBalance for backward compatibility
    await User.updateOne({ _id: user_id }, { $inc: { walletBalance: -amount } });

    // Create transaction record
    const txn = await WalletTransactionV2.create({
      user_id,
      user_name: user.name || 'Unknown',
      user_role: user.current_role || user.roles?.[0] || 'customer',
      transaction_type: 'manual_debit',
      credit_debit: 'debit',
      amount,
      previous_balance: previousBalance,
      updated_balance: updatedBalance,
      payment_method: 'manual',
      source: 'admin_panel',
      status: 'completed',
      admin_id,
      admin_remarks: reason,
      notes,
    });

    // Emit real-time events
    this._emitWalletUpdate(user_id, 'wallet:updated', {
      action: 'debit',
      amount,
      new_balance: updatedBalance,
      reason,
    });

    // Notify user
    this._notifyUser(user_id, 'wallet_debit', `₹${amount} credits deducted from your wallet`, reason);

    logger.info(`Admin manual debit: ${amount} credits from user ${user_id} by admin ${admin_id}`, { service: 'wallet-admin' });

    return { transaction: this._serializeTxn(txn), wallet: { credits: updatedBalance } };
  }

  // ─── List Transactions (Paginated, Filterable) ────────────
  async listTransactions({ page = 1, limit = 25, search, user_id, transaction_id, reference_id, user_role, status, transaction_type, credit_debit, from_date, to_date, sort_by = 'created_at', sort_order = 'desc' }) {
    const query = { is_deleted: { $ne: true } };

    // Search filters
    if (search) {
      const escaped = String(search).trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      query.$or = [
        { transaction_id: { $regex: escaped, $options: 'i' } },
        { reference_id: { $regex: escaped, $options: 'i' } },
        { user_id: { $regex: escaped, $options: 'i' } },
        { user_name: { $regex: escaped, $options: 'i' } },
      ];
    }
    if (user_id) query.user_id = user_id;
    if (transaction_id) query.transaction_id = { $regex: transaction_id, $options: 'i' };
    if (reference_id) query.reference_id = { $regex: reference_id, $options: 'i' };
    if (user_role) query.user_role = user_role;
    if (status) query.status = status;
    if (transaction_type) query.transaction_type = transaction_type;
    if (credit_debit) query.credit_debit = credit_debit;

    // Date range
    if (from_date || to_date) {
      query.created_at = {};
      if (from_date) query.created_at.$gte = new Date(from_date).toISOString();
      if (to_date) query.created_at.$lte = new Date(to_date).toISOString();
    }

    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const sortObj = { [sort_by]: sort_order === 'asc' ? 1 : -1 };

    const [items, total] = await Promise.all([
      WalletTransactionV2.find(query).sort(sortObj).skip(skip).limit(parseInt(limit)).lean(),
      WalletTransactionV2.countDocuments(query),
    ]);

    return {
      items: items.map(this._serializeTxn),
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      total_pages: Math.ceil(total / parseInt(limit)),
    };
  }

  // ─── Export Transactions ──────────────────────────────────
  async exportTransactions(filters, format = 'csv') {
    const allFilters = { ...filters, page: 1, limit: 10000 };
    const result = await this.listTransactions(allFilters);
    return result.items;
  }

  // ─── Recharge History ─────────────────────────────────────
  async listRecharges({ page = 1, limit = 25, search, status, from_date, to_date }) {
    const query = { is_deleted: { $ne: true } };

    if (search) {
      const escaped = String(search).trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      query.$or = [
        { recharge_id: { $regex: escaped, $options: 'i' } },
        { user_id: { $regex: escaped, $options: 'i' } },
        { user_name: { $regex: escaped, $options: 'i' } },
        { gateway_order_id: { $regex: escaped, $options: 'i' } },
      ];
    }
    if (status) query.status = status;
    if (from_date || to_date) {
      query.created_at = {};
      if (from_date) query.created_at.$gte = new Date(from_date).toISOString();
      if (to_date) query.created_at.$lte = new Date(to_date).toISOString();
    }

    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

    const [items, total] = await Promise.all([
      WalletRecharge.find(query).sort({ _id: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      WalletRecharge.countDocuments(query),
    ]);

    return {
      items: items.map(r => ({
        id: r._id.toString(),
        recharge_id: r.recharge_id,
        user_id: r.user_id,
        user_name: r.user_name,
        user_role: r.user_role,
        amount: r.amount,
        amount_paise: r.amount_paise,
        payment_gateway: r.payment_gateway,
        gateway_order_id: r.gateway_order_id,
        status: r.status,
        invoice_number: r.invoice_number,
        created_at: r.created_at,
      })),
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      total_pages: Math.ceil(total / parseInt(limit)),
    };
  }

  // ─── Refund Management ────────────────────────────────────
  async listRefunds({ page = 1, limit = 25, status, search, from_date, to_date }) {
    const query = { is_deleted: { $ne: true } };

    if (status) query.status = status;
    if (search) {
      const escaped = String(search).trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      query.$or = [
        { refund_id: { $regex: escaped, $options: 'i' } },
        { user_id: { $regex: escaped, $options: 'i' } },
        { user_name: { $regex: escaped, $options: 'i' } },
      ];
    }
    if (from_date || to_date) {
      query.created_at = {};
      if (from_date) query.created_at.$gte = new Date(from_date).toISOString();
      if (to_date) query.created_at.$lte = new Date(to_date).toISOString();
    }

    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

    const [items, total] = await Promise.all([
      RefundRequest.find(query).sort({ _id: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      RefundRequest.countDocuments(query),
    ]);

    return {
      items: items.map(r => ({
        id: r._id.toString(),
        refund_id: r.refund_id,
        user_id: r.user_id,
        user_name: r.user_name,
        user_role: r.user_role,
        amount: r.amount,
        reason: r.reason,
        refund_type: r.refund_type,
        status: r.status,
        admin_remarks: r.admin_remarks,
        approved_by: r.approved_by,
        approved_at: r.approved_at,
        rejected_by: r.rejected_by,
        rejected_at: r.rejected_at,
        original_transaction_id: r.original_transaction_id,
        created_at: r.created_at,
      })),
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      total_pages: Math.ceil(total / parseInt(limit)),
    };
  }

  async approveRefund(refundId, adminId, remarks) {
    const refund = await RefundRequest.findById(refundId);
    if (!refund) throw ApiError.notFound('Refund request not found');
    if (refund.status !== 'pending') throw ApiError.badRequest('Refund is not in pending status');

    const user = await User.findById(refund.user_id).lean();
    if (!user) throw ApiError.notFound('User not found');

    const wallet = await this.getOrCreateWallet(refund.user_id);
    const previousBalance = wallet.credits || 0;
    const updatedBalance = previousBalance + refund.amount;

    // Credit wallet
    await Wallet.updateOne(
      { user_id: refund.user_id },
      {
        $inc: { credits: refund.amount, lifetime_earned_credits: refund.amount },
        $set: { updated_at: new Date().toISOString() },
      }
    );
    await User.updateOne({ _id: refund.user_id }, { $inc: { walletBalance: refund.amount } });

    // Create transaction
    const txn = await WalletTransactionV2.create({
      user_id: refund.user_id,
      user_name: user.name || 'Unknown',
      user_role: user.current_role || user.roles?.[0] || 'customer',
      transaction_type: 'refund',
      credit_debit: 'credit',
      amount: refund.amount,
      previous_balance: previousBalance,
      updated_balance: updatedBalance,
      payment_method: 'wallet',
      source: 'refund_approval',
      status: 'completed',
      admin_id: adminId,
      admin_remarks: remarks || 'Refund approved by admin',
      reference_id: refund.refund_id,
    });

    // Update refund status
    await RefundRequest.updateOne(
      { _id: refundId },
      {
        $set: {
          status: 'approved',
          admin_remarks: remarks,
          approved_by: adminId,
          approved_at: new Date(),
          refund_transaction_id: txn.transaction_id,
        },
      }
    );

    // Emit events
    this._emitWalletUpdate(refund.user_id, 'wallet:updated', {
      action: 'refund_approved',
      amount: refund.amount,
      new_balance: updatedBalance,
    });
    this._notifyUser(refund.user_id, 'refund_approved', `Your refund of ₹${refund.amount} has been approved`, remarks || 'Refund credited to wallet');

    logger.info(`Refund approved: ${refund.refund_id} for user ${refund.user_id} by admin ${adminId}`, { service: 'wallet-admin' });

    return { ok: true, refund_id: refund.refund_id, transaction_id: txn.transaction_id };
  }

  async rejectRefund(refundId, adminId, remarks) {
    const refund = await RefundRequest.findById(refundId);
    if (!refund) throw ApiError.notFound('Refund request not found');
    if (refund.status !== 'pending') throw ApiError.badRequest('Refund is not in pending status');

    await RefundRequest.updateOne(
      { _id: refundId },
      {
        $set: {
          status: 'rejected',
          admin_remarks: remarks,
          rejected_by: adminId,
          rejected_at: new Date(),
        },
      }
    );

    // Notify user
    this._emitWalletUpdate(refund.user_id, 'wallet:refund_status', {
      action: 'refund_rejected',
      refund_id: refund.refund_id,
      reason: remarks,
    });
    this._notifyUser(refund.user_id, 'refund_rejected', `Your refund request has been rejected`, remarks || 'Contact support for details');

    logger.info(`Refund rejected: ${refund.refund_id} for user ${refund.user_id} by admin ${adminId}`, { service: 'wallet-admin' });

    return { ok: true, refund_id: refund.refund_id };
  }

  // ─── Internal Helpers ─────────────────────────────────────
  _serializeTxn(txn) {
    if (!txn) return null;
    return {
      id: txn._id?.toString() || txn.id,
      transaction_id: txn.transaction_id,
      reference_id: txn.reference_id,
      user_id: txn.user_id,
      user_name: txn.user_name,
      user_role: txn.user_role,
      transaction_type: txn.transaction_type,
      credit_debit: txn.credit_debit,
      amount: txn.amount,
      previous_balance: txn.previous_balance,
      updated_balance: txn.updated_balance,
      payment_method: txn.payment_method,
      source: txn.source,
      status: txn.status,
      admin_id: txn.admin_id,
      admin_remarks: txn.admin_remarks,
      category: txn.category,
      notes: txn.notes,
      created_at: txn.created_at,
    };
  }

  _emitWalletUpdate(userId, event, payload) {
    try {
      const { emitToUser, emitToAdmin } = require('../sockets');
      emitToUser(userId, event, payload);
      emitToAdmin('admin:update', { tags: ['AdminWallet', 'AdminWalletTransactions', 'AdminTransactions', 'AdminOverview'] });
    } catch (err) {
      logger.warn('Socket emit failed in wallet service', { error: err.message });
    }
  }

  _notifyUser(userId, type, title, message) {
    try {
      const notificationService = require('./notification.service');
      notificationService.create(userId, type, title, message, {}, '/wallet');
    } catch (err) {
      logger.warn('Notification failed in wallet service', { error: err.message });
    }
  }
}

module.exports = new WalletAdminService();
