const Reel = require('../../models/Reel');
const LiveStream = require('../../models/LiveStream');
const User = require('../../models/User');
const { AuditLog } = require('../../models/Misc');
const ApiError = require('../../utils/ApiError');
const { emitToAdmin, emitToRole } = require('../../sockets');

/**
 * Admin Reel Subservice
 * Encapsulates video catalog operations, AI/community moderation workflows,
 * commercial telemetry aggregation, and batch actions.
 */
class AdminReelService {
  /**
   * High-Performance Aggregated Video Platform Telemetry
   */
  async getAdminReelStats() {
    const baseMatch = {};

    const [totalsAgg, boostedCount, reviewQueueCount, deletedCount, liveCount] = await Promise.all([
      // Total published reels, views, likes, comments (excluding soft-deleted)
      Reel.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        {
          $group: {
            _id: null,
            totalReels: { $sum: 1 },
            totalViews: { $sum: { $ifNull: ['$views', 0] } },
            totalLikes: { $sum: { $ifNull: ['$likesCount', 0] } },
            totalComments: { $sum: { $ifNull: ['$commentsCount', 0] } },
            trendingCount: {
              $sum: { $cond: [{ $gte: ['$views', 50] }, 1, 0] }
            }
          }
        }
      ]),
      // Active boosted reels count
      Reel.countDocuments({ isDeleted: { $ne: true }, isBoosted: true }),
      // Review queue (AI flagged or pending admin review)
      Reel.countDocuments({
        isDeleted: { $ne: true },
        $or: [
          { 'aiModeration.passed': false },
          { 'adminReview.status': 'pending' },
          { status: 'pending_admin_review' },
          { status: 'pending_ai_review' }
        ]
      }),
      // Soft-deleted reels count
      Reel.countDocuments({ isDeleted: true }).setOptions({ includeSoftDeleted: true }),
      // Active live broadcasts
      LiveStream.countDocuments({ status: 'live' }).catch(() => 0)
    ]);

    const metrics = totalsAgg[0] || {
      totalReels: 0,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      trendingCount: 0
    };

    return {
      totalReels: metrics.totalReels,
      totalViews: metrics.totalViews,
      totalLikes: metrics.totalLikes,
      totalComments: metrics.totalComments,
      trendingReels: metrics.trendingCount,
      boostedReels: boostedCount,
      reviewQueue: reviewQueueCount,
      deletedReels: deletedCount,
      liveStreams: liveCount
    };
  }

  /**
   * Paginated, Filterable Reel Listings with Server-Side Search
   */
  async listAdminReels(queryParams = {}) {
    const {
      q,
      status,
      category,
      postType,
      is_boosted,
      is_trending,
      is_reported,
      is_deleted,
      is_live,
      from,
      to
    } = queryParams;

    const page = Math.max(1, parseInt(queryParams.page || 1, 10));
    const limit = Math.max(1, Math.min(100, parseInt(queryParams.limit || 20, 10)));
    const skip = (page - 1) * limit;

    // Handle Live Broadcast Streams
    if (is_live === 'true') {
      const liveFilter = { status: 'live' };
      if (q && q.trim()) {
        liveFilter.title = { $regex: q.trim(), $options: 'i' };
      }

      const [liveStreams, total] = await Promise.all([
        LiveStream.find(liveFilter)
          .populate('host', 'name phone email profile_pic')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        LiveStream.countDocuments(liveFilter)
      ]);

      const items = liveStreams.map((l) => ({
        id: l._id.toString(),
        caption: l.title || 'Live Broadcast Stream',
        videoUrl: null,
        thumbnailUrl: null,
        creator: l.host || null,
        creator_name: l.host?.name || 'Unknown Host',
        creator_phone: l.host?.phone || '',
        creator_email: l.host?.email || '',
        views: l.viewersCount || 0,
        likesCount: l.likesCount || 0,
        commentsCount: 0,
        isBoosted: false,
        isDeleted: false,
        isLiveStream: true,
        postType: 'live',
        category: 'Live Broadcast',
        createdAt: l.createdAt
      }));

      return {
        items,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 }
      };
    }

    // Handle Normal Reels
    const queryConditions = {};

    // 1. Soft-deleted vs Active
    const isDeletedQuery = is_deleted === 'true';
    if (isDeletedQuery) {
      queryConditions.isDeleted = true;
    } else {
      queryConditions.isDeleted = { $ne: true };
    }

    // 2. Boosted filter
    if (is_boosted === 'true') {
      queryConditions.isBoosted = true;
    }

    // 3. Trending filter (views >= 50 or dynamic threshold)
    if (is_trending === 'true') {
      queryConditions.views = { $gte: 50 };
    }

    // 4. Moderation / Reported / AI Flagged Queue
    if (is_reported === 'true') {
      queryConditions.$or = [
        { 'aiModeration.passed': false },
        { 'adminReview.status': 'pending' },
        { status: 'pending_admin_review' },
        { status: 'pending_ai_review' }
      ];
    }

    // 5. Category and PostType (product/service) filters
    if (category && category !== 'all') {
      queryConditions.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }
    if (postType && postType !== 'all') {
      queryConditions.postType = postType;
    }

    // 6. Status filter
    if (status && status !== 'all') {
      queryConditions.status = status;
    }

    // 7. Date Range filter
    if (from || to) {
      queryConditions.createdAt = {};
      if (from) queryConditions.createdAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        queryConditions.createdAt.$lte = toDate;
      }
    }

    // 8. Server-Side Text Search (across caption, hashtags, and creator names)
    if (q && q.trim()) {
      const regex = { $regex: q.trim(), $options: 'i' };

      // Also search creator users to match reel creator
      const matchingUsers = await User.find({
        $or: [{ name: regex }, { phone: regex }, { email: regex }]
      })
        .select('_id')
        .lean();

      const creatorIds = matchingUsers.map((u) => u._id);

      const searchOr = [
        { caption: regex },
        { hashtags: regex },
        { category: regex },
        { address: regex }
      ];

      if (creatorIds.length > 0) {
        searchOr.push({ creator: { $in: creatorIds } });
      }

      if (queryConditions.$or) {
        queryConditions.$and = [{ $or: queryConditions.$or }, { $or: searchOr }];
        delete queryConditions.$or;
      } else {
        queryConditions.$or = searchOr;
      }
    }

    // Build Mongoose Query
    let query = Reel.find(queryConditions);
    if (isDeletedQuery) {
      query = query.setOptions({ includeSoftDeleted: true });
    }

    const sortOrder = is_trending === 'true' ? { views: -1, createdAt: -1 } : { createdAt: -1 };

    const [reels, total] = await Promise.all([
      query
        .populate('creator', 'name phone email profile_pic')
        .populate('targetListing', 'title price salePrice category images listing_type store_name')
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .lean(),
      Reel.countDocuments(queryConditions).setOptions({ includeSoftDeleted: isDeletedQuery })
    ]);

    const items = reels.map((r) => ({
      id: r._id.toString(),
      caption: r.caption || 'No caption',
      videoUrl: r.videoUrl,
      thumbnailUrl: r.thumbnailUrl || '',
      mediaUrls: r.mediaUrls || [],
      mediaType: r.mediaType || 'video',
      hashtags: r.hashtags || [],
      category: r.category || 'General',
      subcategory: r.subcategory || 'General',
      postType: r.postType || 'product',
      postPurpose: r.postPurpose || 'General Promotion',
      price: r.price || 0,
      salePrice: r.salePrice || 0,
      location: r.location || null,
      address: r.address || '',
      creator: r.creator || null,
      creator_name: r.creator?.name || 'Unknown Creator',
      creator_phone: r.creator?.phone || '',
      creator_email: r.creator?.email || '',
      creator_pic: r.creator?.profile_pic || '',
      targetListing: r.targetListing || null,
      views: r.views || 0,
      likesCount: r.likesCount || 0,
      commentsCount: r.commentsCount || 0,
      isBoosted: Boolean(r.isBoosted),
      boostPlan: r.boostPlan || null,
      boostExpiresAt: r.boostExpiresAt || null,
      aiModeration: r.aiModeration || { passed: true },
      adminReview: r.adminReview || { status: 'approved' },
      status: r.status || 'published',
      isDeleted: Boolean(r.isDeleted),
      deletedAt: r.deletedAt || null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    }));

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  /**
   * Takedown / Delete Reel with Audit Logging
   */
  async takedownReel(reelId, reason = 'Administrative takedown', adminUser = null) {
    const now = new Date();

    const reel = await Reel.findOneAndUpdate(
      { _id: reelId },
      {
        $set: {
          isDeleted: true,
          deletedAt: now,
          status: 'rejected',
          'adminReview.status': 'rejected',
          'adminReview.reviewedBy': adminUser?._id || null,
          'adminReview.reviewedAt': now,
          'adminReview.comments': reason
        }
      },
      { returnDocument: 'after' }
    ).setOptions({ includeSoftDeleted: true });

    if (!reel) {
      // Check if it's an active LiveStream
      const live = await LiveStream.findByIdAndUpdate(
        reelId,
        { $set: { status: 'ended' } },
        { returnDocument: 'after' }
      );
      if (live) {
        emitToAdmin('reel:takedown', { id: reelId, isLiveStream: true });
        return { success: true, message: 'Live broadcast stream ended.' };
      }
      throw ApiError.notFound('Reel or live stream not found.');
    }

    // Create Audit Log
    if (adminUser) {
      await AuditLog.create({
        user_id: adminUser._id.toString(),
        action: 'ADMIN_ACTION',
        meta: {
          type: 'REEL_TAKEDOWN',
          reelId: reel._id.toString(),
          caption: reel.caption?.slice(0, 80),
          reason
        }
      }).catch((err) => console.error('AuditLog error on reel takedown:', err));
    }

    emitToAdmin('reel:takedown', { id: reel._id.toString(), reason });

    return { success: true, message: 'Reel taken down successfully.', reel };
  }

  /**
   * Restore Soft-Deleted Reel with Audit Logging
   */
  async restoreReel(reelId, adminUser = null) {
    const reel = await Reel.findOneAndUpdate(
      { _id: reelId },
      {
        $set: {
          isDeleted: false,
          deletedAt: null,
          status: 'published',
          'adminReview.status': 'approved',
          'adminReview.reviewedBy': adminUser?._id || null,
          'adminReview.reviewedAt': new Date(),
          'adminReview.comments': 'Restored by admin'
        }
      },
      { returnDocument: 'after' }
    ).setOptions({ includeSoftDeleted: true });

    if (!reel) {
      throw ApiError.notFound('Deleted reel not found.');
    }

    if (adminUser) {
      await AuditLog.create({
        user_id: adminUser._id.toString(),
        action: 'ADMIN_ACTION',
        meta: {
          type: 'REEL_RESTORE',
          reelId: reel._id.toString(),
          caption: reel.caption?.slice(0, 80)
        }
      }).catch((err) => console.error('AuditLog error on reel restore:', err));
    }

    emitToAdmin('reel:restored', { id: reel._id.toString() });

    return { success: true, message: 'Reel restored successfully.', reel };
  }

  /**
   * Formal AI & Community Moderation Decision
   */
  async moderateReel(reelId, { action, reason, comments }, adminUser = null) {
    const now = new Date();
    const update = {};

    if (action === 'approve') {
      update['aiModeration.passed'] = true;
      update['aiModeration.violationReason'] = null;
      update['adminReview.status'] = 'approved';
      update['adminReview.reviewedBy'] = adminUser?._id || null;
      update['adminReview.reviewedAt'] = now;
      update['adminReview.comments'] = comments || 'Approved by admin';
      update.status = 'published';
      update.isDeleted = false;
      update.deletedAt = null;
    } else if (action === 'reject' || action === 'takedown') {
      update['adminReview.status'] = 'rejected';
      update['adminReview.reviewedBy'] = adminUser?._id || null;
      update['adminReview.reviewedAt'] = now;
      update['adminReview.comments'] = comments || reason || 'Content violation';
      update.status = 'rejected';
      update.isDeleted = true;
      update.deletedAt = now;
    } else {
      throw ApiError.badRequest('Invalid moderation action. Must be "approve" or "reject".');
    }

    const reel = await Reel.findOneAndUpdate(
      { _id: reelId },
      { $set: update },
      { returnDocument: 'after' }
    ).setOptions({ includeSoftDeleted: true });

    if (!reel) {
      throw ApiError.notFound('Reel not found.');
    }

    if (adminUser) {
      await AuditLog.create({
        user_id: adminUser._id.toString(),
        action: 'ADMIN_ACTION',
        meta: {
          type: `REEL_MODERATION_${action.toUpperCase()}`,
          reelId: reel._id.toString(),
          action,
          reason: comments || reason
        }
      }).catch((err) => console.error('AuditLog error on reel moderation:', err));
    }

    emitToAdmin('reel:moderated', { id: reel._id.toString(), action });

    return { success: true, message: `Reel successfully ${action}d.`, reel };
  }

  /**
   * Toggle Boost Status for a Reel
   */
  async toggleBoostReel(reelId, adminUser = null) {
    const reel = await Reel.findById(reelId);
    if (!reel) throw ApiError.notFound('Reel not found.');

    const newBoostState = !reel.isBoosted;
    const update = { isBoosted: newBoostState };

    if (newBoostState) {
      update.boostActivatedAt = new Date();
      update.boostDurationDays = 7;
      update.boostExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      update.boostPlan = 'Admin Highlight';
    } else {
      update.boostExpiresAt = null;
    }

    await Reel.updateOne({ _id: reelId }, { $set: update });

    if (adminUser) {
      await AuditLog.create({
        user_id: adminUser._id.toString(),
        action: 'ADMIN_ACTION',
        meta: {
          type: 'REEL_BOOST_TOGGLE',
          reelId: reel._id.toString(),
          isBoosted: newBoostState
        }
      }).catch((err) => console.error('AuditLog error on reel boost toggle:', err));
    }

    emitToAdmin('reel:boosted', { id: reelId, isBoosted: newBoostState });

    return { success: true, isBoosted: newBoostState };
  }

  /**
   * Bulk Batch Actions on Reels (Takedown, Restore, Boost, Approve)
   */
  async bulkUpdateReels(reelIds = [], action, adminUser = null) {
    if (!Array.isArray(reelIds) || reelIds.length === 0) {
      throw ApiError.badRequest('reelIds must be a non-empty array.');
    }

    const now = new Date();
    let updateDoc = {};

    switch (action) {
      case 'bulk_takedown':
        updateDoc = {
          isDeleted: true,
          deletedAt: now,
          status: 'rejected',
          'adminReview.status': 'rejected',
          'adminReview.reviewedBy': adminUser?._id || null,
          'adminReview.reviewedAt': now,
          'adminReview.comments': 'Bulk takedown by admin'
        };
        break;

      case 'bulk_restore':
        updateDoc = {
          isDeleted: false,
          deletedAt: null,
          status: 'published',
          'adminReview.status': 'approved',
          'adminReview.reviewedBy': adminUser?._id || null,
          'adminReview.reviewedAt': now,
          'adminReview.comments': 'Bulk restored by admin'
        };
        break;

      case 'bulk_boost':
        updateDoc = {
          isBoosted: true,
          boostActivatedAt: now,
          boostDurationDays: 7,
          boostExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          boostPlan: 'Admin Bulk Boost'
        };
        break;

      case 'bulk_unboost':
        updateDoc = {
          isBoosted: false,
          boostExpiresAt: null
        };
        break;

      case 'bulk_approve':
        updateDoc = {
          'aiModeration.passed': true,
          'adminReview.status': 'approved',
          'adminReview.reviewedBy': adminUser?._id || null,
          'adminReview.reviewedAt': now,
          status: 'published',
          isDeleted: false,
          deletedAt: null
        };
        break;

      default:
        throw ApiError.badRequest(`Unsupported bulk action: "${action}".`);
    }

    const res = await Reel.updateMany(
      { _id: { $in: reelIds } },
      { $set: updateDoc }
    ).setOptions({ includeSoftDeleted: true });

    if (adminUser) {
      await AuditLog.create({
        user_id: adminUser._id.toString(),
        action: 'ADMIN_ACTION',
        meta: {
          type: `REELS_${action.toUpperCase()}`,
          count: res.modifiedCount,
          reelIds
        }
      }).catch((err) => console.error('AuditLog bulk reels error:', err));
    }

    emitToAdmin('admin:update', { tags: ['Reels', 'AdminOverview'] });

    return {
      success: true,
      modifiedCount: res.modifiedCount,
      message: `Successfully applied ${action} to ${res.modifiedCount} reels.`
    };
  }
}

module.exports = new AdminReelService();
