const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const adminService = require('../services/admin.service');
const adminPhoneService = require('../services/admin-phone.service');
const nudgeService = require('../services/nudge.service');
const settingsService = require('../services/settings.service');
const commissionService = require('../services/commission.service');
const { PaymentTransaction, WalletTransaction } = require('../models/Phase4');
const Deal = require('../models/Deal');
const { AuditLog } = require('../models/Misc');
const { checkAndRecord } = require('../utils/rateLimit');
const { catchAsync } = require('../utils/helpers');
const ApiError = require('../utils/ApiError');

const router = express.Router();

const requireAdmin = (req, res, next) => {
  const roles = req.user.roles || [];
  if (!roles.includes('admin')) {
    return next(ApiError.forbidden('Admin only'));
  }
  next();
};

const parseDateString = (s) => {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

// ============================================================ ADMIN SELF PROFILE & SECURITY
router.patch('/me/profile', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { email, name } = req.body;
  const User = require('../models/User');
  const user = await User.findById(req.user._id);

  if (!user) throw ApiError.notFound('Admin user not found');

  if (email && email.toLowerCase() !== (user.email || '').toLowerCase()) {
    const existing = await User.findOne({ email: email.toLowerCase(), _id: { $ne: user._id } });
    if (existing) throw ApiError.badRequest('Email address is already in use by another account');
    user.email = email.toLowerCase();
  }

  if (name) user.name = name;
  user.updated_at = new Date().toISOString();
  await user.save();

  res.json({
    ok: true,
    message: 'Admin profile updated successfully',
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      roles: user.roles,
    },
  });
}));

router.post('/me/password', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!new_password || new_password.length < 6) {
    throw ApiError.badRequest('New password must be at least 6 characters long');
  }

  const User = require('../models/User');
  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('Admin user not found');

  if (user.password) {
    if (!current_password) {
      throw ApiError.badRequest('Current password is required');
    }
    const isMatch = await user.comparePassword(current_password);
    if (!isMatch) {
      throw ApiError.badRequest('Incorrect current password');
    }
  }

  user.password = new_password;
  user.updated_at = new Date().toISOString();
  await user.save();

  res.json({ ok: true, message: 'Password updated successfully' });
}));

// ============================================================ USER OPERATIONS
router.get('/users', requireAuth, requireAdmin, catchAsync(async (req, res) => {

  const { q, role, is_active, kyc_status, is_subscribed_verified, cursor } = req.query;
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || 30, 10)));
  const isActive = is_active !== undefined ? is_active === 'true' : null;
  const isSubbed = is_subscribed_verified !== undefined ? is_subscribed_verified === 'true' : null;

  const result = await adminService.listUsers({
    q,
    role,
    isActive,
    kycStatus: kyc_status,
    isSubscribedVerified: isSubbed,
    cursor,
    limit,
  });
  res.json(result);
}));

// ============================================================ CUSTOMER OPERATIONS
router.get('/customers', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { q, status, kyc_status, has_orders, from, to, sort } = req.query;
  const page = parseInt(req.query.page || 1, 10);
  const limit = parseInt(req.query.limit || 20, 10);

  const result = await adminService.listCustomers({
    q,
    status,
    kyc_status,
    has_orders,
    registered_from: from,
    registered_to: to,
    sort,
    page,
    limit,
  });
  res.json(result);
}));

router.get('/customers/stats', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const result = await adminService.getCustomerStats();
  res.json(result);
}));

router.get('/customers/export', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { q, status, kyc_status, has_orders, from, to, sort } = req.query;

  const result = await adminService.listCustomers({
    q,
    status,
    kyc_status,
    has_orders,
    registered_from: from,
    registered_to: to,
    sort,
    page: 1,
    limit: 5000,
  });

  const headers = [
    'Customer ID',
    'Full Name',
    'Email Address',
    'Phone Number',
    'Account Status',
    'Verification Status',
    'Registration Date',
    'Last Login',
    'Total Orders',
    'Total Spent (INR)',
    'Wallet Balance (INR)',
    'Reward Credits',
  ];

  let csvContent = headers.join(',') + '\n';

  for (const c of result.items) {
    const accountStatus = c.is_banned ? 'Blocked' : c.is_active ? 'Active' : 'Suspended';
    const row = [
      c.id,
      c.name || 'Unknown',
      c.email || '—',
      c.phone || '—',
      accountStatus,
      c.kyc_status || 'unverified',
      c.created_at ? new Date(c.created_at).toISOString() : '—',
      c.lastLoginAt ? new Date(c.lastLoginAt).toISOString() : '—',
      c.total_orders,
      c.total_spent || 0,
      c.wallet?.balance_inr_paise ? c.wallet.balance_inr_paise / 100 : 0,
      c.wallet?.credits || 0,
    ].map(escapeCSV);
    csvContent += row.join(',') + '\n';
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=customers_export.csv');
  res.send(csvContent);
}));

router.get('/customers/:user_id/details', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const result = await adminService.getCustomerProfileDetails(req.params.user_id);
  res.json(result);
}));

