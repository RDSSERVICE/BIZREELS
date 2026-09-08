const mongoose = require('mongoose');
const User = require('../../models/User');
const Listing = require('../../models/Listing');
const Order = require('../../models/Order');
const Deal = require('../../models/Deal');
const { Review, Wallet } = require('../../models/Phase4');
const { AuditLog } = require('../../models/Misc');
const Inquiry = require('../../models/Inquiry');
const ApiError = require('../../utils/ApiError');
const { deleteCache } = require('../../utils/cache');
const {
  runInTransaction,
  deleteMediaFile,
  recalculateUserRating,
  recalculateListingRating,
  cleanBaseUserAccount,
} = require('./admin.common');

const listVendors = async ({
  q,
  status,
  kyc_status,
  has_listings,
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
    roles: 'vendor'
  };

  if (q) {
    const escaped = String(q).trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const _q = escaped.slice(0, 80);
    const orClauses = [
      { name: { $regex: _q, $options: 'i' } },
      { phone: { $regex: _q } },
      { email: { $regex: _q, $options: 'i' } },
      { 'vendorProfile.shopName': { $regex: _q, $options: 'i' } },
      { 'vendorProfile.businessName': { $regex: _q, $options: 'i' } }
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

  const pipeline = [
    { $match: matchStage }
  ];

  // Lookup Wallet
  pipeline.push({
    $lookup: {
      from: 'wallets',
      localField: '_id',
      foreignField: 'user_id',
      as: 'wallet_doc'
    }
  });
  pipeline.push({
    $unwind: {
      path: '$wallet_doc',
      preserveNullAndEmptyArrays: true
    }
  });

  // Lookup Listings
  pipeline.push({
    $lookup: {
      from: 'listings',
      let: { vendorId: '$_id' },
      pipeline: [
        {
          $match: {
            $expr: { $eq: ['$vendor', '$$vendorId'] },
            is_deleted: { $ne: true }
          }
        }
      ],
      as: 'listings_docs'
    }
  });

  // Lookup Paid Orders
  pipeline.push({
    $lookup: {
      from: 'orders',
      let: { vendorId: '$_id' },
      pipeline: [
        {
          $match: {
            $expr: { $eq: ['$vendor', '$$vendorId'] },
            paymentStatus: 'paid'
          }
        }
      ],
      as: 'paid_orders'
    }
  });

  // Lookup Completed Deals
  pipeline.push({
    $lookup: {
      from: 'deals',
      let: { vendorIdStr: { $toString: '$_id' } },
      pipeline: [
        {
          $match: {
            $expr: { $eq: ['$seller_id', '$$vendorIdStr'] },
            status: 'completed'
          }
        }
      ],
      as: 'completed_deals'
    }
  });

  pipeline.push({
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
      created_at: 1,
      lastLoginAt: 1,
      lastLoginIp: 1,
      vendorProfile: 1,
      wallet: {
        credits: { $ifNull: ['$wallet_doc.credits', 0] },
        balance_inr_paise: { $ifNull: ['$wallet_doc.balance_inr_paise', 0] },
        is_frozen: { $ifNull: ['$wallet_doc.is_frozen', false] }
      },
      total_listings: { $size: { $ifNull: ['$listings_docs', []] } },
      active_listings: {
        $size: {
          $filter: {
            input: { $ifNull: ['$listings_docs', []] },
            as: 'item',
            cond: { $eq: ['$$item.status', 'active'] }
          }
        }
      },
      total_deals: {
        $add: [
          { $size: { $ifNull: ['$paid_orders', []] } },
          { $size: { $ifNull: ['$completed_deals', []] } }
        ]
      },
      total_sales: {
        $add: [
          { $sum: { $ifNull: ['$paid_orders.price', []] } },
          { $sum: { $ifNull: ['$completed_deals.current_offer', []] } }
        ]
      }
    }
  });

  if (has_listings !== undefined && has_listings !== null) {
    if (has_listings === 'true') {
      pipeline.push({ $match: { total_listings: { $gt: 0 } } });
    } else if (has_listings === 'false') {
      pipeline.push({ $match: { total_listings: 0 } });
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
      case 'highest_sales':
      case 'sales_desc':
        sortStage.total_sales = -1;
        break;
      case 'most_listings':
      case 'listings_desc':
        sortStage.total_listings = -1;
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
  pipeline.push({ $sort: sortStage });

  pipeline.push({
    $facet: {
      metadata: [{ $count: 'total' }],
      data: [{ $skip: skipNum }, { $limit: limitNum }]
    }
  });

  const aggregateResult = await User.aggregate(pipeline);
  const data = aggregateResult[0]?.data || [];
  const total = aggregateResult[0]?.metadata[0]?.total || 0;

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

const getVendorProfileDetails = async (userId) => {
  const u = await User.findById(userId);
  if (!u || u.is_deleted) throw ApiError.notFound('Vendor not found');

  const userIdStr = userId.toString();

  // Wallet
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

  // Listings
  const listings = await Listing.find({ vendor: userId, is_deleted: { $ne: true } })
    .sort({ createdAt: -1 });

  // Sales History
  const rawOrders = await Order.find({ vendor: userId })
    .populate('customer', 'name phone email profile_pic')
    .populate('listing', 'title images price')
    .sort({ createdAt: -1 });

  const rawDeals = await Deal.find({ seller_id: userIdStr, status: 'completed' })
    .sort({ updated_at: -1 });

  const sales = [
    ...rawOrders.map(o => ({
      id: o._id.toString(),
      type: 'product',
      customer_name: o.customer?.name || 'Customer',
      customer_phone: o.customer?.phone || '',
      item_name: o.listing?.title || 'Product Order',
      quantity: o.quantity || 1,
      price: o.price || 0,
      status: o.status || 'pending',
      payment_status: o.paymentStatus || 'unpaid',
      created_at: o.createdAt,
    })),
    ...rawDeals.map(d => ({
      id: d._id.toString(),
      type: 'deal',
      customer_name: 'Customer Deal',
      customer_phone: '',
      item_name: d.listing_id ? 'Negotiated Deal' : 'Service Deal',
      quantity: 1,
      price: d.final_amount || d.current_offer || 0,
      status: d.status || 'completed',
      payment_status: 'paid',
      created_at: d.created_at || d.updated_at,
    }))
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Reviews received
  const listingIdsStr = listings.map(l => l._id.toString());
  const reviews = await Review.find({
    $or: [
      { targetUser: userId },
      { targetUser: userIdStr },
      { target_type: 'vendor', target_id: userIdStr },
      { target_type: 'listing', target_id: { $in: listingIdsStr } },
      { targetListing: { $in: listings.map(l => l._id) } }
    ]
  })
    .populate('author', 'name email profile_pic avatarUrl')
    .sort({ createdAt: -1, created_at: -1 });

  // Inquiries
  const inquiries = await Inquiry.find({ vendor: userId })
    .populate('customer', 'name phone email')
    .populate('listing', 'title')
    .sort({ createdAt: -1 });

  // Logs & timeline
  const auditLogs = await AuditLog.find({
    $or: [{ userId }, { userId: userIdStr }, { entityId: userId }]
  }).sort({ createdAt: -1 });

  const keyMilestones = [
    'USER_REGISTER',
    'VENDOR_PROFILE_CREATE',
    'ROLE_SWITCH',
    'ROLE_ADD',
    'LISTING_CREATE',
    'KYC_APPROVE',
    'KYC_REJECT',
    'USER_BAN',
    'USER_UNBAN',
    'USER_SUSPEND',
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
      description: 'Vendor account registered and onboarded on BizReels platform',
      created_at: u.created_at,
    });
    if (u.vendorProfile) {
      timeline.push({
        id: 'shop-setup-' + u._id,
        action: 'VENDOR_PROFILE_CREATE',
        description: `Vendor shop profile activated: "${u.vendorProfile.shopName || u.vendorProfile.businessName || u.name}"`,
        created_at: u.updated_at || u.created_at,
      });
    }
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

  const total_sales_volume = sales
    .filter(s => s.payment_status === 'paid' || s.status === 'completed')
    .reduce((sum, s) => sum + (s.price || 0), 0);

  const businessAddress = u.vendorProfile?.businessAddress || u.location?.address || '';

  return {
    profile: {
      id: u._id.toString(),
      name: u.name || 'Unknown',
      email: u.email || '—',
      phone: u.phone || '—',
      profile_pic: u.profile_pic || u.avatarUrl || null,
      kyc_status: u.kyc_status || 'unverified',
      is_active: u.is_active !== false,
      is_banned: u.is_banned || false,
      created_at: u.created_at,
      lastLoginAt: u.lastLoginAt,
      lastLoginIp: u.lastLoginIp,
      vendorProfile: u.vendorProfile,
      businessAddress,
      roles: u.roles || ['vendor'],
    },
    wallet: walletData,
    listings: listings.map(l => ({
      id: l._id.toString(),
      title: l.title || 'Untitled Listing',
      price: l.salePrice || l.price || 0,
      category: l.category || 'General',
      subcategory: l.subcategory || '',
      status: l.status || 'active',
      views: l.viewsCount || l.views || 0,
      images: l.images || [],
      created_at: l.createdAt
    })),
    sales,
    reviews: reviews.map(r => ({
      id: r._id.toString(),
      rating: r.rating || 5,
      comment: r.comment || '',
      author: {
        name: r.author?.name || 'Customer Reviewer',
        profile_pic: r.author?.profile_pic || r.author?.avatarUrl || null,
        email: r.author?.email || ''
      },
      created_at: r.createdAt || r.created_at || new Date()
    })),
    inquiries: inquiries.map(inq => ({
      id: inq._id.toString(),
      message: inq.message || '',
      status: inq.status || 'open',
      customer: inq.customer ? { name: inq.customer.name, phone: inq.customer.phone } : null,
      listing: inq.listing ? { title: inq.listing.title } : null,
      created_at: inq.createdAt
    })),
    timeline,
    loginHistory,
    activityLogs,
    stats: {
      total_listings: listings.length,
      active_listings: listings.filter(l => l.status === 'active').length,
      total_sales_volume,
      completed_orders: sales.filter(s => s.status === 'completed' || s.payment_status === 'paid').length
    }
  };
};

const getVendorStats = async () => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalVendors,
    activeVendors,
    newVendorsToday,
    newVendorsThisMonth,
    suspendedVendors,
    blockedVendors,
    verifiedVendors,
    totalListings,
    activeListings
  ] = await Promise.all([
    User.countDocuments({ roles: 'vendor', is_deleted: { $ne: true } }),
    User.countDocuments({ roles: 'vendor', is_deleted: { $ne: true }, is_active: { $ne: false }, is_banned: { $ne: true } }),
    User.countDocuments({ roles: 'vendor', is_deleted: { $ne: true }, created_at: { $gte: startOfToday } }),
    User.countDocuments({ roles: 'vendor', is_deleted: { $ne: true }, created_at: { $gte: startOfMonth } }),
    User.countDocuments({ roles: 'vendor', is_deleted: { $ne: true }, is_active: false, is_banned: { $ne: true } }),
    User.countDocuments({ roles: 'vendor', is_deleted: { $ne: true }, is_banned: true }),
    User.countDocuments({ roles: 'vendor', is_deleted: { $ne: true }, kyc_status: 'approved' }),
    Listing.countDocuments({ is_deleted: { $ne: true } }),
    Listing.countDocuments({ is_deleted: { $ne: true }, status: 'active' })
  ]);

  const orderSalesAgg = await Order.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $group: { _id: null, total: { $sum: '$price' } } }
  ]);
  const dealSalesAgg = await Deal.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$final_amount' } } }
  ]);

  const totalSales = (orderSalesAgg[0]?.total || 0) + (dealSalesAgg[0]?.total || 0);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  const [countLast30, countPrev30] = await Promise.all([
    User.countDocuments({ roles: 'vendor', is_deleted: { $ne: true }, created_at: { $gte: thirtyDaysAgo } }),
    User.countDocuments({ roles: 'vendor', is_deleted: { $ne: true }, created_at: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } })
  ]);

  const growthTrend = countPrev30 > 0
    ? Math.round(((countLast30 - countPrev30) / countPrev30) * 100)
    : (countLast30 > 0 ? 100 : 0);

  return {
    totalVendors,
    activeVendors,
    newVendorsToday,
    newVendorsThisMonth,
    suspendedVendors,
    blockedVendors,
    verifiedVendors,
    totalListings,
    activeListings,
    totalSales,
    growthTrend
  };
};

