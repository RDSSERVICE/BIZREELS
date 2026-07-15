const { ChatThread, ChatMessage } = require('../models/Chat');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const serializeThread = (d) => {
  if (!d) return null;
  const out = d.toObject ? d.toObject() : { ...d };
  if (out._id) {
    out.id = out._id.toString();
    delete out._id;
  }
  if (out.context_id) {
    out.context_id = out.context_id.toString();
  }
  delete out.__v;
  return out;
};

const serializeMessage = (d) => {
  if (!d) return null;
  const out = d.toObject ? d.toObject() : { ...d };
  if (out._id) {
    out.id = out._id.toString();
    delete out._id;
  }
  const idFields = ['thread_id', 'sender_id', 'receiver_id', 'shared_listing_id'];
  for (const k of idFields) {
    if (out[k]) {
      out[k] = out[k].toString();
    }
  }
  delete out.is_deleted;
  delete out.__v;
  return out;
};

const getOrCreateThread = async (userA, userB, threadType, contextId = null) => {
  if (userA === userB) {
    throw ApiError.badRequest('Cannot chat with yourself');
  }
  if (!['listing', 'requirement', 'direct'].includes(threadType)) {
    throw ApiError.badRequest('Invalid thread_type');
  }
  if (threadType !== 'direct' && !contextId) {
    throw ApiError.badRequest('context_id required for typed threads');
  }

  const participants = [userA, userB].sort();
  const q = { participants, thread_type: threadType, context_id: contextId };
  let thread = await ChatThread.findOne(q);
  if (thread) {
    return serializeThread(thread);
  }

  thread = await ChatThread.create({
    participants,
    thread_type: threadType,
    context_id: contextId,
    unread_count: { [userA]: 0, [userB]: 0 },
  });

  // Emit chat_start event (analytics)
  if (threadType === 'listing' && contextId) {
    try {
      const eventService = require('./event.service');
      await eventService.emit({
        listing_id: contextId,
        vendor_id: null,
        event_type: 'chat_start',
        user_id: userA,
        meta: { thread_id: thread._id.toString() },
      });
    } catch {}
  }

  return serializeThread(thread);
};

const listMyThreads = async (userId) => {
  const docs = await ChatThread.find({ participants: userId }).sort({ updated_at: -1 }).limit(100);
  const peerIds = new Set();
  for (const d of docs) {
    for (const p of d.participants) {
      if (p !== userId) {
        peerIds.add(p);
      }
    }
  }

  const users = peerIds.size > 0 ? await User.find({ _id: { $in: Array.from(peerIds) } }) : [];
  const umap = {};
  for (const u of users) {
    umap[u._id.toString()] = u;
  }

  const out = [];
  for (const d of docs) {
    const item = serializeThread(d);
    const peerId = d.participants.find(p => p !== userId) || null;
    const peer = umap[peerId] || {};
    item.peer = {
      id: peerId,
      name: peer.name || null,
      profile_pic: peer.profile_pic || null,
    };
    item.my_unread = (item.unread_count || {})[userId] || 0;
    out.push(item);
  }
  return out;
};

const getThread = async (threadId, userId) => {
  const doc = await ChatThread.findById(threadId);
  if (!doc || !doc.participants.includes(userId)) {
    throw ApiError.notFound('Thread not found');
  }
  return serializeThread(doc);
};

const listMessages = async (threadId, userId, cursor = null, limit = 50) => {
  await getThread(threadId, userId);
  const q = { thread_id: threadId, is_deleted: { $ne: true } };
  if (cursor) {
    q._id = { $lt: cursor };
  }

  const docs = await ChatMessage.find(q).sort({ _id: -1 }).limit(limit + 1);
  const hasMore = docs.length > limit;
  const sliced = docs.slice(0, limit);

  return {
    items: sliced.map(serializeMessage),
    next_cursor: hasMore && sliced.length > 0 ? sliced[sliced.length - 1]._id.toString() : null,
    has_more: hasMore,
  };
};