router.post('/users/:user_id/reset-password', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) {
    throw ApiError.badRequest('Password must be at least 6 characters long');
  }
  const result = await adminService.resetUserPassword(req.params.user_id, password);
  res.json(result);
}));

router.post('/users/:user_id/verify', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const result = await adminService.verifyUser(req.params.user_id);
  res.json(result);
}));

router.post('/users/:user_id/activate', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const result = await adminService.activateUser(req.params.user_id);
  res.json(result);
}));

// ============================================================ VENDOR OPERATIONS
router.get('/vendors', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { q, status, kyc_status, has_listings, from, to, sort } = req.query;
  const page = parseInt(req.query.page || 1, 10);
  const limit = parseInt(req.query.limit || 20, 10);

  const result = await adminService.listVendors({
    q,
    status,
    kyc_status,
    has_listings,
    registered_from: from,
    registered_to: to,
    sort,
    page,
    limit,
  });
  res.json(result);
}));

router.get('/vendors/stats', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const result = await adminService.getVendorStats();
  res.json(result);
}));

router.get('/vendors/export', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { q, status, kyc_status, has_listings, from, to, sort } = req.query;

  const result = await adminService.listVendors({
    q,
    status,
    kyc_status,
    has_listings,
    registered_from: from,
    registered_to: to,
    sort,
    page: 1,
    limit: 5000,
  });

  const headers = [
    'Vendor ID',
    'Full Name',
    'Shop Name',
    'Business Name',
    'Email Address',
    'Phone Number',
    'Account Status',
    'Verification Status',
    'Registration Date',
    'Last Login',
    'Total Listings',
    'Active Listings',
    'Completed Sales Volume (INR)',
    'Wallet Balance (INR)',
    'Reward Credits',
  ];

  let csvContent = headers.join(',') + '\n';

  for (const v of result.items) {
    const accountStatus = v.is_banned ? 'Blocked' : v.is_active ? 'Active' : 'Suspended';
    const row = [
      v.id,
      v.name || 'Unknown',
      v.vendorProfile?.shopName || '—',
      v.vendorProfile?.businessName || '—',
      v.email || '—',
      v.phone || '—',
      accountStatus,
      v.kyc_status || 'unverified',
      v.created_at ? new Date(v.created_at).toISOString() : '—',
      v.lastLoginAt ? new Date(v.lastLoginAt).toISOString() : '—',
      v.total_listings,
      v.active_listings,
      v.total_sales || 0,
      v.wallet?.balance_inr_paise ? v.wallet.balance_inr_paise / 100 : 0,
      v.wallet?.credits || 0,
    ].map(escapeCSV);
    csvContent += row.join(',') + '\n';
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=vendors_export.csv');
  res.send(csvContent);
}));

router.get('/vendors/:user_id/details', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const result = await adminService.getVendorProfileDetails(req.params.user_id);
  res.json(result);
}));

// ============================================================ CREATOR OPERATIONS
router.get('/creators', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { q, status, kyc_status, has_reels, from, to, sort } = req.query;
  const page = parseInt(req.query.page || 1, 10);
  const limit = parseInt(req.query.limit || 20, 10);

  const result = await adminService.listCreators({
    q,
    status,
    kyc_status,
    has_reels,
    registered_from: from,
    registered_to: to,
    sort,
    page,
    limit,
  });
  res.json(result);
}));

router.get('/creators/stats', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const result = await adminService.getCreatorStats();
  res.json(result);
}));

router.get('/creators/export', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { q, status, kyc_status, has_reels, from, to, sort } = req.query;

  const result = await adminService.listCreators({
    q,
    status,
    kyc_status,
    has_reels,
    registered_from: from,
    registered_to: to,
    sort,
    page: 1,
    limit: 5000,
  });

  const headers = [
    'Creator ID',
    'Full Name',
    'Email Address',
    'Phone Number',
    'Account Status',
    'Verification Status',
    'Registration Date',
    'Last Login',
    'Total Reels Published',
    'Completed Campaigns',
    'Total Earnings (INR)',
    'Wallet Balance (INR)',
    'Reward Credits',
  ];

  let csvContent = headers.join(',') + '\n';

  for (const c of result.items) {
    const accountStatus = c.is_banned ? 'Blocked' : c.is_active ? 'Active' : 'Suspended';
    const row = [
      c.id,
      c.name || 'Unknown',
      c.email || '—',
      c.phone || '—',
      accountStatus,
      c.kyc_status || 'unverified',
      c.created_at ? new Date(c.created_at).toISOString() : '—',
      c.lastLoginAt ? new Date(c.lastLoginAt).toISOString() : '—',
      c.total_reels,
      c.total_campaigns,
      c.total_earnings || 0,
      c.wallet?.balance_inr_paise ? c.wallet.balance_inr_paise / 100 : 0,
      c.wallet?.credits || 0,
    ].map(escapeCSV);
    csvContent += row.join(',') + '\n';
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=creators_export.csv');
  res.send(csvContent);
}));

router.get('/creators/:user_id/details', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const result = await adminService.getCreatorProfileDetails(req.params.user_id);
  res.json(result);
}));


router.post('/users/:user_id/freeze-wallet', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const result = await adminService.freezeWallet(req.params.user_id);
  res.json(result);
}));

