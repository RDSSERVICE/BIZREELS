const LiveStream = require('../models/LiveStream');

/**
 * LiveRepository
 * Access layer for live broadcasts listings.
 */
class LiveRepository {
  async createStream(data) {
    return LiveStream.create(data);
  }

  async findStreamById(id) {
    return LiveStream.findById(id).populate('host', 'name avatarUrl activeRole');
  }

  async getActiveStreams() {
    return LiveStream.find({ status: 'live' })
      .populate('host', 'name avatarUrl activeRole')
      .sort({ viewersCount: -1, createdAt: -1 })
      .lean();
  }

  async endStream(id) {
    return LiveStream.findByIdAndUpdate(id, { status: 'ended' }, { new: true });
  }

  async incrementViewers(id, amount) {
    return LiveStream.findByIdAndUpdate(
      id,
      { $inc: { viewersCount: amount } },
      { new: true }
    );
  }

  async incrementLikes(id, amount) {
    return LiveStream.findByIdAndUpdate(
      id,
      { $inc: { likesCount: amount } },
      { new: true }
    );
  }
}

module.exports = new LiveRepository();
