const cloudinary = require('../config/cloudinary');
const reelRepository = require('../repositories/reelRepository');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

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
  async publishReel({ userId, fileBuffer, caption, tags, lat, lng, address }, req) {
    if (!fileBuffer) {
      throw ApiError.badRequest('No video file provided.');
    }

    try {
      logger.info(`Initiating Reels upload to CDN for user: ${userId}`, { service: 'reels' });
      const uploadResult = await this.uploadVideoStream(fileBuffer);

      // Extract hashtags from caption or tags list
      let hashtagsList = [];
      if (caption) {
        const hashMatch = caption.match(/#\w+/g);
        if (hashMatch) {
          hashtagsList = hashMatch.map(h => h.slice(1).toLowerCase());
        }
      }
      if (tags) {
        const cleanTags = tags.split(',').map(t => t.trim().toLowerCase());
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

      const reel = await reelRepository.createReel({
        creator: userId,
        videoUrl: uploadResult.secure_url,
        thumbnailUrl: uploadResult.eager?.[0]?.secure_url || uploadResult.secure_url.replace(/\.[^/.]+$/, '.jpg'),
        caption,
        hashtags: hashtagsList,
        location,
      });

      await reelRepository.logReelAction({
        userId,
        action: 'LISTING_CREATE', // audit maps listing creation
        entityId: reel._id,
        description: 'Uploaded new Reel',
        ip: req.ip,
        agent: req.headers['user-agent'],
      });

      logger.info(`Reel published successfully: ${reel._id}`, { service: 'reels' });
      return reel;
    } catch (error) {
      logger.error('Failed to publish reel:', { error: error.message, service: 'reels' });
      throw ApiError.internal('Failed to process video and publish Reel. Please check credentials or formats.');
    }
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
    const deleted = await reelRepository.softDeleteReel(id, userId);
    if (!deleted) {
      throw ApiError.forbidden('Reel not found or you are not authorized to delete it.');
    }

    await reelRepository.logReelAction({
      userId,
      action: 'LISTING_DELETE',
      entityId: id,
      description: 'Deleted Reel',
      ip: req.ip,
      agent: req.headers['user-agent'],
    });

    return { message: 'Reel deleted successfully.' };
  }
}

module.exports = new ReelService();