router.post('/users/:user_id/unfreeze-wallet', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const result = await adminService.unfreezeWallet(req.params.user_id);
  res.json(result);
}));

router.post('/users/:user_id/ban', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const result = await adminService.banUser(req.params.user_id);
  res.json(result);
}));

router.post('/users/:user_id/unban', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const result = await adminService.unbanUser(req.params.user_id);
  res.json(result);
}));

router.post('/users/:user_id/add-role', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { role } = req.body;
  if (!role) {
    throw ApiError.badRequest('role is required');
  }
  const result = await adminService.addRole(req.params.user_id, role);
  res.json(result);
}));

router.post('/users/:user_id/remove-role', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { role } = req.body;
  if (!role) {
    throw ApiError.badRequest('role is required');
  }
  const result = await adminService.removeRole(req.params.user_id, role);
  res.json(result);
}));

// Get user detail
router.get('/users/:user_id', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const result = await adminService.getUserDetail(req.params.user_id);
  res.json(result);
}));

// Update user
router.patch('/users/:user_id', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const result = await adminService.updateUser(req.params.user_id, req.body);
  res.json(result);
}));

// Suspend user
router.post('/users/:user_id/suspend', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const result = await adminService.suspendUser(req.params.user_id);
  res.json(result);
}));

// Delete user (soft)
router.delete('/users/:user_id', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const result = await adminService.deleteUser(req.params.user_id);
  res.json(result);
}));

// Login history
router.get('/users/:user_id/login-history', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || 20, 10)));
  const result = await adminService.getLoginHistory(req.params.user_id, limit);
  res.json(result);
}));

// ============================================================ LISTINGS OPERATIONS
router.get('/listings', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { status, flagged, cursor } = req.query;
  const isFlagged = flagged !== undefined ? flagged === 'true' : null;
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || 30, 10)));

  const result = await adminService.listListings(status || null, isFlagged, cursor || null, limit);
  res.json(result);
}));

router.post('/listings/bulk-approve', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { listing_ids } = req.body;
  if (!Array.isArray(listing_ids) || listing_ids.length === 0) {
    throw ApiError.badRequest('listing_ids array required');
  }
  const Listing = require('../models/Listing');
  await Listing.updateMany({ _id: { $in: listing_ids } }, { $set: { status: 'active', is_takendown: false } });
  res.json({ ok: true, count: listing_ids.length });
}));

router.post('/listings/:listing_id/takedown', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const result = await adminService.takedownListing(req.params.listing_id);
  res.json(result);
}));

router.post('/listings/:listing_id/restore', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const result = await adminService.restoreListing(req.params.listing_id);
  res.json(result);
}));

// ============================================================ REELS OPERATIONS
router.get('/reels', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { status, is_boosted, is_trending } = req.query;
  const Reel = require('../models/Reel');
  const q = {};
  if (is_boosted !== undefined) q.isBoosted = is_boosted === 'true';
  const reels = await Reel.find(q).populate('creator', 'name phone').sort({ createdAt: -1 }).limit(50);
  res.json({
    items: reels.map(r => ({
      id: r._id.toString(),
      caption: r.caption,
      videoUrl: r.videoUrl,
      thumbnailUrl: r.thumbnailUrl,
      creator_name: r.creator?.name || 'Unknown',
      views: r.views || 0,
      likesCount: r.likesCount || 0,
      commentsCount: r.commentsCount || 0,
      isBoosted: r.isBoosted || false,
      isDeleted: r.isDeleted || false,
      createdAt: r.createdAt,
    })),
  });
}));

router.post('/reels/:reel_id/takedown', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const Reel = require('../models/Reel');
  await Reel.updateOne({ _id: req.params.reel_id }, { $set: { isDeleted: true, deletedAt: new Date() } });
  res.json({ ok: true });
}));

router.post('/reels/:reel_id/boost', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const Reel = require('../models/Reel');
  const r = await Reel.findById(req.params.reel_id);
  if (!r) throw ApiError.notFound('Reel not found');
  await Reel.updateOne({ _id: req.params.reel_id }, { $set: { isBoosted: !r.isBoosted } });
  res.json({ ok: true, isBoosted: !r.isBoosted });
}));

// ============================================================ BOOST PLANS
router.get('/boost/plans', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { BoostPlan } = require('../models/Admin');
  const plans = await BoostPlan.find({ is_deleted: { $ne: true } }).sort({ price_inr: 1 });
  res.json({ items: plans.map(p => ({ id: p._id.toString(), name: p.name, description: p.description, duration_days: p.duration_days, price_inr: p.price_inr, credits_cost: p.credits_cost, is_active: p.is_active })) });
}));

router.post('/boost/plans', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { BoostPlan } = require('../models/Admin');
  const plan = await BoostPlan.create(req.body);
  res.json({ ok: true, plan });
}));

router.patch('/boost/plans/:id', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { BoostPlan } = require('../models/Admin');
  await BoostPlan.updateOne({ _id: req.params.id }, { $set: req.body });
  res.json({ ok: true });
}));

