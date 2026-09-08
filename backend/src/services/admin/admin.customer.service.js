const mongoose = require('mongoose');
const User = require('../../models/User');
const Order = require('../../models/Order');
const Deal = require('../../models/Deal');
const { Review, Wallet, Payment, Notification } = require('../../models/Phase4');
const { AuditLog, Referral } = require('../../models/Misc');
const Inquiry = require('../../models/Inquiry');
const ApiError = require('../../utils/ApiError');
const { getCache, setCache, deleteCache } = require('../../utils/cache');
const {
  runInTransaction,
  deleteMediaFile,
  recalculateUserRating,
  recalculateListingRating,
  cleanBaseUserAccount,
} = require('./admin.common');

const listCustomers = async ({
  q,
  status,
  kyc_status,
  has_orders,
  registered_from,
  registered_to,
  sort,
  page = 1,
  limit = 20
}) => {
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
  const skipNum = (pageNum - 1) * limitNum;

  const matchStage = {
    is_deleted: { $ne: true },
    roles: 'customer'
  };

  if (q) {
    const escaped = String(q).trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const _q = escaped.slice(0, 80);
    const orClauses = [
      { name: { $regex: _q, $options: 'i' } },
      { phone: { $regex: _q } },
      { email: { $regex: _q, $options: 'i' } }
    ];
    if (mongoose.Types.ObjectId.isValid(q)) {
      orClauses.push({ _id: new mongoose.Types.ObjectId(q) });
    }
    matchStage.$or = orClauses;
  }

  if (status) {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'active') {
      matchStage.is_banned = { $ne: true };
      matchStage.is_active = { $ne: false };
    } else if (lowerStatus === 'suspended') {
      matchStage.is_banned = { $ne: true };
      matchStage.is_active = false;
    } else if (lowerStatus === 'blocked') {
      matchStage.is_banned = true;
    } else if (lowerStatus === 'inactive') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      matchStage.$or = [
        { is_active: false },
        { lastLoginAt: { $lt: thirtyDaysAgo } },
        { lastLoginAt: { $exists: false } }
      ];
    }
  }

  if (kyc_status) {
    const lowerKyc = kyc_status.toLowerCase();
    if (lowerKyc === 'verified') {
      matchStage.kyc_status = 'approved';
    } else if (lowerKyc === 'unverified') {
      matchStage.kyc_status = { $ne: 'approved' };
    } else {
      matchStage.kyc_status = lowerKyc;
    }
  }

  if (registered_from || registered_to) {
    matchStage.created_at = {};
    if (registered_from) {
      const fromDate = new Date(registered_from);
      if (!isNaN(fromDate.getTime())) {
        matchStage.created_at.$gte = fromDate;
      }
    }
    if (registered_to) {
      const toDate = new Date(registered_to);
      if (!isNaN(toDate.getTime())) {
        matchStage.created_at.$lte = toDate;
      }
    }
  }

  const sortStage = {};
  if (sort) {
    switch (sort) {
      case 'newest_first':
      case 'newest':
        sortStage.created_at = -1;
        break;
      case 'oldest_first':
      case 'oldest':
        sortStage.created_at = 1;
        break;
      case 'name_asc':
      case 'name_a_z':
        sortStage.name = 1;
        break;
      case 'name_desc':
      case 'name_z_a':
        sortStage.name = -1;
        break;
      case 'highest_spending':
      case 'spending_desc':
        sortStage.total_spent = -1;
        break;
      case 'lowest_spending':
      case 'spending_asc':
        sortStage.total_spent = 1;
        break;
      case 'most_orders':
      case 'orders_desc':
        sortStage.total_orders = -1;
        break;
      case 'least_orders':
      case 'orders_asc':
        sortStage.total_orders = 1;
        break;
      case 'last_login':
        sortStage.lastLoginAt = -1;
        break;
      default:
        sortStage.created_at = -1;
    }
  } else {
    sortStage.created_at = -1;
  }

  const needsAggBeforePage = 
    (has_orders !== undefined && has_orders !== null) ||
    ['highest_spending', 'spending_desc', 'lowest_spending', 'spending_asc', 'most_orders', 'orders_desc', 'least_orders', 'orders_asc'].includes(sort);

  let data = [];
  let total = 0;

  if (!needsAggBeforePage) {
    total = await User.countDocuments(matchStage);
    const users = await User.find(matchStage)
      .sort(sortStage)
      .skip(skipNum)
      .limit(limitNum)
      .lean();

    const userIds = users.map(u => u._id);
    if (userIds.length > 0) {
      const aggData = await User.aggregate([
        { $match: { _id: { $in: userIds } } },
        {
          $project: {
            _id: 1,
            _id_str: { $toString: '$_id' },
            name: 1,
            email: 1,
            phone: 1,
            profile_pic: 1,
            avatarUrl: 1,
            is_active: 1,
            is_banned: 1,
            kyc_status: 1,
            referral_code: 1,
            created_at: 1,
            lastLoginAt: 1,
            lastLoginIp: 1
          }
        },
        {
          $lookup: {
            from: 'wallets',
            localField: '_id_str',
            foreignField: 'user_id',
            as: 'wallet_doc'
          }
        },
        {
          $unwind: {
            path: '$wallet_doc',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: 'orders',
            localField: '_id',
            foreignField: 'customer',
            as: 'all_orders'
          }
        },
        {
          $lookup: {
            from: 'deals',
            localField: '_id_str',
            foreignField: 'buyer_id',
            as: 'all_deals'
          }
        },
        {
          $project: {
            id: '$_id',
            _id: 1,
            name: 1,
            email: 1,
            phone: 1,
            profile_pic: { $ifNull: ['$profile_pic', '$avatarUrl'] },
            is_active: 1,
            is_banned: 1,
            kyc_status: 1,
            referral_code: 1,
            created_at: 1,
            lastLoginAt: 1,
            lastLoginIp: 1,
            wallet: {
              credits: { $ifNull: ['$wallet_doc.credits', 0] },
              balance_inr_paise: { $ifNull: ['$wallet_doc.balance_inr_paise', 0] },
              is_frozen: { $ifNull: ['$wallet_doc.is_frozen', false] }
            },
            paid_orders: {
              $filter: {
                input: '$all_orders',
                as: 'o',
                cond: { $eq: ['$$o.paymentStatus', 'paid'] }
              }
            },
            completed_deals: {
              $filter: {
                input: '$all_deals',
                as: 'd',
                cond: { $eq: ['$$d.status', 'completed'] }
              }
            }
          }
        },
        {
          $project: {
            id: 1,
            _id: 1,
            name: 1,
            email: 1,
            phone: 1,
            profile_pic: 1,
            is_active: 1,
            is_banned: 1,
            kyc_status: 1,
            referral_code: 1,
            created_at: 1,
            lastLoginAt: 1,
            lastLoginIp: 1,
            wallet: 1,
            total_orders: {
              $add: [
                { $size: { $ifNull: ['$paid_orders', []] } },
                { $size: { $ifNull: ['$completed_deals', []] } }
              ]
            },
            total_spent: {
              $add: [
                { $sum: { $ifNull: ['$paid_orders.price', []] } },
                { $sum: { $ifNull: ['$completed_deals.current_offer', []] } }
              ]
            }
          }
        }
      ]);

      const dataMap = new Map(aggData.map(item => [item._id.toString(), item]));
      data = users.map(u => dataMap.get(u._id.toString())).filter(Boolean);
    }
  } else {
    const pipeline = [
      { $match: matchStage },
      {
        $project: {
          _id: 1,
          _id_str: { $toString: '$_id' },
          name: 1,
          email: 1,
          phone: 1,
          profile_pic: 1,
          avatarUrl: 1,
          is_active: 1,
          is_banned: 1,
          kyc_status: 1,
          referral_code: 1,
          created_at: 1,
          lastLoginAt: 1,
          lastLoginIp: 1
        }
      },
      {
        $lookup: {
          from: 'wallets',
          localField: '_id_str',
          foreignField: 'user_id',
          as: 'wallet_doc'
        }
      },
      {
        $unwind: {
          path: '$wallet_doc',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'customer',
          as: 'all_orders'
        }
      },
      {
        $lookup: {
          from: 'deals',
          localField: '_id_str',
          foreignField: 'buyer_id',
          as: 'all_deals'
        }
      },
      {
        $project: {
          id: '$_id',
          _id: 1,
          name: 1,
          email: 1,
          phone: 1,
          profile_pic: { $ifNull: ['$profile_pic', '$avatarUrl'] },
          is_active: 1,
          is_banned: 1,
          kyc_status: 1,
          referral_code: 1,
          created_at: 1,
          lastLoginAt: 1,
          lastLoginIp: 1,
          wallet: {
            credits: { $ifNull: ['$wallet_doc.credits', 0] },
            balance_inr_paise: { $ifNull: ['$wallet_doc.balance_inr_paise', 0] },
            is_frozen: { $ifNull: ['$wallet_doc.is_frozen', false] }
          },
          paid_orders: {
            $filter: {
              input: '$all_orders',
              as: 'o',
              cond: { $eq: ['$$o.paymentStatus', 'paid'] }
            }
          },
          completed_deals: {
            $filter: {
              input: '$all_deals',
              as: 'd',
              cond: { $eq: ['$$d.status', 'completed'] }
            }
          }
        }
      },
      {
        $project: {
          id: 1,
          _id: 1,
          name: 1,
          email: 1,
          phone: 1,
          profile_pic: 1,
          is_active: 1,
          is_banned: 1,
          kyc_status: 1,
          referral_code: 1,
          created_at: 1,
          lastLoginAt: 1,
          lastLoginIp: 1,
          wallet: 1,
          total_orders: {
            $add: [
              { $size: { $ifNull: ['$paid_orders', []] } },
              { $size: { $ifNull: ['$completed_deals', []] } }
            ]
          },
          total_spent: {
            $add: [
              { $sum: { $ifNull: ['$paid_orders.price', []] } },
              { $sum: { $ifNull: ['$completed_deals.current_offer', []] } }
            ]
          }
        }
      }
    ];

    if (has_orders !== undefined && has_orders !== null) {
      if (has_orders === 'true') {
        pipeline.push({ $match: { total_orders: { $gt: 0 } } });
      } else if (has_orders === 'false') {
        pipeline.push({ $match: { total_orders: 0 } });
      }
    }

    pipeline.push({ $sort: sortStage });

    pipeline.push({
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [{ $skip: skipNum }, { $limit: limitNum }]
      }
    });

    const aggregateResult = await User.aggregate(pipeline);
    data = aggregateResult[0]?.data || [];
    total = aggregateResult[0]?.metadata[0]?.total || 0;
  }

  return {
    items: data.map(u => ({
      ...u,
      id: u._id.toString()
    })),
    total,
    page: pageNum,
    limit: limitNum,
    pages: Math.ceil(total / limitNum)
  };
};

