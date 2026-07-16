const liveRepository = require('../repositories/liveRepository');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { emitToConversation } = require('../sockets');

/**
 * LiveService
 * Manages streaming directories and comment tickers relays.
 */
class LiveService {
  async createStream({ hostId, title, description }) {
    logger.info(`Starting live broadcast for host: ${hostId}`, { service: 'live' });
    return liveRepository.createStream({
      host: hostId,
      title,
      description,
    });
  }

  async getActiveStreams() {
    return liveRepository.getActiveStreams();
  }

  async endStream(id, hostId) {
    const stream = await liveRepository.findStreamById(id);
    if (!stream) {
      throw ApiError.notFound('Live stream not found.');
    }

    if (stream.host._id.toString() !== hostId.toString()) {
      throw ApiError.forbidden('Only host can end the stream.');
    }

    logger.info(`Ending live broadcast for stream: ${id}`, { service: 'live' });
    const ended = await liveRepository.endStream(id);
    emitToConversation(id.toString(), 'stream_ended', { streamId: id });
    return ended;
  }

  async joinStream(id) {
    const updated = await liveRepository.incrementViewers(id, 1);
    if (!updated) throw ApiError.notFound('Live stream not found.');
    emitToConversation(id.toString(), 'viewer_change', { viewersCount: updated.viewersCount });
    return updated;
  }

  async leaveStream(id) {
    const updated = await liveRepository.incrementViewers(id, -1);
    if (updated) {
      emitToConversation(id.toString(), 'viewer_change', { viewersCount: Math.max(0, updated.viewersCount) });
    }
    return updated;
  }

  async incrementLikes(id) {
    const updated = await liveRepository.incrementLikes(id, 1);
    if (updated) {
      emitToConversation(id.toString(), 'likes_change', { likesCount: updated.likesCount });
    }
    return updated;
  }

  async sendStreamComment(id, user, text) {
    emitToConversation(id.toString(), 'stream_message', {
      user: {
        _id: user._id,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      text,
      createdAt: new Date(),
    });
    return { success: true };
  }
}

module.exports = new LiveService();