// ============================================================ LOCATIONS
router.get('/locations', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { Location } = require('../models/Admin');
  const locs = await Location.find({}).sort({ name: 1 }).limit(100);
  res.json({ items: locs.map(l => ({ id: l._id.toString(), name: l.name, type: l.type, is_popular: l.is_popular, is_active: l.is_active })) });
}));

router.post('/locations', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { Location } = require('../models/Admin');
  const loc = await Location.create(req.body);
  
  try {
    const { emitToAdmin } = require('../sockets');
    emitToAdmin('admin:update', { tags: ['Locations'] });
  } catch (err) {}

  res.json({ ok: true, location: loc });
}));

// ============================================================ REQUIREMENTS
router.get('/requirements', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { status, type } = req.query;
  const Requirement = require('../models/Requirement');
  const q = { is_deleted: { $ne: true } };
  if (status) q.status = status;
  if (type) q.type = type;
  const reqs = await Requirement.find(q).populate('customer_id', 'name phone').sort({ created_at: -1 }).limit(50);
  res.json({
    items: reqs.map(r => ({
      id: r._id.toString(),
      title: r.title,
      type: r.type || 'product',
      category: r.category,
      budget: r.budget || r.budget_inr || 0,
      customer_name: r.customer_id?.name || 'Customer',
      status: r.status || 'pending',
      matches_count: r.proposals_count || r.matches_count || 0,
      created_at: r.created_at || r.createdAt,
    })),
  });
}));

// ============================================================ WALLET MANUAL CREDIT/DEBIT
router.post('/wallet/manual-credit', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { user_id, amount_credits, reason } = req.body;
  if (!user_id || !amount_credits) throw ApiError.badRequest('user_id and amount_credits required');
  const walletService = require('../services/wallet.service');
  const w = await walletService.getOrCreate(user_id);
  const updated = await walletService.creditWallet(user_id, amount_credits, 'credits', reason || 'Admin Manual Credit', 'admin_credit', req.user._id.toString());
  
  try {
    const { emitToAdmin } = require('../sockets');
    emitToAdmin('admin:update', { tags: ['AdminTransactions', 'AdminOverview'] });
  } catch (err) {}

  res.json({ ok: true, wallet: updated });
}));

router.post('/wallet/manual-debit', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { user_id, amount_credits, reason } = req.body;
  if (!user_id || !amount_credits) throw ApiError.badRequest('user_id and amount_credits required');
  const walletService = require('../services/wallet.service');
  const updated = await walletService.debitWallet(user_id, amount_credits, 'credits', reason || 'Admin Manual Debit', 'admin_debit', req.user._id.toString());
  
  try {
    const { emitToAdmin } = require('../sockets');
    emitToAdmin('admin:update', { tags: ['AdminTransactions', 'AdminOverview'] });
  } catch (err) {}

  res.json({ ok: true, wallet: updated });
}));

// ============================================================ REVIEWS MODERATION
router.get('/reviews', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { target_type } = req.query;
  const { Review } = require('../models/Phase4');
  const q = { is_deleted: { $ne: true } };
  if (target_type) q.target_type = target_type;
  const reviews = await Review.find(q).sort({ created_at: -1 }).limit(50);
  res.json({
    items: reviews.map(r => ({
      id: r._id.toString(),
      reviewer_id: r.reviewer_id,
      target_type: r.target_type,
      target_id: r.target_id,
      rating: r.rating,
      comment: r.comment,
      is_active: r.is_active,
      created_at: r.created_at || r.createdAt,
    })),
  });
}));

router.delete('/reviews/:id', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { Review } = require('../models/Phase4');
  await Review.updateOne({ _id: req.params.id }, { $set: { is_deleted: true } });
  
  try {
    const { emitToAdmin } = require('../sockets');
    emitToAdmin('admin:update', { tags: ['Reviews'] });
  } catch (err) {}

  res.json({ ok: true });
}));

// ============================================================ CHAT MONITORING
router.get('/chat/reported', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { Report } = require('../models/Misc');
  const reports = await Report.find({ target_type: 'chat', is_deleted: { $ne: true } }).sort({ _id: -1 }).limit(50);
  res.json({
    items: reports.map(r => ({
      id: r._id.toString(),
      reporter_id: r.reporter_id,
      target_id: r.target_id,
      reason: r.reason,
      description: r.description,
      status: r.status,
      created_at: r.created_at,
    })),
  });
}));

// ============================================================ NOTIFICATIONS BROADCAST
router.post('/notifications/broadcast', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { channel, title, body, target_role } = req.body;
  if (!title || !body) throw ApiError.badRequest('Title and body required');
  const notificationService = require('../services/notification.service');
  const User = require('../models/User');
  const q = { is_deleted: { $ne: true } };
  if (target_role && target_role !== 'all') q.roles = target_role;
  const users = await User.find(q, { _id: 1 });
  let count = 0;
  for (const u of users) {
    await notificationService.create(u._id.toString(), 'system', title, body, { channel }, '/notifications');
    count++;
  }
  res.json({ ok: true, count, channel: channel || 'in_app' });
}));

