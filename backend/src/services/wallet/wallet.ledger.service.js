const WalletTransactionV2 = require('../../models/WalletTransactionV2.model');
const IsolatedTransaction = require('../../models/IsolatedTransaction.model');
const walletEvents = require('./wallet.events');

/**
 * Wallet Ledger Service
 * Handles unified transaction ledger lookups, multi-table aggregation, deduplication, and pagination.
 */
class WalletLedgerService {
  /**
   * Get transactions from WalletTransactionV2 (Paginated).
   */
  async getTransactions(userId, page = 1, limit = 50) {
    const uid = userId.toString();
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const query = { user_id: uid, is_deleted: { $ne: true } };

    const [items, total] = await Promise.all([
      WalletTransactionV2.find(query).sort({ created_at: -1 }).skip(skip).limit(parseInt(limit, 10)).lean(),
      WalletTransactionV2.countDocuments(query),
    ]);

    return {
      items: items.map(t => walletEvents._serializeTxn(t)),
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    };
  }

  /**
   * List Transactions (Alias for getTransactions)
   */
  async listTransactions(userId, limit = 50, page = 1) {
    return this.getTransactions(userId, page, limit);
  }

  /**
   * Get role-isolated transactions (paginated).
   * Unifies and deduplicates transactions across both IsolatedTransaction and WalletTransactionV2
   * so all usage credits, reel boosts, bid fees, listing fees, and recharges show in the ledger.
   */
  async getRoleTransactions(userId, role, page = 1, limit = 50) {
    const uid = userId.toString();
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.max(1, parseInt(limit, 10) || 50);
    const skip = (parsedPage - 1) * parsedLimit;

    // Fetch from both IsolatedTransaction and WalletTransactionV2 in parallel
    const [isoItems, v2Items] = await Promise.all([
      IsolatedTransaction.find({ userId: uid, role }).lean(),
      WalletTransactionV2.find({ user_id: uid }).lean(),
    ]);

    const seenRefs = new Set();
    const seenTimeKeys = new Set();
    const merged = [];

    const addTx = (t) => {
      const rawRef = (t.reference_id || t.paymentId || t.payment_id || t.transaction_id || '').toString();
      const cleanRef = rawRef.toLowerCase().replace(/^iso_/, '');
      const createdAt = new Date(t.created_at || t.createdAt || Date.now());
      const amt = Number(t.amount || 0);

      const isCredit =
        (t.type || t.credit_debit || '').toLowerCase() === 'credit' ||
        t.type === 'recharge' ||
        t.type === 'refund' ||
        t.type === 'referral_bonus' ||
        t.transaction_type === 'recharge' ||
        t.transaction_type === 'manual_credit' ||
        t.transaction_type === 'refund';

      const typeStr = isCredit ? 'credit' : 'debit';
      const timeKey = Math.floor(createdAt.getTime() / 4000) + '_' + amt + '_' + typeStr;

      if (cleanRef && seenRefs.has(cleanRef)) return;
      if (seenTimeKeys.has(timeKey)) return;

      if (cleanRef) seenRefs.add(cleanRef);
      seenTimeKeys.add(timeKey);

      const rawDesc = t.description || t.admin_remarks;
      const cleanDesc = rawDesc || (t.transaction_type ? t.transaction_type.replace(/_/g, ' ') : 'Wallet Transaction');

      merged.push({
        _id: t._id ? t._id.toString() : `tx_${Date.now()}_${Math.random()}`,
        userId: uid,
        role: t.role || role,
        type: typeStr,
        credit_debit: typeStr,
        transaction_type: t.transaction_type || t.type || 'transaction',
        amount: amt,
        previous_balance: t.previous_balance ?? 0,
        updated_balance: t.updated_balance ?? 0,
        description: cleanDesc,
        reference_id: rawRef || `ref_${createdAt.getTime()}`,
        status: t.status === 'failed' ? 'failed' : (t.status || 'completed'),
        createdAt,
        created_at: createdAt,
        meta: t.meta || {},
      });
    };

    // Prioritize IsolatedTransaction, then append any additional WalletTransactionV2 records
    isoItems.forEach(addTx);
    v2Items.forEach(addTx);

    // Sort descending by date
    merged.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = merged.length;
    const paginatedItems = merged.slice(skip, skip + parsedLimit);

    return {
      items: paginatedItems,
      total,
      page: parsedPage,
      limit: parsedLimit,
    };
  }
}

module.exports = new WalletLedgerService();
