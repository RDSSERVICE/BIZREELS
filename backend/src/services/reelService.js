const cloudinary = require('../config/cloudinary');
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

  // ── Publish Reel ────────────────────────────────────────
  async publishReel({
    userId, fileBuffer, caption, tags, lat, lng, address,
    postType, category, subcategory, classification, postPurpose,
    targeting, videoUrl, mediaUrls, mediaType, status, scheduledDate
  }, req) {
    // 1. AI Safety Contact Details Check
    const audienceText = typeof targeting?.audience === 'string' ? targeting.audience : Array.isArray(targeting?.audience) ? targeting.audience.join(' ') : '';
    const fullTextScan = `${caption || ''} ${(tags || []).join(' ')} ${audienceText}`;
    const scan = detectForbiddenContactDetails(fullTextScan);
    if (scan.hasViolation) {
      throw ApiError.badRequest(
        `AI Safety Policy Violation: Phone numbers, WhatsApp numbers, QR codes, emails, websites, or social handles are strictly prohibited in reels/images. Detected: "${scan.snippet}" (${scan.detectedType}). Vendor flagged.`
      );
    }

    let finalVideoUrl = videoUrl || (Array.isArray(mediaUrls) && mediaUrls[0]) || '';
    let finalThumbnailUrl = '';

    if (fileBuffer) {
      logger.info(`Initiating Reels upload to CDN for user: ${userId}`, { service: 'reels' });
      const uploadResult = await this.uploadVideoStream(fileBuffer);
      finalVideoUrl = uploadResult.secure_url;
      finalThumbnailUrl = uploadResult.eager?.[0]?.secure_url || uploadResult.secure_url.replace(/\.[^/.]+$/, '.jpg');
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
      mediaUrls: Array.isArray(mediaUrls) && mediaUrls.length > 0 ? mediaUrls : [finalVideoUrl],
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
          const urls = Array.isArray(mediaUrls) && mediaUrls.length > 0 ? mediaUrls : [finalVideoUrl];
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

    // Deduct 1 credit from vendor wallet
    try {
      const { Wallet, WalletTransaction } = require('../models/Phase4');
      const wallet = await Wallet.findOne({ user_id: userId.toString() });
      if (wallet) {
        wallet.credits = Math.max(0, wallet.credits - 1);
        wallet.lifetime_spent_credits = (wallet.lifetime_spent_credits || 0) + 1;
        await wallet.save();
        await WalletTransaction.create({
          wallet_id: wallet._id.toString(),
          user_id: userId.toString(),
          type: 'debit',
          bucket: 'credits',
          amount: 1,
          balance_after: wallet.credits,
          reason: '1 Reel / Image Post published',
          ref_type: 'reel',
          ref_id: reel._id.toString(),
        });
      }
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
  async getVendorReels(userId) {
    const Reel = require('../models/Reel');
    return Reel.find({ creator: userId, isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .lean();
  }

  // ── Fetch Feed ──────────────────────────────────────────
  async getFeed({ currentUserId, creatorId, hashtags, lat, lng, distance, page, limit }) {
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

  // ── Increment View ──────────────────────────────────────
  async viewReel(id) {
    const updated = await reelRepository.incrementViews(id);
    if (!updated) {
      throw ApiError.notFound('Reel not found.');
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