// ============================================================ COUPONS & OFFERS
router.get('/coupons', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { Coupon } = require('../models/Admin');
  const coupons = await Coupon.find({ is_deleted: { $ne: true } }).sort({ created_at: -1 });
  res.json({ items: coupons.map(c => ({ id: c._id.toString(), code: c.code, type: c.type, value: c.value, min_order_inr: c.min_order_inr, used_count: c.used_count, is_active: c.is_active, created_at: c.created_at })) });
}));

router.post('/coupons', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { Coupon } = require('../models/Admin');
  const coupon = await Coupon.create(req.body);
  
  try {
    const { emitToAdmin } = require('../sockets');
    emitToAdmin('admin:update', { tags: ['Coupons'] });
  } catch (err) {}

  res.json({ ok: true, coupon });
}));

// ============================================================ CMS PAGES
router.get('/cms', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { CmsPage } = require('../models/Admin');
  const pages = await CmsPage.find({}).sort({ slug: 1 });
  res.json({ items: pages.map(p => ({ slug: p.slug, title: p.title, content: p.content, is_published: p.is_published, updated_at: p.updated_at })) });
}));

router.put('/cms/:slug', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { CmsPage } = require('../models/Admin');
  const { title, content, is_published } = req.body;
  const p = await CmsPage.updateOne(
    { slug: req.params.slug },
    { $set: { title, content, is_published, last_edited_by: req.user._id.toString() } },
    { upsert: true }
  );
  
  try {
    const { emitToAdmin } = require('../sockets');
    emitToAdmin('admin:update', { tags: ['Cms'] });
  } catch (err) {}

  res.json({ ok: true });
}));

// ============================================================ APP SETTINGS
router.get('/app-settings', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { AppSettings } = require('../models/Admin');
  const settings = await AppSettings.find({});
  const map = {};
  for (const s of settings) map[s.key] = s.value;
  res.json({
    settings: {
      app_logo: map.app_logo || null,
      splash_screen: map.splash_screen || null,
      theme: map.theme || 'dark',
      languages: map.languages || ['en', 'hi'],
      currency: map.currency || 'INR (₹)',
      timezone: map.timezone || 'Asia/Kolkata (IST)',
      maintenance_mode: map.maintenance_mode || false,
      min_app_version: map.min_app_version || '1.0.0',
      otp_provider: map.otp_provider || 'msg91',
    },
  });
}));

router.patch('/app-settings', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { AppSettings } = require('../models/Admin');
  for (const [key, val] of Object.entries(req.body)) {
    await AppSettings.updateOne({ key }, { $set: { value: val } }, { upsert: true });
  }
  
  try {
    const { emitToAdmin } = require('../sockets');
    emitToAdmin('admin:update', { tags: ['AppSettings'] });
  } catch (err) {}

  res.json({ ok: true });
}));

// ============================================================ SECURITY & ADMIN LOGS
router.get('/security/logs', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { AdminLoginLog } = require('../models/Admin');
  const logs = await AdminLoginLog.find({}).sort({ created_at: -1 }).limit(50);
  res.json({ items: logs.map(l => ({ id: l._id.toString(), admin_id: l.admin_id, ip: l.ip, user_agent: l.user_agent, status: l.status, created_at: l.created_at })) });
}));

router.get('/analytics/overview', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const result = await adminService.analyticsOverview();
  res.json(result);
}));

// ============================================================ NUDGES
router.post('/nudge/scan', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const nudged = await nudgeService.nudgeOnce();
  res.json({
    ok: true,
    nudged_count: nudged,
    min_age_days: 30,
    max_views_30d_threshold: 100,
    cooldown_days: 7,
  });
}));

// ============================================================ DEV/DEMO ENDPOINTS
router.post('/seed/reset-demo', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  res.json({ ok: false, message: 'Demo seeding is disabled' });
}));

router.post('/dev/purge-test-data', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const dev = ['OTP_DEV_MODE', 'CLOUDINARY_DEV_MODE', 'RAZORPAY_DEV_MODE', 'FCM_DEV_MODE'].some(
    k => process.env[k] === 'true'
  );
  if (!dev) {
    throw new ApiError(403, 'Dev-only endpoint. Enable a *_DEV_MODE flag.');
  }

  const { dry_run = false } = req.body;
  const result = await adminService.purgeTestData(dry_run);
  res.json(result);
}));

router.post('/dev/rotate-admin-phone', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  if (process.env.OTP_DEV_MODE !== 'true') {
    throw new ApiError(403, 'Dev-only endpoint. Enable OTP_DEV_MODE=true.');
  }

  const { new_phone } = req.query;
  const result = await adminPhoneService.rotateAdminPhone(req.user._id.toString(), new_phone || null);
  res.json(result);
}));

router.post('/listings/:listing_id/dev-backdate', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const dev = ['OTP_DEV_MODE', 'CLOUDINARY_DEV_MODE', 'RAZORPAY_DEV_MODE', 'FCM_DEV_MODE'].some(
    k => process.env[k] === 'true'
  );
  if (!dev) {
    throw new ApiError(403, 'Dev-only endpoint. Enable a *_DEV_MODE flag.');
  }

  const { listing_id } = req.params;
  const days = Math.max(1, Math.min(365, parseInt(req.body.days || 35, 10)));

  const Listing = require('../models/Listing');
  const newCreated = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const result = await Listing.updateOne(
    { _id: listing_id, is_deleted: { $ne: true } },
    { $set: { created_at: newCreated, last_boost_nudge_at: null, updated_at: new Date().toISOString() } }
  );

  if (result.matchedCount === 0) {
    throw ApiError.notFound('Listing not found');
  }

  res.json({ ok: true, listing_id, created_at: newCreated, backdated_days: days });
}));