const getCustomerProfileDetails = async (userId) => {
  const u = await User.findById(userId)
    .populate('customerProfile.savedListings');
  if (!u || u.is_deleted) throw ApiError.notFound('Customer not found');

  const userIdStr = userId.toString();

  let walletData = { credits: 0, balance_inr_paise: 0, is_frozen: false };
  try {
    const w = await Wallet.findOne({ user_id: userIdStr });
    if (w) {
      walletData = {
        credits: w.credits || 0,
        balance_inr_paise: w.balance_inr_paise || 0,
        is_frozen: !!w.is_frozen,
      };
    }
  } catch (e) {}

  const rawOrders = await Order.find({ customer: userId })
    .populate('vendor', 'name businessName phone email')
    .populate('listing', 'title images type category')
    .sort({ createdAt: -1 });

  const rawDeals = await Deal.find({ buyer_id: userIdStr, status: 'completed' })
    .sort({ updated_at: -1 });

  const orders = [
    ...rawOrders.map(o => ({
      id: o._id.toString(),
      type: 'product',
      item_name: o.listing?.title || 'Product Order',
      vendor_name: o.vendor?.businessName || o.vendor?.name || 'Vendor Partner',
      vendor_phone: o.vendor?.phone || '',
      quantity: o.quantity || 1,
      price: o.price || 0,
      status: o.status || 'pending',
      payment_status: o.paymentStatus || 'unpaid',
      created_at: o.createdAt,
    })),
    ...rawDeals.map(d => ({
      id: d._id.toString(),
      type: 'deal',
      item_name: d.listing_id ? 'Negotiated Deal' : 'Service Deal',
      vendor_name: 'Vendor Partner',
      vendor_phone: '',
      quantity: 1,
      price: d.final_amount || d.current_offer || 0,
      status: d.status || 'completed',
      payment_status: 'paid',
      created_at: d.created_at || d.updated_at,
    }))
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const payments = await Payment.find({ user_id: userIdStr })
    .sort({ created_at: -1 });

  const wishlist = (u.customerProfile?.savedListings || []).map(l => ({
    id: l._id?.toString(),
    title: l.title || 'Untitled Item',
    price: l.salePrice || l.price || 0,
    images: l.images || [],
    category: l.category || 'General',
    status: l.status || 'active',
  }));

  const reviews = await Review.find({
    $or: [{ author: userId }, { author: userIdStr }, { reviewer_id: userIdStr }]
  })
    .populate('targetUser', 'name businessName profile_pic')
    .populate('targetListing', 'title')
    .sort({ createdAt: -1, created_at: -1 });

  const notifications = await Notification.find({
    $or: [{ recipient: userId }, { user_id: userIdStr }]
  })
    .sort({ created_at: -1, createdAt: -1 })
    .limit(100);

  const inquiries = await Inquiry.find({ customer: userId })
    .populate('vendor', 'name businessName phone')
    .populate('listing', 'title')
    .sort({ createdAt: -1 });

  const referrals = await Referral.find({ referrer_id: userIdStr })
    .sort({ created_at: -1 });
  
  const referredByDoc = await Referral.findOne({ referred_user_id: userIdStr });
  let referredBy = null;
  if (referredByDoc) {
    const referrerUser = await User.findById(referredByDoc.referrer_id, { name: 1, email: 1 });
    if (referrerUser) {
      referredBy = {
        name: referrerUser.name,
        code: referredByDoc.code_used || 'N/A',
        status: referredByDoc.status,
      };
    }
  }

  const auditLogs = await AuditLog.find({
    $or: [{ userId }, { userId: userIdStr }, { entityId: userId }]
  }).sort({ createdAt: -1 });

  const keyMilestones = [
    'USER_REGISTER',
    'ROLE_SWITCH',
    'ROLE_ADD',
    'KYC_APPROVE',
    'KYC_REJECT',
    'USER_BAN',
    'USER_UNBAN',
    'USER_SUSPEND',
    'USER_DELETE',
    'ADMIN_ACTION'
  ];

  let timeline = auditLogs
    .filter(log => keyMilestones.includes(log.action))
    .slice(0, 20)
    .map(log => ({
      id: log._id.toString(),
      action: log.action,
      description: log.description || `Action ${log.action} performed`,
      created_at: log.createdAt || log.created_at || new Date(),
    }));

  if (timeline.length === 0 && u.created_at) {
    timeline.push({
      id: 'reg-' + u._id,
      action: 'USER_REGISTER',
      description: 'Customer account registered on BizReels platform',
      created_at: u.created_at,
    });
  }

  const loginHistory = auditLogs
    .filter(log => ['USER_LOGIN', 'login', 'login_failed'].includes(log.action))
    .slice(0, 25)
    .map(log => ({
      id: log._id.toString(),
      action: log.action,
      ip: log.ipAddress || log.ip || log.meta?.ip || '127.0.0.1',
      user_agent: log.userAgent || log.meta?.user_agent || 'Web Browser',
      created_at: log.createdAt || log.created_at,
    }));

  const activityLogs = auditLogs.slice(0, 40).map(log => ({
    id: log._id.toString(),
    action: log.action,
    description: log.description || log.meta?.description || log.action,
    ip: log.ipAddress || log.ip || '127.0.0.1',
    created_at: log.createdAt || log.created_at,
  }));

  const total_spent = orders
    .filter(o => o.payment_status === 'paid' || o.status === 'completed')
    .reduce((sum, o) => sum + (o.price || 0), 0);

  const address = u.location ? {
    address: u.location.address || '',
    city: u.location.city || u.city || '',
    district: u.location.district || '',
    state: u.location.state || '',
    pincode: u.location.pincode || '',
  } : null;

  return {
    profile: {
      id: u._id.toString(),
      name: u.name || 'Unknown Customer',
      email: u.email || '—',
      phone: u.phone || '—',
      profile_pic: u.profile_pic || u.avatarUrl || null,
      kyc_status: u.kyc_status || 'unverified',
      is_active: u.is_active !== false,
      is_banned: u.is_banned || false,
      created_at: u.created_at,
      lastLoginAt: u.lastLoginAt,
      lastLoginIp: u.lastLoginIp,
      referral_code: u.referral_code,
      roles: u.roles || ['customer'],
      address,
    },
    wallet: walletData,
    orders,
    payments,
    wishlist,
    reviews: reviews.map(r => ({
      id: r._id.toString(),
      rating: r.rating || 5,
      comment: r.comment || '',
      target_type: r.target_type || (r.targetListing ? 'listing' : 'vendor'),
      target_name: r.targetListing?.title || r.targetUser?.businessName || r.targetUser?.name || 'Item/Vendor',
      created_at: r.createdAt || r.created_at || new Date()
    })),
    notifications,
    inquiries: inquiries.map(inq => ({
      id: inq._id.toString(),
      message: inq.message || '',
      status: inq.status || 'open',
      vendor_name: inq.vendor?.businessName || inq.vendor?.name || 'Vendor Partner',
      listing_title: inq.listing?.title || 'Listing Item',
      created_at: inq.createdAt
    })),
    referrals: {
      list: referrals,
      referred_by: referredBy,
    },
    loginHistory,
    activityLogs,
    timeline,
    stats: {
      total_orders: orders.length,
      total_spent,
    }
  };
};

const getCustomerStats = async () => {
  const cacheKey = 'admin:customer:stats';
  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalCustomers,
    activeCustomers,
    newCustomersToday,
    newCustomersThisMonth,
    suspendedCustomers,
    blockedCustomers,
    verifiedCustomers
  ] = await Promise.all([
    User.countDocuments({ roles: 'customer', is_deleted: { $ne: true } }),
    User.countDocuments({ roles: 'customer', is_deleted: { $ne: true }, is_active: { $ne: false }, is_banned: { $ne: true } }),
    User.countDocuments({ roles: 'customer', is_deleted: { $ne: true }, created_at: { $gte: startOfToday } }),
    User.countDocuments({ roles: 'customer', is_deleted: { $ne: true }, created_at: { $gte: startOfMonth } }),
    User.countDocuments({ roles: 'customer', is_deleted: { $ne: true }, is_active: false, is_banned: { $ne: true } }),
    User.countDocuments({ roles: 'customer', is_deleted: { $ne: true }, is_banned: true }),
    User.countDocuments({ roles: 'customer', is_deleted: { $ne: true }, kyc_status: 'approved' })
  ]);

  const activeCustomerIds = await Order.distinct('customer', {
    status: { $in: ['pending', 'accepted', 'shipped'] }
  });
  const activeDealBuyerIds = await Deal.distinct('buyer_id', {
    status: { $in: ['negotiating', 'accepted'] }
  });

  const combinedActiveIds = Array.from(new Set([
    ...activeCustomerIds.map(id => id.toString()),
    ...activeDealBuyerIds.map(id => id.toString())
  ]));

  const customersWithActiveOrders = combinedActiveIds.length > 0
    ? await User.countDocuments({ _id: { $in: combinedActiveIds }, roles: 'customer', is_deleted: { $ne: true } })
    : 0;

  const orderGroups = await Order.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $group: { _id: '$customer', count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $count: 'total' }
  ]);
  const returningCount = orderGroups[0]?.total || 0;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  const [countLast30, countPrev30] = await Promise.all([
    User.countDocuments({ roles: 'customer', is_deleted: { $ne: true }, created_at: { $gte: thirtyDaysAgo } }),
    User.countDocuments({ roles: 'customer', is_deleted: { $ne: true }, created_at: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } })
  ]);

  const growthTrend = countPrev30 > 0
    ? Math.round(((countLast30 - countPrev30) / countPrev30) * 100)
    : (countLast30 > 0 ? 100 : 0);

  const result = {
    totalCustomers,
    activeCustomers,
    newCustomersToday,
    newCustomersThisMonth,
    suspendedCustomers,
    blockedCustomers,
    verifiedCustomers,
    customersWithActiveOrders,
    returningCustomers: returningCount,
    growthTrend
  };

  await setCache(cacheKey, result, 300);
  return result;
};

