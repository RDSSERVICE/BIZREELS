/**
 * Migration Script: Migrate vendor offers from embedded vendorProfile.offers[]
 * to the Offer collection with the new envelope model.
 *
 * Usage:
 *   node backend/src/scripts/migrate-offers-to-envelope.js --dry-run
 *   node backend/src/scripts/migrate-offers-to-envelope.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Offer = require('../models/Offer');
const { LEGACY_TYPE_MAP } = require('../constants/offerCategories');

const isDryRun = process.argv.includes('--dry-run');

async function connectDB() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGO_URI not set. Set it in .env or environment.');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');
}

function mapLegacyOffer(legacyOffer, vendorId) {
  const offerType = legacyOffer.offerType || legacyOffer.discountType || 'percentage';
  const category = LEGACY_TYPE_MAP[offerType] || 'discount';

  // Build category-specific config from legacy flat fields
  let config = {};
  switch (category) {
    case 'discount':
      config = {
        discountType: legacyOffer.discountType === 'fixed' ? 'fixed' : 'percent',
        discountValue: Number(legacyOffer.discountValue || legacyOffer.discountPct || 0),
        applicableOn: 'store',
        minOrderAmount: Number(legacyOffer.minOrderAmount || 0),
        maxDiscountLimit: legacyOffer.maxDiscountLimit || null,
      };
      break;
    case 'buy_x_get_y':
      config = {
        buyQuantity: 1,
        getQuantity: 1,
        freeItemType: 'same_product',
        freeProductId: null,
        maxRedemptionsPerCustomer: null,
      };
      break;
    case 'combo':
      config = {
        items: [],
        individualTotalPrice: 0,
        comboPrice: 0,
        customerSaving: null,
        comboStock: null,
      };
      break;
    case 'festival_seasonal':
      config = {
        festivalName: legacyOffer.title || 'Festival Offer',
        offerPeriodStart: null,
        offerPeriodEnd: null,
        specialDiscount: Number(legacyOffer.discountValue || legacyOffer.discountPct || 0),
        applicableProducts: [],
        specialBannerUrl: null,
        dailyLimit: null,
        totalLimit: null,
        campaignType: null,
      };
      break;
    case 'flash_sale':
      config = {
        startTime: legacyOffer.startTime || null,
        endTime: legacyOffer.endTime || null,
        discountValue: Number(legacyOffer.discountValue || legacyOffer.discountPct || 0),
        limitedQuantity: null,
        perCustomerLimit: null,
        countdownTimerEnabled: true,
      };
      break;
    case 'minimum_order':
      config = {
        minOrderValue: Number(legacyOffer.minOrderAmount || 0),
        discountValue: Number(legacyOffer.discountValue || legacyOffer.discountPct || 0),
        maxDiscountLimit: legacyOffer.maxDiscountLimit || null,
        applicableProducts: [],
      };
      break;
    default:
      config = {};
  }

  // Determine start/end time
  const startTime = legacyOffer.startTime
    ? new Date(legacyOffer.startTime)
    : (legacyOffer.created_at ? new Date(legacyOffer.created_at) : new Date());

  const endTime = legacyOffer.endTime
    ? new Date(legacyOffer.endTime)
    : (legacyOffer.validTill ? new Date(legacyOffer.validTill) : new Date('2026-12-31'));

  return {
    category,
    offerName: null,
    vendorId,
    isVendorOffer: true,
    config,
    title: legacyOffer.title || 'Untitled Offer',
    description: legacyOffer.description || '',
    code: legacyOffer.couponCode || legacyOffer.code || null,
    targetRoles: ['customer'],
    discountType: legacyOffer.discountType || null,
    discountValue: Number(legacyOffer.discountValue || legacyOffer.discountPct || 0),
    minOrderAmount: Number(legacyOffer.minOrderAmount || 0),
    maxDiscountLimit: legacyOffer.maxDiscountLimit || null,
    usageLimit: legacyOffer.usageLimit || null,
    startTime,
    endTime,
    priority: Number(legacyOffer.priority || 0),
    image: legacyOffer.image || legacyOffer.bannerImage || null,
    applicableProducts: legacyOffer.applicableProducts || [],
    applicableServices: legacyOffer.applicableServices || [],
    status: legacyOffer.is_active === false ? 'Disabled'
      : (endTime < new Date() ? 'Expired' : 'Active'),
    createdBy: vendorId,
    analytics: {
      viewsCount: legacyOffer.analytics?.viewsCount || legacyOffer.views || 0,
      clicksCount: legacyOffer.analytics?.clicksCount || 0,
      totalSales: legacyOffer.totalSales || 0,
    },
    usedCount: legacyOffer.usedCount || legacyOffer.usageCount || 0,
    // Preserve legacy ID reference for tracking
    _legacyId: legacyOffer.id || legacyOffer._id,
  };
}

async function migrate() {
  await connectDB();

  console.log(`\n${isDryRun ? '🔍 DRY RUN' : '🚀 LIVE MIGRATION'} — Migrating vendor embedded offers to Offer collection\n`);

  // Find all vendors with embedded offers
  const vendors = await User.find({
    'vendorProfile.offers': { $exists: true, $ne: [] },
    is_deleted: { $ne: true },
  }).select('_id name vendorProfile.offers').lean();

  console.log(`Found ${vendors.length} vendors with embedded offers\n`);

  let totalMigrated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  const report = [];

  for (const vendor of vendors) {
    const offers = vendor.vendorProfile?.offers || [];
    const vendorId = vendor._id;

    console.log(`── Vendor: ${vendor.name || vendorId} — ${offers.length} offers`);

    for (const legacyOffer of offers) {
      try {
        const mapped = mapLegacyOffer(legacyOffer, vendorId);

        // Check if already migrated (by legacy ID)
        if (mapped._legacyId) {
          const existing = await Offer.findOne({
            vendorId,
            title: mapped.title,
            isVendorOffer: true,
            isDeleted: { $ne: true },
          }).lean();

          if (existing) {
            console.log(`   ⏭️  SKIP: "${mapped.title}" — already exists in Offer collection`);
            totalSkipped++;
            continue;
          }
        }

        const legacyId = mapped._legacyId;
        delete mapped._legacyId;

        report.push({
          vendorId: vendorId.toString(),
          vendorName: vendor.name,
          legacyId,
          title: mapped.title,
          oldType: legacyOffer.offerType || legacyOffer.discountType || 'unknown',
          newCategory: mapped.category,
          status: mapped.status,
        });

        if (!isDryRun) {
          await Offer.create(mapped);
          console.log(`   ✅ MIGRATED: "${mapped.title}" → category: ${mapped.category}`);
        } else {
          console.log(`   📋 WOULD MIGRATE: "${mapped.title}" → category: ${mapped.category} (status: ${mapped.status})`);
        }

        totalMigrated++;
      } catch (err) {
        console.error(`   ❌ ERROR: "${legacyOffer.title}" — ${err.message}`);
        totalErrors++;
      }
    }
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`Migration ${isDryRun ? 'Report (DRY RUN)' : 'Complete'}`);
  console.log(`  Total migrated: ${totalMigrated}`);
  console.log(`  Total skipped:  ${totalSkipped}`);
  console.log(`  Total errors:   ${totalErrors}`);
  console.log(`${'═'.repeat(60)}\n`);

  if (isDryRun && report.length > 0) {
    console.log('Diff Report:');
    console.table(report.map(r => ({
      Vendor: r.vendorName || r.vendorId,
      Title: r.title,
      'Old Type': r.oldType,
      'New Category': r.newCategory,
      Status: r.status,
    })));
  }

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