// ============================================================ SETTINGS
router.get('/settings/integrations', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const result = await settingsService.getMasked();
  res.json(result);
}));

router.patch('/settings/integrations', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const result = await settingsService.updateSettings(req.body, req.user._id.toString());
  res.json(result);
}));

router.post('/settings/integrations/test', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { allowed, remaining } = checkAndRecord(`admin_test:${req.user._id.toString()}`, 20, 3600);
  if (!allowed) {
    throw new ApiError(429, `Too many test calls. Retry in ${remaining}s.`);
  }

  const integration = String(req.query.integration || '').trim().toLowerCase();
  if (!['msg91', 'cloudinary', 'razorpay', 'fcm', 'ai_content'].includes(integration)) {
    throw ApiError.badRequest('Unknown integration');
  }

  try {
    if (integration === 'msg91') {
      const msg91Service = require('../services/msg91.service');
      const crypto = require('crypto');
      const otp = crypto.randomInt(100000, 999999).toString();
      const response = await msg91Service.sendOtpSms(req.user.phone, otp);
      return res.json({
        ok: true,
        integration: 'msg91',
        dev_mode: msg91Service.isDevMode(),
        sent_to: req.user.phone,
        provider_response: response || null,
      });
    }

    if (integration === 'cloudinary') {
      const cloudinaryService = require('../services/cloudinary.service');
      if (cloudinaryService.isDevMode()) {
        return res.json({
          ok: true,
          integration: 'cloudinary',
          dev_mode: true,
          note: 'Dev mode active — uploads go to local disk. Toggle dev_mode off to test real keys.',
        });
      }
      if (!cloudinaryService.hasCredentials()) {
        throw ApiError.badRequest('Cloudinary keys missing');
      }
      const cloudApi = require('cloudinary').v2.api;
      const info = await cloudApi.ping();
      return res.json({
        ok: true,
        integration: 'cloudinary',
        dev_mode: false,
        provider_response: info,
      });
    }

    if (integration === 'razorpay') {
      const razorpayService = require('../services/razorpay.service');
      const order = await razorpayService.createOrder(100, `admin-test-${req.user._id.toString().slice(0, 6)}`, {
        purpose: 'admin_test',
      });
      return res.json({
        ok: true,
        integration: 'razorpay',
        dev_mode: razorpayService.isDevMode(),
        order: {
          id: order.id,
          amount: order.amount,
          status: order.status,
          mock: !!order.mock,
        },
      });
    }

    if (integration === 'fcm') {
      const fcmService = require('../services/fcm.service');
      if (fcmService.isDevMode()) {
        return res.json({
          ok: true,
          integration: 'fcm',
          dev_mode: true,
          note: 'Dev mode active — pushes are log-only. Toggle dev_mode off to init firebase-admin.',
        });
      }
      const appObj = fcmService.getFirebaseApp();
      if (!appObj) {
        throw ApiError.badRequest('firebase-admin init failed (check service_account_json)');
      }
      return res.json({
        ok: true,
        integration: 'fcm',
        dev_mode: false,
        project_id: appObj.options?.projectId || 'initialized',
      });
    }

    if (integration === 'ai_content') {
      const aiService = require('../services/ai.service');
      const pingRes = await aiService.ping();
      return res.json({
        integration: 'ai_content',
        ...pingRes,
      });
    }
  } catch (err) {
    if (err.statusCode) throw err;
    res.json({ ok: false, integration, error: err.message.slice(0, 400) });
  }
}));

// ============================================================ TRANSACTION LISTS
const fetchTransactions = async (type, status, userId, fromDate, toDate, limit) => {
  const dtFrom = parseDateString(fromDate);
  const dtTo = parseDateString(toDate);

  const common = { is_deleted: { $ne: true } };
  if (status) {
    common.status = status;
  }
  if (userId) {
    common.user_id = userId;
  }
  if (dtFrom || dtTo) {
    common.created_at = {};
    if (dtFrom) common.created_at.$gte = dtFrom.toISOString();
    if (dtTo) common.created_at.$lte = dtTo.toISOString();
  }

  const items = [];
  if (type === 'all' || type === 'payment' || !type) {
    const pays = await PaymentTransaction.find(common).sort({ _id: -1 }).limit(limit);
    for (const p of pays) {
      items.push({
        id: p._id.toString(),
        kind: 'payment',
        user_id: p.user_id,
        amount_paise: p.amount_paise || p.amount,
        currency: p.currency || 'INR',
        status: p.status,
        provider: p.provider,
        reference: p.razorpay_order_id || p.reference,
        created_at: p.created_at || p.createdAt,
      });
    }
  }

  if (type === 'all' || type === 'wallet' || !type) {
    const wts = await WalletTransaction.find(common).sort({ _id: -1 }).limit(limit);
    for (const w of wts) {
      const credits = parseInt(w.amount || w.amount_credits || 0, 10);
      items.push({
        id: w._id.toString(),
        kind: 'wallet',
        user_id: w.user_id,
        amount_paise: credits * 100,
        currency: 'CREDITS',
        status: w.status || 'posted',
        provider: w.source || w.bucket,
        reference: w.ref_id,
        created_at: w.created_at || w.createdAt,
      });
    }
  }

  items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return {
    items: items.slice(0, limit),
    count: Math.min(items.length, limit),
  };
};

