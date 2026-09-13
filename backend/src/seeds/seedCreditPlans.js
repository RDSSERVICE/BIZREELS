/**
 * Seed script for Approved Vendor Credit Recharge Plans and Action Rates
 * Aligned with Requirements Document v1.1 & Exotel v1.0
 */
const mongoose = require('mongoose');
const { SubscriptionPlan, AppSettings } = require('../models/Admin');

const APPROVED_PLANS = [
  {
    title: 'Starter',
    description: 'Entry-level non-expiring credit pack for emerging local businesses',
    plan_type: 'basic',
    user_type: 'vendor',
    target_role: 'vendor',
    billing_cycle: 'recharge',
    price_inr: 499,
    wallet_credits: 599,
    free_reel_boosts: 1,
    badge_text: null,
    features: '599 Wallet Credits, 1 Free Reel Boost, Non-Expiring Credits, Pay as you grow, Priority local discovery',
    features_list: [
      '599 Wallet Credits included',
      '1 Free Reel Boost included',
      'Non-Expiring credits — valid until fully used',
      'Deductions on real views, calls, and WhatsApp leads',
      'Accumulates with future recharges',
    ],
    verified_badge: false,
    sort_order: 1,
    is_active: true,
    is_archived: false,
    is_deleted: false,
  },
  {
    title: 'Growth',
    description: 'Most popular credit pack designed for high customer reach and volume leads',
    plan_type: 'standard',
    user_type: 'vendor',
    target_role: 'vendor',
    billing_cycle: 'recharge',
    price_inr: 1199,
    wallet_credits: 1599,
    free_reel_boosts: 3,
    badge_text: 'Most Popular',
    features: '1,599 Wallet Credits, 3 Free Reel Boosts, Non-Expiring Credits, Verified Gold Merchant badge, High lead conversion',
    features_list: [
      '1,599 Wallet Credits included',
      '3 Free Reel Boosts included',
      'Non-Expiring credits — valid until fully used',
      'Verified Gold Merchant Badge on all listings',
      'Priority routing for customer phone calls & chats',
    ],
    verified_badge: true,
    sort_order: 2,
    is_active: true,
    is_archived: false,
    is_deleted: false,
  },
  {
    title: 'Business',
    description: 'Best value maximum scale pack with 2,999 credits and 5 free boosts',
    plan_type: 'premium',
    user_type: 'vendor',
    target_role: 'vendor',
    billing_cycle: 'recharge',
    price_inr: 2199,
    wallet_credits: 2999,
    free_reel_boosts: 5,
    badge_text: 'Best Value',
    features: '2,999 Wallet Credits, 5 Free Reel Boosts, Non-Expiring Credits, Top priority local ranking, Dedicated business support',
    features_list: [
      '2,999 Wallet Credits included',
      '5 Free Reel Boosts included',
      'Non-Expiring credits — valid until fully used',
      'Highest priority listing and reel visibility',
      'Full marketing and high-volume order requests',
    ],
    verified_badge: true,
    sort_order: 3,
    is_active: true,
    is_archived: false,
    is_deleted: false,
  },
];

const APPROVED_CREDIT_RATES = {
  uniqueView: 0.20,
  whatsapp: 2.50,
  callConnected: 2.50,
  firstChatMessage: 0.10,
  inquiry: 0.10,
  orderRequest: 5.00,
  reelBoostAdditional: 2.00,
  dedupWindowHours: 24,
};

async function seedCreditPlansAndRates() {
  console.log('Seeding Approved Credit Plans...');
  for (const plan of APPROVED_PLANS) {
    await SubscriptionPlan.findOneAndUpdate(
      { title: plan.title, user_type: 'vendor', is_deleted: { $ne: true } },
      { $set: plan },
      { upsert: true, returnDocument: 'after' }
    );
    console.log(`Seeded plan: ${plan.title} (₹${plan.price_inr} -> ${plan.wallet_credits} Credits, ${plan.free_reel_boosts} Boosts)`);
  }

  console.log('Seeding Approved Action Credit Rates in AppSettings...');
  await AppSettings.findOneAndUpdate(
    { key: 'credit_rates' },
    {
      $set: {
        value: APPROVED_CREDIT_RATES,
        category: 'general',
        description: 'Vendor action-based credit consumption rates and dedup window',
      },
    },
    { upsert: true, new: true }
  );
  console.log('Credit rates successfully seeded:', APPROVED_CREDIT_RATES);
}

module.exports = {
  seedCreditPlansAndRates,
  APPROVED_PLANS,
  APPROVED_CREDIT_RATES,
};