const sendMessage = async (threadId, senderId, body) => {
  const thread = await ChatThread.findById(threadId);
  if (!thread || !thread.participants.includes(senderId)) {
    throw ApiError.notFound('Thread not found');
  }
  const receiverId = thread.participants.find(p => p !== senderId) || null;
  if (!receiverId) {
    throw ApiError.badRequest('No receiver in thread');
  }

  const nowIso = new Date().toISOString();
  const msg = await ChatMessage.create({
    thread_id: threadId,
    sender_id: senderId,
    receiver_id: receiverId,
    type: body.type || 'text',
    text: body.text || null,
    media: body.media || null,
    shared_listing_id: body.shared_listing_id || null,
    shared_location: body.shared_location || null,
    quote: body.quote || null,
  });

  // Update thread meta
  const previewMap = {
    image: '📷 Photo',
    video: '🎥 Video',
    listing_card: '🛍️ Listing',
    location: '📍 Location',
    quote: '💰 Offer',
  };
  const preview = msg.text || previewMap[msg.type] || 'New message';

  const unread = thread.unread_count || {};
  unread[receiverId] = parseInt(unread[receiverId] || 0, 10) + 1;

  await ChatThread.updateOne(
    { _id: threadId },
    {
      $set: {
        last_message: {
          text: typeof preview === 'string' ? preview : 'New message',
          sender_id: senderId,
          created_at: nowIso,
          type: msg.type,
        },
        unread_count: unread,
        updated_at: nowIso,
      },
    }
  );

  const result = serializeMessage(msg);

  // Emit socket event (best effort)
  try {
    const socketService = require('./socket.service');
    socketService.emitToUser(receiverId, 'message:new', result);
    socketService.emitToUser(senderId, 'message:new', result);
  } catch {}

  // Response-time tracking (fire-and-forget)
  try {
    const responseTimeService = require('./response-time.service');
    responseTimeService.maybeTrackResponse({
      threadId,
      senderId,
      receiverId,
    }).catch(err => logger.error('response time track error:', err.message));
  } catch {}

  return result;
};

const markRead = async (threadId, userId) => {
  const thread = await ChatThread.findById(threadId);
  if (!thread || !thread.participants.includes(userId)) {
    throw ApiError.notFound('Thread not found');
  }
  const nowIso = new Date().toISOString();
  await ChatMessage.updateMany(
    { thread_id: threadId, receiver_id: userId, read_at: null },
    { $set: { read_at: nowIso } }
  );

  const unread = thread.unread_count || {};
  unread[userId] = 0;
  await ChatThread.updateOne({ _id: threadId }, { $set: { unread_count: unread } });

  // Emit read event
  try {
    const socketService = require('./socket.service');
    const peerId = thread.participants.find(p => p !== userId) || null;
    if (peerId) {
      socketService.emitToUser(peerId, 'message:read', {
        thread_id: threadId,
        reader_id: userId,
        read_at: nowIso,
      });
    }
  } catch {}

  return { ok: true };
};

const toggleArchive = async (threadId, userId) => {
  const thread = await ChatThread.findById(threadId);
  if (!thread || !thread.participants.includes(userId)) {
    throw ApiError.notFound('Thread not found');
  }
  const arch = thread.is_archived_by || {};
  arch[userId] = !arch[userId];
  await ChatThread.updateOne({ _id: threadId }, { $set: { is_archived_by: arch } });
  return { archived: arch[userId] };
};

const unreadTotal = async (userId) => {
  const threads = await ChatThread.find({ participants: userId }, { unread_count: 1 });
  let total = 0;
  for (const t of threads) {
    total += parseInt((t.unread_count || {})[userId] || 0, 10);
  }
  return total;
};

module.exports = {
  getOrCreateThread,
  listMyThreads,
  getThread,
  listMessages,
  sendMessage,
  markRead,
  toggleArchive,
  unreadTotal,
};
