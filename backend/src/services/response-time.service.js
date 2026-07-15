const mongoose = require('mongoose');
const User = require('../models/User');
const { ChatMessage } = require('../models/Chat');
const { ResponseEvent } = require('../models/Misc');
const logger = require('../utils/logger');

const RESPONSE_WINDOW_HOURS = 24;

const maybeTrackResponse = async ({ threadId, senderId, receiverId }) => {
  try {
    // Find the latest messages by this sender in the thread to establish a boundary
    const myPriorIds = await ChatMessage.find({
      thread_id: threadId,
      sender_id: senderId,
      is_deleted: { $ne: true },
    }).sort({ _id: -1 }).limit(2);

    const boundaryId = myPriorIds.length > 1 ? myPriorIds[1]._id : null;

    const q = {
      thread_id: threadId,
      sender_id: receiverId,
      is_deleted: { $ne: true },
    };
    if (boundaryId) {
      q._id = { $gt: boundaryId };
    }

    const firstIncoming = await ChatMessage.find(q).sort({ _id: 1 }).limit(1);
    if (firstIncoming.length === 0) {
      return; // No incoming waiting for reply
    }

    const arrivedAt = new Date(firstIncoming[0].created_at || firstIncoming[0].createdAt);
    const replyAt = new Date();
    const deltaSeconds = Math.max(0, Math.floor((replyAt - arrivedAt) / 1000));
    const markerId = firstIncoming[0]._id.toString();

    // Check duplicate
    const already = await ResponseEvent.findOne({
      sender_id: senderId,
      for_message_id: markerId,
    });
    if (already) {
      return;
    }

    await ResponseEvent.create({
      sender_id: senderId,
      receiver_id: receiverId,
      thread_id: threadId,
      for_message_id: markerId,
      response_time_seconds: deltaSeconds,
      within_24h: deltaSeconds <= RESPONSE_WINDOW_HOURS * 3600,
    });

    // Recompute rolling stats for sender
    const agg = await ResponseEvent.aggregate([
      { $match: { sender_id: senderId } },
      {
        $group: {
          _id: null,
          n: { $sum: 1 },
          avg: { $avg: '$response_time_seconds' },
          within: {
            $sum: {
              $cond: [{ $eq: ['$within_24h', true] }, 1, 0],
            },
          },
        },
      },
    ]);

    if (agg.length > 0) {
      const row = agg[0];
      const n = parseInt(row.n || 0, 10);
      const avg = row.avg ? Math.round(row.avg) : 0;
      const rate = n ? Math.round((row.within / n) * 1000) / 1000 : 0.0;

      await User.updateOne(
        { _id: senderId },
        {
          $set: {
            avg_response_time_seconds: avg,
            chat_response_rate: rate,
            total_conversations_responded: n,
            updated_at: new Date().toISOString(),
          },
        }
      );
    }
  } catch (err) {
    logger.debug(`response-time tracking failed (non-fatal): ${err.message}`);
  }
};

const humanResponseTime = (seconds) => {
  if (!seconds || seconds <= 0) {
    return 'New responder';
  }
  if (seconds < 60) {
    return 'Typically responds instantly';
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `Typically responds in ~${minutes}m`;
  }
  const hours = Math.round((minutes / 60) * 10) / 10;
  if (hours < 24) {
    return hours === Math.floor(hours) ? `Typically responds in ~${Math.floor(hours)}h` : `Typically responds in ~${hours}h`;
  }
  const days = Math.round((hours / 24) * 10) / 10;
  return `Typically responds in ~${days}d`;
};

module.exports = {
  maybeTrackResponse,
  humanResponseTime,
};
