const mongoose = require('mongoose');
const User = require('../../models/User');
const Reel = require('../../models/Reel');
const HireRequest = require('../../models/HireRequest');
const Campaign = require('../../models/Campaign');
const Review = require('../../models/Review');
const { Wallet } = require('../../models/Phase4');
const { AuditLog } = require('../../models/Misc');
const ApiError = require('../../utils/ApiError');
const {
  runInTransaction,
  deleteMediaFile,
  cleanBaseUserAccount,
} = require('./admin.common');

const listCreators = async ({
  q,
  status,
  kyc_status,
  has_reels,
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
    roles: 'creator'
  };

  if (q) {
    const escaped = String(q).trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const _q = escaped.slice(0, 80);
    const orClauses = [
      { name: { $regex: _q, $options: 'i' } },
      { phone: { $regex: _q } },
      { email: { $regex: _q, $options: 'i' } },
      { 'creatorProfile.bio': { $regex: _q, $options: 'i' } }
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
      matchStage.is_banned = true;
    } else if (lowerStatus === 'inactive') {
      matchStage.is_banned = { $ne: true };
      matchStage.is_active = false;
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

  // Lookup Reels
  pipeline.push({
    $lookup: {
      from: 'reels',
      let: { creatorId: '$_id' },
      pipeline: [
        {
          $match: {
            $expr: { $eq: ['$creator', '$$creatorId'] },
            is_deleted: { $ne: true }
          }
        }
      ],
      as: 'reels_docs'
    }
  });

  // Lookup HireRequests
  pipeline.push({
    $lookup: {
      from: 'hirerequests',
      let: { creatorId: '$_id' },
      pipeline: [
        {
          $match: {
            $expr: { $eq: ['$creator', '$$creatorId'] },
            status: 'completed',
            paymentStatus: 'paid'
          }
        }
      ],
      as: 'campaigns_docs'
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
      creatorProfile: 1,
      rating_avg: 1,
      trust_score: 1,
      wallet: {
        credits: { $ifNull: ['$wallet_doc.credits', 0] },
        balance_inr_paise: { $ifNull: ['$wallet_doc.balance_inr_paise', 0] },
        is_frozen: { $ifNull: ['$wallet_doc.is_frozen', false] }
      },
      total_reels: { $size: { $ifNull: ['$reels_docs', []] } },
      total_campaigns: { $size: { $ifNull: ['$campaigns_docs', []] } },
      total_earnings: { $sum: { $ifNull: ['$campaigns_docs.budget', []] } }
    }
  });

  if (has_reels !== undefined && has_reels !== null) {
    if (has_reels === 'true') {
      pipeline.push({ $match: { total_reels: { $gt: 0 } } });
    } else if (has_reels === 'false') {
      pipeline.push({ $match: { total_reels: 0 } });
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
      case 'highest_earnings':
      case 'earnings_desc':
        sortStage.total_earnings = -1;
        break;
      case 'most_reels':
      case 'reels_desc':
        sortStage.total_reels = -1;
        break;
      case 'highest_rating':
        sortStage.rating_avg = -1;
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

const getCreatorProfileDetails = async (userId) => {
  const u = await User.findById(userId);
  if (!u || u.is_deleted) throw ApiError.notFound('Creator not found');

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

  // Reels
  const reels = await Reel.find({ creator: userId, is_deleted: { $ne: true } })
    .sort({ createdAt: -1 });

  // Hire Requests & Brand Campaigns
  const hireRequests = await HireRequest.find({
    $or: [{ creator: userId }, { creator: userIdStr }]
  })
    .populate('vendor', 'name businessName phone email')
    .sort({ createdAt: -1 });

  const brandCampaigns = await Campaign.find({
    $or: [{ creator: userId }, { creator: userIdStr }]
  })
    .populate('vendor', 'name businessName phone email')
    .sort({ createdAt: -1 });

  const campaigns = [
    ...hireRequests.map(c => ({
      id: c._id.toString(),
      title: c.title || 'Brand Video Collaboration',
      description: c.description || '',
      budget: c.budget || 0,
      deliveryDays: c.deliveryDays || 1,
      status: c.status || 'pending',
      payment_status: c.paymentStatus || 'unpaid',
      escrowStatus: c.escrowStatus || 'not_held',
      platformFee: c.platformFee || 0,
      netCreatorAmount: c.netCreatorAmount || c.budget || 0,
      vendor: c.vendor ? {
        name: c.vendor.name || 'Vendor Partner',
        businessName: c.vendor.businessName || c.vendor.name || 'Vendor Shop',
        phone: c.vendor.phone || '',
        email: c.vendor.email || ''
      } : null,
      created_at: c.createdAt
    })),
    ...brandCampaigns.map(c => ({
      id: c._id.toString(),
      title: c.title || 'Brand Sponsorship Campaign',
      description: c.description || '',
      budget: c.totalBudget || c.budget || 0,
      deliveryDays: 1,
      status: c.status || 'completed',
      payment_status: c.paymentStatus || 'paid',
      escrowStatus: 'held',
      platformFee: 0,
      netCreatorAmount: c.totalBudget || c.budget || 0,
      vendor: c.vendor ? {
        name: c.vendor.name || 'Vendor Partner',
        businessName: c.vendor.businessName || c.vendor.name || 'Vendor Shop',
        phone: c.vendor.phone || '',
        email: c.vendor.email || ''
      } : null,
      created_at: c.createdAt
    }))
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Reviews Received
  const reviews = await Review.find({
    $or: [
      { targetUser: userId },
      { targetUser: userIdStr },
      { target_id: userIdStr }
    ]
  })
    .populate('author', 'name profile_pic email phone avatarUrl')
    .sort({ createdAt: -1 });

  // Logs & Timeline
  const auditLogs = await AuditLog.find({
    $or: [{ userId }, { userId: userIdStr }, { entityId: userId }]
  }).sort({ createdAt: -1 });

  const keyMilestones = [
    'USER_REGISTER',
    'CREATOR_PROFILE_CREATE',
    'VENDOR_PROFILE_CREATE',
    'ROLE_SWITCH',
    'ROLE_ADD',
    'KYC_APPROVE',
    'KYC_REJECT',
    'USER_BAN',
    'USER_UNBAN',
    'USER_SUSPEND',
    'ADMIN_ACTION',
    'LISTING_CREATE'
  ];

  let timeline = auditLogs
    .filter(log => keyMilestones.includes(log.action))
    .slice(0, 20)
    .map(log => ({
      id: log._id.toString(),
      action: log.action,
      description: log.description || `Action ${log.action} recorded`,
      created_at: log.createdAt || log.created_at || new Date(),
    }));

  if (timeline.length === 0 && u.created_at) {
    timeline.push({
      id: 'reg-' + u._id,
      action: 'USER_REGISTER',
      description: 'Creator account registered and onboarded onto BizReels platform',
      created_at: u.created_at,
    });
    if (u.creatorProfile) {
      timeline.push({
        id: 'creator-setup-' + u._id,
        action: 'CREATOR_PROFILE_CREATE',
        description: 'Creator workspace profile activated with rates and availability',
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
      ip: log.ipAddress || log.ip || '127.0.0.1',
      user_agent: log.userAgent || 'Web Browser',
      created_at: log.createdAt || log.created_at,
    }));

  const activityLogs = auditLogs.slice(0, 40).map(log => ({
    id: log._id.toString(),
    action: log.action,
    description: log.description || log.metadata?.description || log.action,
    ip: log.ipAddress || log.ip || '127.0.0.1',
    created_at: log.createdAt || log.created_at,
  }));

  const total_earnings = campaigns
    .filter(c => c.status === 'completed' && c.payment_status === 'paid')
    .reduce((sum, c) => sum + (c.budget || 0), 0);

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
      creatorProfile: u.creatorProfile,
      city: u.city || u.creatorProfile?.city || '',
      state: u.state || u.creatorProfile?.state || '',
      roles: u.roles || ['creator'],
    },
    wallet: walletData,
    reels: reels.map(r => ({
      id: r._id.toString(),
      videoUrl: r.videoUrl,
      thumbnailUrl: r.thumbnailUrl || r.videoUrl,
      caption: r.caption || '—',
      category: r.category || 'General',
      subcategory: r.subcategory || '',
      views: r.viewsCount || r.views || 0,
      likes: r.likesCount || r.likes || 0,
      commentsCount: r.commentsCount || 0,
      sharesCount: r.sharesCount || 0,
      created_at: r.createdAt
    })),
    campaigns,
    reviews: reviews.map(r => ({
      id: r._id.toString(),
      rating: r.rating || 5,
      comment: r.comment || '',
      author: {
        name: r.author?.name || 'Client',
        profile_pic: r.author?.profile_pic || r.author?.avatarUrl || null,
        email: r.author?.email || ''
      },
      created_at: r.createdAt || r.created_at || new Date()
    })),
    timeline,
    loginHistory,
    activityLogs,
    stats: {
      total_reels: reels.length,
      total_earnings,
      completed_campaigns: campaigns.filter(c => c.status === 'completed').length,
    }
  };
};

const getCreatorStats = async () => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalCreators,
    activeCreators,
    newCreatorsToday,
    newCreatorsThisMonth,
    suspendedCreators,
    verifiedCreators,
    totalReels,
    totalCampaigns
  ] = await Promise.all([
    User.countDocuments({ roles: 'creator', is_deleted: { $ne: true } }),
    User.countDocuments({ roles: 'creator', is_deleted: { $ne: true }, is_active: { $ne: false }, is_banned: { $ne: true } }),
    User.countDocuments({ roles: 'creator', is_deleted: { $ne: true }, created_at: { $gte: startOfToday } }),
    User.countDocuments({ roles: 'creator', is_deleted: { $ne: true }, created_at: { $gte: startOfMonth } }),
    User.countDocuments({ roles: 'creator', is_deleted: { $ne: true }, is_banned: true }),
    User.countDocuments({ roles: 'creator', is_deleted: { $ne: true }, kyc_status: 'approved' }),
    Reel.countDocuments({ is_deleted: { $ne: true } }),
    HireRequest.countDocuments({})
  ]);

  return {
    totalCreators,
    activeCreators,
    newCreatorsToday,
    newCreatorsThisMonth,
    suspendedCreators,
    verifiedCreators,
    totalReels,
    totalCampaigns,
  };
};

const deleteCreator = async (userId) => {
  const mediaUrlsToDelete = [];

  const result = await runInTransaction(async (session) => {
    const user = await User.findById(userId).session(session);
    if (!user) throw ApiError.notFound('Creator not found');

    if (user.roles.includes('admin')) {
      throw ApiError.forbidden('Cannot modify or delete an admin account');
    }

    const Listing = mongoose.model('Listing');
    const ReelLike = mongoose.model('ReelLike');
    const Comment = mongoose.model('Comment');

    const reels = await Reel.find({ creator: new mongoose.Types.ObjectId(userId) }).session(session);
    const reelIds = reels.map(r => r._id);

    for (const r of reels) {
      if (r.videoUrl) mediaUrlsToDelete.push(r.videoUrl);
      if (r.thumbnailUrl) mediaUrlsToDelete.push(r.thumbnailUrl);
      if (r.mediaUrls && Array.isArray(r.mediaUrls)) {
        for (const url of r.mediaUrls) {
          if (url) mediaUrlsToDelete.push(url);
        }
      }
    }

    await ReelLike.deleteMany({ $or: [{ userId: new mongoose.Types.ObjectId(userId) }, { reelId: { $in: reelIds } }] }).session(session);
    await Comment.deleteMany({ $or: [{ userId: new mongoose.Types.ObjectId(userId) }, { reelId: { $in: reelIds } }] }).session(session);
    await Reel.deleteMany({ creator: new mongoose.Types.ObjectId(userId) }).session(session);

    const portfolioListings = await Listing.find({ 
      vendor: new mongoose.Types.ObjectId(userId), 
      category: 'Portfolio' 
    }).session(session);

    const portListingIds = portfolioListings.map(l => l._id);

    for (const lst of portfolioListings) {
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
    }
    await Listing.deleteMany({ _id: { $in: portListingIds } }).session(session);

    const creatorCampaigns = await Campaign.find({ creator: new mongoose.Types.ObjectId(userId) }).session(session);
    for (const camp of creatorCampaigns) {
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
    await Campaign.deleteMany({ creator: new mongoose.Types.ObjectId(userId) }).session(session);
    await HireRequest.deleteMany({ creator: new mongoose.Types.ObjectId(userId) }).session(session);

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

    const WalletTransaction = mongoose.model('WalletTransaction');
    if (user.roles.includes('vendor')) {
      await WalletTransaction.deleteMany({
        user: new mongoose.Types.ObjectId(userId),
        type: { $in: ['deposit', 'withdrawal'] },
        $or: [
          { ref_type: { $in: ['campaign', 'hire', 'proposal'] } },
          { description: { $regex: /(campaign|creator|hire|collaboration)/i } }
        ]
      }).session(session);
    } else {
      await WalletTransaction.deleteMany({
        user: new mongoose.Types.ObjectId(userId),
        type: { $in: ['deposit', 'withdrawal'] }
      }).session(session);
    }

    user.roles = user.roles.filter(r => r !== 'creator');
    user.creatorProfile = null;

    if (user.activeRole === 'creator' || user.current_role === 'creator') {
      user.activeRole = user.roles[0] || 'customer';
      user.current_role = user.roles[0] || 'customer';
    }

    if (user.roles.length === 0) {
      await cleanBaseUserAccount(userId, mediaUrlsToDelete, session);
      return { ok: true, userDeleted: true };
    } else {
      user.markModified('roles');
      user.markModified('creatorProfile');
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
      emitToUser(userId, 'user:role_deleted', { role: 'creator' });
    }
  } catch (err) {}

  return result;
};

module.exports = {
  listCreators,
  getCreatorProfileDetails,
  getCreatorStats,
  deleteCreator,
};