const deleteVendor = async (userId) => {
  const mediaUrlsToDelete = [];

  const result = await runInTransaction(async (session) => {
    const user = await User.findById(userId).session(session);
    if (!user) throw ApiError.notFound('Vendor not found');

    if (user.roles.includes('admin')) {
      throw ApiError.forbidden('Cannot modify or delete an admin account');
    }

    const listings = await Listing.find({ vendor: new mongoose.Types.ObjectId(userId) }).session(session);
    const listingIds = listings.map(l => l._id);

    for (const lst of listings) {
      if (lst.images && Array.isArray(lst.images)) {
        for (const img of lst.images) {
          if (img) mediaUrlsToDelete.push(img);
        }
      }
      if (lst.videos && Array.isArray(lst.videos)) {
        for (const vid of lst.videos) {
          if (vid) mediaUrlsToDelete.push(vid);
        }
      }
      if (lst.variants && Array.isArray(lst.variants)) {
        for (const v of lst.variants) {
          if (v.image) mediaUrlsToDelete.push(v.image);
          if (v.imageUrl) mediaUrlsToDelete.push(v.imageUrl);
        }
      }
      if (lst.serviceDetails?.coverImage) {
        mediaUrlsToDelete.push(lst.serviceDetails.coverImage);
      }
      if (lst.serviceDetails?.galleryImages && Array.isArray(lst.serviceDetails.galleryImages)) {
        for (const img of lst.serviceDetails.galleryImages) {
          if (img) mediaUrlsToDelete.push(img);
        }
      }
    }

    const Interaction = mongoose.model('Interaction');
    await Interaction.deleteMany({ listing_id: { $in: listingIds.map(id => id.toString()) } }).session(session);
    await Review.deleteMany({ targetListing: { $in: listingIds } }).session(session);
    await Listing.deleteMany({ vendor: new mongoose.Types.ObjectId(userId) }).session(session);

    const ListingEvent = mongoose.model('ListingEvent');
    const ResponseEvent = mongoose.model('ResponseEvent');
    await ListingEvent.deleteMany({ 
      $or: [
        { vendor_id: userId }, 
        { listing_id: { $in: listingIds.map(id => id.toString()) } }
      ] 
    }).session(session);
    await ResponseEvent.deleteMany({ sender_id: userId }).session(session);

    const Notification = mongoose.model('Notification');
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

    const vendorReviews = await Review.find({
      $or: [{ targetUser: new mongoose.Types.ObjectId(userId) }, { author: new mongoose.Types.ObjectId(userId) }]
    }).session(session);

    await Review.deleteMany({
      $or: [{ targetUser: new mongoose.Types.ObjectId(userId) }, { author: new mongoose.Types.ObjectId(userId) }]
    }).session(session);

    for (const rev of vendorReviews) {
      if (rev.targetUser && rev.targetUser.toString() !== userId) {
        await recalculateUserRating(rev.targetUser, session);
      }
      if (rev.targetListing) {
        await recalculateListingRating(rev.targetListing, session);
      }
    }

    const WalletTransaction = mongoose.model('WalletTransaction');
    if (user.roles.includes('creator')) {
      await WalletTransaction.deleteMany({
        user: new mongoose.Types.ObjectId(userId),
        type: { $in: ['deposit', 'withdrawal'] },
        ref_type: { $in: ['order', 'deal', 'listing'] }
      }).session(session);
    } else {
      await WalletTransaction.deleteMany({
        user: new mongoose.Types.ObjectId(userId),
        type: { $in: ['deposit', 'withdrawal'] }
      }).session(session);
    }

    const Campaign = mongoose.model('Campaign');
    const HireRequest = mongoose.model('HireRequest');
    const Quote = mongoose.model('Quote');
    const Proposal = mongoose.model('Proposal');

    const vendorCampaigns = await Campaign.find({ vendor: new mongoose.Types.ObjectId(userId) }).session(session);
    for (const camp of vendorCampaigns) {
      if (camp.attachments && Array.isArray(camp.attachments)) {
        for (const att of camp.attachments) {
          if (att) mediaUrlsToDelete.push(att);
        }
      }
      if (camp.submissionUrls && Array.isArray(camp.submissionUrls)) {
        for (const sub of camp.submissionUrls) {
          if (sub.url) mediaUrlsToDelete.push(sub.url);
        }
      }
    }
    await Campaign.deleteMany({ vendor: new mongoose.Types.ObjectId(userId) }).session(session);
    await HireRequest.deleteMany({ vendor: new mongoose.Types.ObjectId(userId) }).session(session);

    const vendorQuotes = await Quote.find({ vendor: new mongoose.Types.ObjectId(userId) }).session(session);
    for (const q of vendorQuotes) {
      if (q.attachments && Array.isArray(q.attachments)) {
        for (const att of q.attachments) {
          const url = typeof att === 'string' ? att : att?.url;
          if (url) mediaUrlsToDelete.push(url);
        }
      }
    }
    await Quote.deleteMany({ vendor: new mongoose.Types.ObjectId(userId) }).session(session);

    const vendorProposals = await Proposal.find({ vendor_id: userId }).session(session);
    for (const p of vendorProposals) {
      if (p.attachments && Array.isArray(p.attachments)) {
        for (const att of p.attachments) {
          const url = typeof att === 'string' ? att : att?.url;
          if (url) mediaUrlsToDelete.push(url);
        }
      }
    }
    await Proposal.deleteMany({ vendor_id: userId }).session(session);

    user.roles = user.roles.filter(r => r !== 'vendor');
    user.vendorProfile = null;

    if (user.activeRole === 'vendor' || user.current_role === 'vendor') {
      user.activeRole = user.roles[0] || 'customer';
      user.current_role = user.roles[0] || 'customer';
    }

    if (user.roles.length === 0) {
      await cleanBaseUserAccount(userId, mediaUrlsToDelete, session);
      return { ok: true, userDeleted: true };
    } else {
      user.markModified('roles');
      user.markModified('vendorProfile');
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
      emitToUser(userId, 'user:role_deleted', { role: 'vendor' });
    }
  } catch (err) {}

  await deleteCache('admin:vendor:stats').catch(() => {});

  return result;
};

module.exports = {
  listVendors,
  getVendorProfileDetails,
  getVendorStats,
  deleteVendor,
};