router.get('/transactions', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { type, status, user_id, from, to } = req.query;
  const limit = Math.max(1, Math.min(200, parseInt(req.query.limit || 50, 10)));

  if (type && !['payment', 'wallet', 'all'].includes(type)) {
    throw ApiError.badRequest('Invalid transaction type');
  }

  const result = await fetchTransactions(type, status, user_id, from, to, limit);
  res.json(result);
}));

const escapeCSV = (val) => {
  if (val === null || val === undefined) return '';
  let str = String(val);
  if (str && ['=', '+', '-', '@'].includes(str[0])) {
    str = "'" + str;
  }
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

router.get('/transactions.csv', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const data = await fetchTransactions('all', null, null, null, null, 200);

  const headers = ['id', 'kind', 'user_id', 'amount_paise', 'currency', 'status', 'provider', 'reference', 'created_at'];
  let csvContent = headers.join(',') + '\n';

  for (const r of data.items) {
    const row = headers.map(h => escapeCSV(r[h]));
    csvContent += row.join(',') + '\n';
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
  res.send(csvContent);
}));

// ============================================================ ORDERS
router.get('/orders', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { status, vendor_id, customer_id } = req.query;
  const limit = Math.max(1, Math.min(200, parseInt(req.query.limit || 50, 10)));

  const q = { is_deleted: { $ne: true } };
  if (status) q.status = status;
  if (vendor_id) q.seller_id = vendor_id;
  if (customer_id) q.buyer_id = customer_id;

  const docs = await Deal.find(q).sort({ _id: -1 }).limit(limit);

  res.json({
    items: docs.map(d => ({
      id: d._id.toString(),
      listing_id: d.listing_id ? d.listing_id.toString() : '',
      listing_title: d.listing_title,
      buyer_id: d.buyer_id,
      seller_id: d.seller_id,
      status: d.status,
      current_offer: d.current_offer,
      final_amount: d.final_amount || d.current_offer,
      thread_id: d.thread_id ? d.thread_id.toString() : '',
      created_at: d.created_at,
    })),
    count: docs.length,
  });
}));

// ============================================================ COMMISSIONS
router.get('/commissions', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { status, vendor_id } = req.query;
  const limit = Math.max(1, Math.min(200, parseInt(req.query.limit || 50, 10)));

  const result = await commissionService.listCommissions(status, vendor_id, limit);
  res.json(result);
}));

router.get('/commissions/summary', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const periodDays = Math.max(1, Math.min(365, parseInt(req.query.period_days || 30, 10)));
  const result = await commissionService.summary(periodDays);
  res.json(result);
}));

router.post('/commissions/rate/global', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { rate } = req.body;
  const result = await commissionService.setGlobalRate(parseFloat(rate));
  res.json(result);
}));

router.post('/commissions/rate/category', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { category_id, rate } = req.body;
  const result = await commissionService.setCategoryRate(category_id, parseFloat(rate));
  res.json(result);
}));

router.post('/commissions/:cid/mark-paid', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const result = await commissionService.markPaid(req.params.cid);
  res.json(result || { error: 'not found' });
}));

// ============================================================ AUDIT LOGS
router.get('/audit-log', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { user_id, action, from, to } = req.query;
  const limit = Math.max(1, Math.min(200, parseInt(req.query.limit || 50, 10)));

  const q = {};
  if (user_id) q.$or = [{ user_id }, { userId: user_id }];
  if (action) q.action = action;

  const dtFrom = parseDateString(from);
  const dtTo = parseDateString(to);
  if (dtFrom || dtTo) {
    q.createdAt = {};
    if (dtFrom) q.createdAt.$gte = dtFrom;
    if (dtTo) q.createdAt.$lte = dtTo;
  }

  const docs = await AuditLog.find(q).sort({ _id: -1 }).limit(limit);

  res.json({
    items: docs.map(d => {
      const obj = d.toObject ? d.toObject() : d;
      const ts = obj.created_at || obj.createdAt || (d._id && d._id.getTimestamp ? d._id.getTimestamp().toISOString() : new Date().toISOString());
      const metaObj = obj.meta || obj.metadata || {};
      
      let oldValue = obj.old_value || metaObj.old_value || null;
      let newValue = obj.new_value || metaObj.new_value || obj.description || (Object.keys(metaObj).length > 0 ? JSON.stringify(metaObj, null, 2) : null);

      if (typeof oldValue === 'object' && oldValue !== null) oldValue = JSON.stringify(oldValue, null, 2);
      if (typeof newValue === 'object' && newValue !== null) newValue = JSON.stringify(newValue, null, 2);

      return {
        id: d._id.toString(),
        user_id: obj.user_id || obj.userId || 'System Admin',
        action: obj.action,
        target_user: obj.target_user || metaObj.target || obj.entityId || '—',
        meta: metaObj,
        old_value: oldValue || 'N/A',
        new_value: newValue || 'N/A',
        ip: obj.ip || obj.ipAddress || '127.0.0.1',
        created_at: typeof ts === 'object' && ts.toISOString ? ts.toISOString() : String(ts),
      };
    }),
    count: docs.length,
  });
}));