const deleteCustomer = async (userId) => {
  const mediaUrlsToDelete = [];

  const result = await runInTransaction(async (session) => {
    const user = await User.findById(userId).session(session);
    if (!user) throw ApiError.notFound('Customer not found');

    if (user.roles.includes('admin')) {
      throw ApiError.forbidden('Cannot modify or delete an admin account');
    }

    const Requirement = mongoose.model('Requirement');
    const Quote = mongoose.model('Quote');
    const Proposal = mongoose.model('Proposal');

    const requirements = await Requirement.find({ 
      $or: [{ customer_id: userId }, { customer: new mongoose.Types.ObjectId(userId) }] 
    }).session(session);

    const requirementIds = requirements.map(r => r._id);
    const requirementIdStrs = requirements.map(r => r._id.toString());

    for (const req of requirements) {
      if (req.photos && Array.isArray(req.photos)) {
        for (const photo of req.photos) {
          const url = typeof photo === 'string' ? photo : photo?.url;
          if (url) mediaUrlsToDelete.push(url);
        }
      }
      if (req.video) {
        const url = typeof req.video === 'string' ? req.video : req.video?.url;
        if (url) mediaUrlsToDelete.push(url);
      }
    }

    const quotes = await Quote.find({ requirement: { $in: requirementIds } }).session(session);
    for (const q of quotes) {
      if (q.attachments && Array.isArray(q.attachments)) {
        for (const att of q.attachments) {
          const url = typeof att === 'string' ? att : att?.url;
          if (url) mediaUrlsToDelete.push(url);
        }
      }
    }
    await Quote.deleteMany({ requirement: { $in: requirementIds } }).session(session);

    const proposals = await Proposal.find({ requirement_id: { $in: requirementIdStrs } }).session(session);
    for (const p of proposals) {
      if (p.attachments && Array.isArray(p.attachments)) {
        for (const att of p.attachments) {
          const url = typeof att === 'string' ? att : att?.url;
          if (url) mediaUrlsToDelete.push(url);
        }
      }
    }
    await Proposal.deleteMany({ requirement_id: { $in: requirementIdStrs } }).session(session);
    await Requirement.deleteMany({ _id: { $in: requirementIds } }).session(session);

    await Order.deleteMany({ customer: new mongoose.Types.ObjectId(userId) }).session(session);
    await Deal.deleteMany({ buyer_id: userId }).session(session);

    const Interaction = mongoose.model('Interaction');
    await Interaction.deleteMany({ user_id: userId }).session(session);

    const customerReviews = await Review.find({ author: new mongoose.Types.ObjectId(userId) }).session(session);
    await Review.deleteMany({ author: new mongoose.Types.ObjectId(userId) }).session(session);

    for (const rev of customerReviews) {
      if (rev.targetUser) {
        await recalculateUserRating(rev.targetUser, session);
      }
      if (rev.targetListing) {
        await recalculateListingRating(rev.targetListing, session);
      }
    }

    await Notification.deleteMany({ recipient: { $in: [userId, new mongoose.Types.ObjectId(userId)] } }).session(session);

    const ChatThread = mongoose.model('ChatThread');
    const ChatMessage = mongoose.model('ChatMessage');
    const threads = await ChatThread.find({ participants: userId }).session(session);
    const threadIds = threads.map(t => t._id.toString());

    const messages = await ChatMessage.find({ thread_id: { $in: threadIds } }).session(session);
    for (const msg of messages) {
      if (msg.media) {
        const url = typeof msg.media === 'string' ? msg.media : msg.media?.url;
        if (url) mediaUrlsToDelete.push(url);
      }
    }
    await ChatMessage.deleteMany({ thread_id: { $in: threadIds } }).session(session);
    await ChatThread.deleteMany({ participants: userId }).session(session);

    const Conversation = mongoose.model('Conversation');
    const Message = mongoose.model('Message');
    const conversations = await Conversation.find({ participants: new mongoose.Types.ObjectId(userId) }).session(session);
    const conversationIds = conversations.map(c => c._id);

    const conversationMessages = await Message.find({ conversation: { $in: conversationIds } }).session(session);
    for (const msg of conversationMessages) {
      if (msg.media && msg.media.url) {
        mediaUrlsToDelete.push(msg.media.url);
      }
    }
    await Message.deleteMany({ conversation: { $in: conversationIds } }).session(session);
    await Conversation.deleteMany({ participants: new mongoose.Types.ObjectId(userId) }).session(session);

    const WalletTransaction = mongoose.model('WalletTransaction');
    await WalletTransaction.deleteMany({ 
      user: new mongoose.Types.ObjectId(userId), 
      type: { $in: ['payment', 'refund'] } 
    }).session(session);

    user.roles = user.roles.filter(r => r !== 'customer');
    user.set('customerProfile', undefined);

    if (user.activeRole === 'customer' || user.current_role === 'customer') {
      user.activeRole = user.roles[0] || 'customer';
      user.current_role = user.roles[0] || 'customer';
    }

    if (user.roles.length === 0) {
      await cleanBaseUserAccount(userId, mediaUrlsToDelete, session);
      return { ok: true, userDeleted: true };
    } else {
      user.markModified('roles');
      user.markModified('customerProfile');
      await user.save({ session });
      return { ok: true, userDeleted: false };
    }
  });

  for (const url of mediaUrlsToDelete) {
    await deleteMediaFile(url);
  }

  try {
    const { emitToAdmin, emitToUser } = require('../../sockets');
    emitToAdmin('admin:update', { tags: ['AdminUsers', 'AdminOverview'] });
    if (result.userDeleted) {
      emitToUser(userId, 'user:deleted', {});
    } else {
      emitToUser(userId, 'user:role_deleted', { role: 'customer' });
    }
  } catch (err) {}

  await deleteCache('admin:customer:stats').catch(() => {});

  return result;
};

module.exports = {
  listCustomers,
  getCustomerProfileDetails,
  getCustomerStats,
  deleteCustomer,
};
