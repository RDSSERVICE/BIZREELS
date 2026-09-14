const { Wallet } = require('../../models/Phase4');
const WalletTransactionV2 = require('../../models/WalletTransactionV2.model');
const User = require('../../models/User');
const logger = require('../../utils/logger');

/**
 * Wallet Core Service
 * Handles base wallet lifecycle, onboarding welcome balance, and balance lookups.
 */
class WalletCoreService {
  /**
   * Alias for getOrCreateWallet
   */
  async getOrCreate(userId, session = null) {
    return this.getOrCreateWallet(userId, session);
  }

  /**
   * Get existing wallet or create a new one with 100 free onboarding credits.
   */
  async getOrCreateWallet(userId, session = null) {
    const uid = userId.toString();
    const opts = session ? { session } : {};
    let wallet = await Wallet.findOne({ user_id: uid }, null, opts);
    if (!wallet) {
      const created = await Wallet.create([{
        user_id: uid,
        credits: 100,
        balance_inr_paise: 0,
        lifetime_earned_credits: 100,
        lifetime_spent_credits: 0,
        lifetime_deposited_paise: 0,
        lifetime_spent_paise: 0,
        is_frozen: false,
      }], opts);
      wallet = created[0];

      // Sync User walletBalance
      await User.updateOne({ _id: userId }, { $set: { walletBalance: 100 } }, opts);

      // Create onboarding transaction record
      try {
        const user = await User.findById(userId).select('name current_role roles').session(session).lean();
        await WalletTransactionV2.create([{
          user_id: uid,
          user_name: user?.name || 'Unknown',
          user_role: user?.current_role || user?.roles?.[0] || 'vendor',
          transaction_type: 'signup_bonus',
          credit_debit: 'credit',
          amount: 100,
          previous_balance: 0,
          updated_balance: 100,
          payment_method: 'internal',
          source: 'system',
          status: 'completed',
          reference_id: `welcome_${uid}`,
          admin_remarks: 'Welcome Free Onboarding Credits',
          meta: {},
        }], opts);
      } catch (err) {
        logger.warn(`Failed to create onboarding wallet transaction record: ${err.message}`);
      }
    }
    return wallet;
  }

  /**
   * Get balance for user (Platform usage credits + withrawable sales paise)
   */
  async getBalance(userId) {
    const wallet = await this.getOrCreateWallet(userId);
    return {
      credits: wallet.credits || 0,
      balance_inr_paise: wallet.balance_inr_paise || 0,
      free_reel_boosts: wallet.free_reel_boosts || 0,
      is_frozen: wallet.is_frozen || false,
    };
  }
}

module.exports = new WalletCoreService();
