/**
 * WalletService — Master Orchestration Facade
 *
 * Production-grade modular architecture decomposing wallet operations into:
 *  - Core: wallet lifecycle, onboarding balance, and balance lookups (wallet/wallet.core.service.js)
 *  - Credits: platform usage credit mutations, sessions, and atomic sync (wallet/wallet.credits.service.js)
 *  - Isolated: role-isolated balances & transactions for vendors and creators (wallet/wallet.isolated.service.js)
 *  - Subscription: plan purchases, addons, and Razorpay subscriptions (wallet/wallet.subscription.service.js)
 *  - Payout: merchant sales fiat revenue payouts and bank transfers (wallet/wallet.payout.service.js)
 *  - Ledger: unified multi-source transaction queries and deduplication (wallet/wallet.ledger.service.js)
 *  - Events: Socket.IO broadcasts, cache invalidation, and txn serialization (wallet/wallet.events.js)
 *
 * 100% backward compatible with all existing controllers, routes, cron jobs, and services.
 */

const walletCoreService = require('./wallet/wallet.core.service');
const walletCreditsService = require('./wallet/wallet.credits.service');
const walletIsolatedService = require('./wallet/wallet.isolated.service');
const walletSubscriptionService = require('./wallet/wallet.subscription.service');
const walletPayoutService = require('./wallet/wallet.payout.service');
const walletLedgerService = require('./wallet/wallet.ledger.service');
const walletEvents = require('./wallet/wallet.events');

class WalletService {
  constructor() {
    // Expose sub-services for domain-driven access
    this.core = walletCoreService;
    this.credits = walletCreditsService;
    this.isolated = walletIsolatedService;
    this.subscription = walletSubscriptionService;
    this.payout = walletPayoutService;
    this.ledger = walletLedgerService;
    this.events = walletEvents;
  }

  // ─── Core Wallet Lifecycle ──────────────────────────────
  async getOrCreate(userId, session = null) {
    return this.core.getOrCreate(userId, session);
  }

  async getOrCreateWallet(userId, session = null) {
    return this.core.getOrCreateWallet(userId, session);
  }

  async getBalance(userId) {
    return this.core.getBalance(userId);
  }

  // ─── Platform Credits Engine ─────────────────────────────
  async credit(params) {
    return this.credits.credit(params);
  }

  async debit(params) {
    return this.credits.debit(params);
  }

  async rechargeWallet(params) {
    return this.credits.rechargeWallet(params);
  }

  async refund(params) {
    return this.credits.refund(params);
  }

  async earnCredits(userId, amount, reason, source = 'referral', refId = null) {
    return this.credits.earnCredits(userId, amount, reason, source, refId);
  }

  async spendCredits(userId, amount, reason, refType = 'system') {
    return this.credits.spendCredits(userId, amount, reason, refType);
  }

  // ─── Role-Isolated Wallets (Vendor / Creator) ────────────
  async getRoleWallet(userId, role, session = null) {
    return this.isolated.getRoleWallet(userId, role, session);
  }

  async getRoleBalance(userId, role) {
    return this.isolated.getRoleBalance(userId, role);
  }

  async roleCredit(params) {
    return this.isolated.roleCredit(params);
  }

  async roleDebit(params) {
    return this.isolated.roleDebit(params);
  }

  // ─── Subscriptions & Credit Plans ─────────────────────────
  async rechargeCreditPlan(params) {
    return this.subscription.rechargeCreditPlan(params);
  }

  async purchasePlan(params) {
    return this.subscription.purchasePlan(params);
  }

  async purchasePlanDirect(params) {
    return this.subscription.purchasePlanDirect(params);
  }

  // ─── Merchant Fiat Sales Payouts ──────────────────────────
  async requestPayout(params) {
    return this.payout.requestPayout(params);
  }

  async depositInr(userId, paise, reason) {
    return this.payout.depositInr(userId, paise, reason);
  }

  // ─── Ledger & Transactions ────────────────────────────────
  async getRoleTransactions(userId, role, page = 1, limit = 50) {
    return this.ledger.getRoleTransactions(userId, role, page, limit);
  }

  async getTransactions(userId, page = 1, limit = 50) {
    return this.ledger.getTransactions(userId, page, limit);
  }

  async listTransactions(userId, limit = 50, page = 1) {
    return this.ledger.listTransactions(userId, limit, page);
  }

  // ─── Internal Event & Serialization Helpers ───────────────
  _serializeTxn(txn) {
    return this.events._serializeTxn(txn);
  }

  _emitWalletUpdate(userId, newBalance, action, amount, reason) {
    return this.events._emitWalletUpdate(userId, newBalance, action, amount, reason);
  }

  _emitSubscriptionUpdate(userId) {
    return this.events._emitSubscriptionUpdate(userId);
  }
}

const serviceInstance = new WalletService();
module.exports = serviceInstance;