// ============================================================ SUBSCRIPTION PLANS
router.get('/subscription/plans', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { SubscriptionPlan } = require('../models/Admin');
  const plans = await SubscriptionPlan.find({ is_deleted: { $ne: true } }).sort({ price_inr: 1 });
  res.json({
    items: plans.map(p => ({
      id: p._id.toString(),
      title: p.title,
      description: p.description,
      billing_cycle: p.billing_cycle,
      price_inr: p.price_inr,
      features: p.features,
      target_role: p.target_role,
      max_listings: p.max_listings,
      priority_ranking: p.priority_ranking,
      verified_badge: p.verified_badge,
      is_active: p.is_active,
      created_at: p.created_at,
    })),
  });
}));

router.post('/subscription/plans', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { SubscriptionPlan } = require('../models/Admin');
  const plan = await SubscriptionPlan.create(req.body);
  res.json({ ok: true, plan });
}));

router.patch('/subscription/plans/:id', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { SubscriptionPlan } = require('../models/Admin');
  const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, { $set: req.body }, { returnDocument: 'after' });
  if (!plan) throw ApiError.notFound('Plan not found');
  res.json({ ok: true, plan });
}));

router.delete('/subscription/plans/:id', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { SubscriptionPlan } = require('../models/Admin');
  await SubscriptionPlan.updateOne({ _id: req.params.id }, { $set: { is_deleted: true } });
  res.json({ ok: true });
}));

// ============================================================ FINANCIAL REPORTS AGGREGATION
router.get('/reports/financial', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { period = 'monthly', report_type = 'gst' } = req.query;

  // Aggregate real data from transactions
  const User = require('../models/User');
  const Listing = require('../models/Listing');

  const totalVendors = await User.countDocuments({ roles: 'vendor', is_deleted: { $ne: true } });
  const totalCreators = await User.countDocuments({ roles: 'creator', is_deleted: { $ne: true } });
  const subscribedVendors = await User.countDocuments({ roles: 'vendor', is_subscribed_verified: true, is_deleted: { $ne: true } });

  // Aggregate wallet transactions for revenue
  const { WalletTransaction, PaymentTransaction } = require('../models/Phase4');

  const paymentAgg = await PaymentTransaction.aggregate([
    { $match: { status: { $ne: 'failed' }, is_deleted: { $ne: true } } },
    { $group: { _id: null, total_paise: { $sum: '$amount_paise' }, count: { $sum: 1 } } },
  ]);

  const walletAgg = await WalletTransaction.aggregate([
    { $match: { is_deleted: { $ne: true } } },
    { $group: { _id: '$bucket', total: { $sum: { $toInt: { $ifNull: ['$amount', 0] } } }, count: { $sum: 1 } } },
  ]);

  const totalPayments = paymentAgg[0] || { total_paise: 0, count: 0 };
  const walletByBucket = {};
  for (const w of walletAgg) {
    walletByBucket[w._id || 'other'] = { total: w.total, count: w.count };
  }

  const grossRevenuePaise = totalPayments.total_paise || 0;
  const gstAmount = Math.round(grossRevenuePaise * 0.18);
  const netRevenue = grossRevenuePaise - gstAmount;

  res.json({
    period,
    report_type,
    summary: {
      gross_revenue_paise: grossRevenuePaise,
      gst_collected_paise: gstAmount,
      net_revenue_paise: netRevenue,
      total_transactions: totalPayments.count,
      subscribed_vendors: subscribedVendors,
      total_vendors: totalVendors,
      total_creators: totalCreators,
      wallet_buckets: walletByBucket,
    },
  });
}));

// ============================================================ LOCATION RADIUS SETTINGS
router.get('/locations/radius', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { AppSettings } = require('../models/Admin');
  const setting = await AppSettings.findOne({ key: 'discovery_radius_km' });
  res.json({ radius_km: setting?.value || 25 });
}));

router.patch('/locations/radius', requireAuth, requireAdmin, catchAsync(async (req, res) => {
  const { AppSettings } = require('../models/Admin');
  const { radius_km } = req.body;
  if (!radius_km || radius_km < 1 || radius_km > 500) throw ApiError.badRequest('radius_km must be between 1 and 500');
  await AppSettings.updateOne({ key: 'discovery_radius_km' }, { $set: { value: radius_km } }, { upsert: true });
  
  try {
    const { emitToAdmin } = require('../sockets');
    emitToAdmin('admin:update', { tags: ['LocationRadius'] });
  } catch (err) {}

  res.json({ ok: true, radius_km });
}));

module.exports = router;
