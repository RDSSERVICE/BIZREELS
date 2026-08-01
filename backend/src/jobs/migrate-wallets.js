/**
 * Wallet Migration Script
 * Migrates existing unified wallet balances into role-isolated Vendor Wallets.
 * Creator Wallets are initialized at ₹0.
 *
 * Usage: node src/jobs/migrate-wallets.js
 *
 * This script is idempotent — running it multiple times will not create duplicate wallets.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/bizreels';

async function migrate() {
  console.log('🚀 Starting wallet migration...');
  console.log(`   Connecting to: ${MONGO_URI.replace(/\/\/.*@/, '//***@')}`);

  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const { Wallet } = require('../models/Phase4');
  const IsolatedWallet = require('../models/IsolatedWallet.model');
  const User = require('../models/User');

  // 1. Fetch all existing unified wallets
  const oldWallets = await Wallet.find({}).lean();
  console.log(`📦 Found ${oldWallets.length} old unified wallets to migrate`);

  let migratedVendor = 0;
  let migratedCreator = 0;
  let skippedVendor = 0;
  let skippedCreator = 0;

  for (const oldWallet of oldWallets) {
    const userId = oldWallet.user_id;
    const balance = oldWallet.credits || 0;

    // Determine user's roles
    const user = await User.findById(userId).select('roles current_role').lean();
    const roles = user?.roles || ['customer'];

    // --- Vendor Wallet ---
    if (roles.includes('vendor')) {
      const existingVendor = await IsolatedWallet.findOne({ userId, role: 'vendor' });
      if (!existingVendor) {
        await IsolatedWallet.create({
          userId,
          role: 'vendor',
          balance,
          currency: 'INR',
          lifetime_earned: oldWallet.lifetime_earned_credits || 0,
          lifetime_spent: oldWallet.lifetime_spent_credits || 0,
          is_frozen: oldWallet.is_frozen || false,
          status: 'active',
        });
        migratedVendor++;
        console.log(`  ✅ Vendor wallet created for user ${userId} (₹${balance})`);
      } else {
        skippedVendor++;
      }
    }

    // --- Creator Wallet ---
    if (roles.includes('creator')) {
      const existingCreator = await IsolatedWallet.findOne({ userId, role: 'creator' });
      if (!existingCreator) {
        await IsolatedWallet.create({
          userId,
          role: 'creator',
          balance: 0, // Creator wallet starts at ₹0
          currency: 'INR',
          lifetime_earned: 0,
          lifetime_spent: 0,
          is_frozen: false,
          status: 'active',
        });
        migratedCreator++;
        console.log(`  ✅ Creator wallet created for user ${userId} (₹0)`);
      } else {
        skippedCreator++;
      }
    }
  }

  // 2. Also handle users who have roles but no old wallet (they just need empty isolated wallets)
  const usersWithRoles = await User.find({
    roles: { $in: ['vendor', 'creator'] },
  }).select('_id roles').lean();

  for (const user of usersWithRoles) {
    const userId = user._id.toString();

    if (user.roles.includes('vendor')) {
      const exists = await IsolatedWallet.findOne({ userId, role: 'vendor' });
      if (!exists) {
        await IsolatedWallet.create({
          userId,
          role: 'vendor',
          balance: 0,
          currency: 'INR',
          lifetime_earned: 0,
          lifetime_spent: 0,
          is_frozen: false,
          status: 'active',
        });
        migratedVendor++;
      }
    }

    if (user.roles.includes('creator')) {
      const exists = await IsolatedWallet.findOne({ userId, role: 'creator' });
      if (!exists) {
        await IsolatedWallet.create({
          userId,
          role: 'creator',
          balance: 0,
          currency: 'INR',
          lifetime_earned: 0,
          lifetime_spent: 0,
          is_frozen: false,
          status: 'active',
        });
        migratedCreator++;
      }
    }
  }

  console.log('\n══════════════════════════════════════');
  console.log('  Migration Complete');
  console.log('══════════════════════════════════════');
  console.log(`  Vendor wallets created:  ${migratedVendor}`);
  console.log(`  Creator wallets created: ${migratedCreator}`);
  console.log(`  Vendor wallets skipped:  ${skippedVendor} (already existed)`);
  console.log(`  Creator wallets skipped: ${skippedCreator} (already existed)`);
  console.log('══════════════════════════════════════\n');

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
