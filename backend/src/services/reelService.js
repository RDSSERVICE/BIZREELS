const cloudinary = require('../config/cloudinary');
const cloudinaryService = require('./cloudinary.service');
const reelRepository = require('../repositories/reelRepository');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { detectForbiddenContactDetails } = require('./ai.service');

/**
 * ReelService
 * Manages Reels logic including media uploads and social counter updates.
 */
class ReelService {
  /**
   * Upload video buffer to Cloudinary using streaming.
   */
  uploadVideoStream(fileBuffer, folder = 'bizreels/reels') {
    return new Promise((resolve, reject) => {
      if (!cloudinary.config().cloud_name) {
        return reject(new Error('Cloudinary is not configured.'));
      }

      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder,
          chunk_size: 6000000, // 6MB chunks for large files
          eager: [
            { width: 540, height: 960, crop: 'pad', audio_codec: 'aac', bit_rate: '1m' }, // optimize for mobile vertical viewport
          ],
          eager_async: true,
        },
        (error, result) => {
          if (error) {
            logger.error('Cloudinary upload stream failed:', { error: error.message, service: 'media' });
            return reject(error);
          }
          resolve(result);
        }
      );

      stream.end(fileBuffer);
    });
  }

  async publishReel({
    userId, fileBuffer, caption, tags, lat, lng, address,
    postType, category, subcategory, classification, postPurpose,
    targeting, videoUrl, mediaUrls, mediaType, status, scheduledDate
  }, req) {
    // Validate scheduled date if status is scheduled
    if (status === 'scheduled' || scheduledDate) {
      if (!scheduledDate) {
        throw ApiError.badRequest('Scheduled date and time is required for scheduling.');
      }
      const selectedDate = new Date(scheduledDate);
      if (isNaN(selectedDate.getTime())) {
        throw ApiError.badRequest('Invalid scheduled date and time format.');
      }
      if (selectedDate <= new Date()) {
        throw ApiError.badRequest('Scheduled date and time must be in the future.');
      }
    }

    // Check wallet balance for dynamic publish rate
    const { AppSettings } = require('../models/Admin');
    let publishCost = 1;
    try {
      const rateSetting = await AppSettings.findOne({ key: 'credit_rates' }).lean();
      if (rateSetting && rateSetting.value && rateSetting.value.reelPost !== undefined) {
        publishCost = Number(rateSetting.value.reelPost);
      }
    } catch (err) {
      logger.error('Failed to fetch credit rates for reel publishing check:', err);
    }

    if (publishCost > 0) {
      const walletService = require('./wallet.service');
      const wallet = await walletService.getOrCreateWallet(userId);
      const balance = parseInt(wallet.credits || 0, 10);
      if (balance < publishCost) {
        throw new ApiError(
          402,
          `Insufficient credits (${balance} available; ${publishCost} needed) to publish a Reel / Image Post.`
        );
      }
    }

    // Helper functions for base64 check and parsing
    const hasBase64 = (obj) => {
      if (!obj) return false;
      try {
        const str = typeof obj === 'object' ? JSON.stringify(obj) : String(obj);
        return /data:[^;]+;base64,/.test(str);
      } catch (err) {
        return false;
      }
    };

    const parseBase64 = (base64Str) => {
      const matches = base64Str.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) return null;
      const contentType = matches[1];
      const buffer = Buffer.from(matches[2], 'base64');
      return { contentType, buffer };
    };

    const uploadBase64IfPresent = async (urlStr) => {
      if (!urlStr || !hasBase64(urlStr)) return urlStr;
      const parsed = parseBase64(urlStr);
      if (!parsed) return urlStr;
      const resourceType = parsed.contentType.startsWith('video/') ? 'video' : 'image';
      const ext = parsed.contentType.split('/')[1] || (resourceType === 'video' ? 'mp4' : 'jpg');
      const filename = `reel_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
      
      const uploadResult = await cloudinaryService.uploadFile(
        parsed.buffer,
        filename,
        parsed.contentType,
        'uploads/reels',
        resourceType
      );
      return uploadResult.secure_url;
    };

    // 1. AI Safety Contact Details Check
    const audienceText = typeof targeting?.audience === 'string' ? targeting.audience : Array.isArray(targeting?.audience) ? targeting.audience.join(' ') : '';
    const fullTextScan = `${caption || ''} ${(tags || []).join(' ')} ${audienceText}`;
    const scan = detectForbiddenContactDetails(fullTextScan);
    if (scan.hasViolation) {
      throw ApiError.badRequest(
        `AI Safety Policy Violation: Phone numbers, WhatsApp numbers, QR codes, emails, websites, or social handles are strictly prohibited in reels/images. Detected: "${scan.snippet}" (${scan.detectedType}). Vendor flagged.`
      );
    }

    // Process base64 URLs in mediaUrls
    let processedMediaUrls = [];
    if (Array.isArray(mediaUrls)) {
      for (const url of mediaUrls) {
        const uploadedUrl = await uploadBase64IfPresent(url);
        processedMediaUrls.push(uploadedUrl);
      }
    }

    // Process base64 videoUrl
    let processedVideoUrl = await uploadBase64IfPresent(videoUrl);

    let finalVideoUrl = processedVideoUrl || (processedMediaUrls.length > 0 && processedMediaUrls[0]) || '';
    let finalThumbnailUrl = '';

    if (fileBuffer) {
      logger.info(`Initiating Reels upload to CDN for user: ${userId}`, { service: 'reels' });
      const uploadResult = await this.uploadVideoStream(fileBuffer);
      finalVideoUrl = uploadResult.secure_url;
      finalThumbnailUrl = uploadResult.eager?.[0]?.secure_url || uploadResult.secure_url.replace(/\.[^/.]+$/, '.jpg');
    }

    if (!finalThumbnailUrl && finalVideoUrl && finalVideoUrl.includes('cloudinary.com')) {
      finalThumbnailUrl = finalVideoUrl.replace(/\.[^/.]+$/, '.jpg');
    }

    if (!finalVideoUrl) {
      finalVideoUrl = 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4';
    }

    // Extract hashtags from caption or tags list
    let hashtagsList = [];
    if (caption) {
      const hashMatch = caption.match(/#\w+/g);
      if (hashMatch) {
        hashtagsList = hashMatch.map(h => h.slice(1).toLowerCase());
      }
    }
    if (tags) {
      const cleanTags = typeof tags === 'string' ? tags.split(',').map(t => t.trim().toLowerCase()) : (Array.isArray(tags) ? tags : []);
      hashtagsList = [...new Set([...hashtagsList, ...cleanTags])];
    }

    // Geo coordinates structure
    const location = {
      type: 'Point',
      coordinates: [0, 0],
    };
    if (lat && lng) {
      location.coordinates = [parseFloat(lng), parseFloat(lat)];
      location.address = address || '';
    }

    const reelStatus = status || (scheduledDate ? 'scheduled' : 'published');

    const reel = await reelRepository.createReel({
      creator: userId,
      videoUrl: finalVideoUrl,
      thumbnailUrl: finalThumbnailUrl || finalVideoUrl,
      caption: caption || 'Business Reel Promotion',
      hashtags: hashtagsList,
      location,
      postType: postType === 'services' ? 'service' : postType === 'products' ? 'product' : (postType || 'product'),
      category: category || 'General',
      subcategory: subcategory || 'General',
      postPurpose: postPurpose || classification || 'General Promotion',
      targetListing: req.body?.targetListing || null,
      promotionArea: targeting?.area || targeting?.distance || 'City Wide',
      targetAudience: Array.isArray(targeting?.audience) ? targeting.audience : [targeting?.audience || 'Anyone'],
      customAudience: targeting?.customAudience || req.body?.customAudience || '',
      status: reelStatus,
      mediaUrls: processedMediaUrls.length > 0 ? processedMediaUrls : [finalVideoUrl],
      mediaType: mediaType || (finalVideoUrl.endsWith('.mp4') ? 'video' : 'image'),
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      aiModeration: {
        passed: true,
        scannedAt: new Date(),
      },
      adminReview: {
        status: 'approved',
      }
    });

    // If Save to Service Gallery is checked and a target listing is provided, push media to listing
    if (req.body?.saveToServiceGallery && req.body?.targetListing) {
      try {
        const Listing = require('../models/Listing');
        const listing = await Listing.findById(req.body.targetListing);
        if (listing) {
          const urls = processedMediaUrls.length > 0 ? processedMediaUrls : [finalVideoUrl];
          for (const url of urls) {
            if (url.match(/\.(mp4|mov|webm|avi)(\?.*)?$/i)) {
              if (!listing.videos.includes(url)) listing.videos.push(url);
            } else {
              if (!listing.images.includes(url)) listing.images.push(url);
            }
          }
          await listing.save();
        }
      } catch (err) {
        logger.error('Failed to update service gallery:', err);
      }
    }

    // Deduct dynamic credits from vendor wallet
    try {
      const { AppSettings } = require('../models/Admin');
      let amount = 1;
      try {
        const rateSetting = await AppSettings.findOne({ key: 'credit_rates' }).lean();
        if (rateSetting && rateSetting.value && rateSetting.value.reelPost !== undefined) {
          amount = Number(rateSetting.value.reelPost);
        }
      } catch (err) {
        logger.error('Failed to fetch credit rates for reel publishing:', err);
      }

      const walletService = require('./wallet.service');
      await walletService.debit({
        userId,
        amount,
        transactionType: 'publish_post',
        reason: `${amount} Credits deducted for publishing a Reel / Image Post`,
        source: 'reel',
        meta: { reel_id: reel._id.toString() },
      });
    } catch (err) {
      logger.error('Error updating wallet credits for reel publish:', err);
    }

    await reelRepository.logReelAction({
      userId,
      action: 'LISTING_CREATE',
      entityId: reel._id,
      description: 'Uploaded new Reel',
      ip: req.ip,
      agent: req.headers['user-agent'],
    });

    logger.info(`Reel published successfully: ${reel._id}`, { service: 'reels' });
    return reel;
  }

  // ── Fetch Vendor Reels ────────────────────────────────────
  async getVendorReels(userId, page = 1, limit = 50) {
    const Reel = require('../models/Reel');
    const skip = (page - 1) * limit;

    const [reels, total] = await Promise.all([
      Reel.find({ isDeleted: { $ne: true } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Reel.countDocuments({ isDeleted: { $ne: true } }),
    ]);

    return { reels, total };
  }

  // ── Fetch Feed (Recommendation Engine) ──────────────────
  async getFeed({ currentUserId, viewerId, creatorId, hashtags, lat, lng, distance, page, limit }) {
    // Use recommendation engine for authenticated users with no specific filters
    if (currentUserId && !creatorId && (!hashtags || hashtags.length === 0)) {
      try {
        const recommendationService = require('./recommendation.service');
        return await recommendationService.getRecommendedFeed(currentUserId, page, limit);
      } catch (err) {
        logger.warn('Recommendation engine fallback to basic feed', { error: err.message });
      }
    }

    // For filtered queries or unauthenticated users, use basic feed
    if (!currentUserId && !creatorId && (!hashtags || hashtags.length === 0)) {
      try {
        const recommendationService = require('./recommendation.service');
        return await recommendationService.getGenericFeed(viewerId, page, limit);
      } catch (err) {
        logger.warn('Generic recommendation fallback to basic feed', { error: err.message });
      }
    }

    // Fallback: basic repository feed (for filtered queries)
    const coordinates = lat && lng ? [parseFloat(lng), parseFloat(lat)] : null;
    return reelRepository.getReelsFeed({
      currentUserId,
      creatorId,
      hashtags,
      coordinates,
      distanceKm: distance || 10,
      page,
      limit,
    });
  }

  // ── Increment View + Track for Recommendations ─────────
  async viewReel(id, userId, watchDuration) {
    const viewerId = userId ? userId.toString() : 'anonymous';

    // YouTube/Instagram style: view must watch for at least 3 seconds
    const MIN_WATCH_TIME_SECONDS = 3;
    const isWatchTimeValid = (watchDuration || 0) >= MIN_WATCH_TIME_SECONDS;

    // View cooldown/deduplication window: 15 minutes
    const RECENT_VIEW_WINDOW_MS = 15 * 60 * 1000;

    const ReelView = require('../models/ReelView');
    const existingView = await ReelView.findOne({ user_id: viewerId, reel_id: id });

    let shouldIncrementView = isWatchTimeValid;
    if (existingView) {
      const timeSinceLastView = Date.now() - new Date(existingView.viewed_at).getTime();
      if (timeSinceLastView < RECENT_VIEW_WINDOW_MS) {
        shouldIncrementView = false;
      }
    }

    let updated;
    if (shouldIncrementView) {
      updated = await reelRepository.incrementViews(id);
    } else {
      updated = await reelRepository.findReelById(id);
    }

    if (!updated) {
      throw ApiError.notFound('Reel not found.');
    }

    // Track view for recommendation engine (even if view count isn't incremented, we track so it can be filtered out)
    try {
      const recommendationService = require('./recommendation.service');
      await recommendationService.trackView(viewerId, id, watchDuration || 0);
    } catch (err) {
      // Non-critical — don't break the main flow
    }

    return updated;
  }

  // ── Like / Unlike ───────────────────────────────────────
  async toggleLike(reelId, userId, req) {
    const reel = await reelRepository.findReelById(reelId);
    if (!reel) {
      throw ApiError.notFound('Reel not found.');
    }

    const result = await reelRepository.likeReel(reelId, userId);
    
    await reelRepository.logReelAction({
      userId,
      action: 'LISTING_UPDATE',
      entityId: reelId,
      description: `${result.message} Reel`,
      ip: req.ip,
      agent: req.headers['user-agent'],
    });

    return result;
  }

  // ── Comment Operations ──────────────────────────────────
  async addComment(reelId, userId, content, req) {
    const reel = await reelRepository.findReelById(reelId);
    if (!reel) {
      throw ApiError.notFound('Reel not found.');
    }

    const comment = await reelRepository.addComment(reelId, userId, content);

    await reelRepository.logReelAction({
      userId,
      action: 'LISTING_UPDATE',
      entityId: reelId,
      description: 'Added comment to Reel',
      ip: req.ip,
      agent: req.headers['user-agent'],
    });

    return comment;
  }

  async getComments(reelId, page, limit) {
    return reelRepository.getComments(reelId, { page, limit });
  }

  async deleteComment(commentId, userId, req) {
    const deleted = await reelRepository.deleteComment(commentId, userId);
    if (!deleted) {
      throw ApiError.forbidden('Comment not found or you are not authorized to delete it.');
    }

    await reelRepository.logReelAction({
      userId,
      action: 'LISTING_UPDATE',
      entityId: deleted.reelId,
      description: 'Deleted comment from Reel',
      ip: req.ip,
      agent: req.headers['user-agent'],
    });

    return { message: 'Comment deleted successfully.' };
  }

  // ── Delete Reel ─────────────────────────────────────────
  async deleteReel(id, userId, req) {
    const reel = await reelRepository.findReelById(id);
    if (!reel) {
      throw ApiError.notFound('Reel not found.');
    }

    const isOwner = reel.creator?._id?.toString() === userId.toString() || reel.creator?.toString() === userId.toString();
    const isAdmin = req?.user?.roles?.includes('admin') || req?.user?.role === 'admin' || req?.user?.activeRole === 'admin';

    if (!isOwner && !isAdmin) {
      throw ApiError.forbidden('You are not authorized to delete this reel.');
    }

    const deleted = await reelRepository.softDeleteReel(id, reel.creator?._id || userId);
    if (!deleted) {
      throw ApiError.internal('Failed to delete reel.');
    }

    await reelRepository.logReelAction({
      userId,
      action: 'LISTING_DELETE',
      entityId: id,
      description: 'Deleted Reel',
      ip: req?.ip || '127.0.0.1',
      agent: req?.headers?.['user-agent'] || 'unknown',
    });

    return { message: 'Reel deleted successfully.' };
  }
}

module.exports = new ReelService();
