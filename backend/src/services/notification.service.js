const { Notification } = require('../models/Phase4');
const fcmService = require('./fcm.service');

const serializeNotification = (doc) => {
  if (!doc) return null;
  const d = doc.toObject ? doc.toObject() : { ...doc };
  if (d._id) {
    d.id = d._id.toString();
    delete d._id;
  }
  delete d.is_deleted;
  delete d.__v;
  return d;
};

const create = async (userId, type, title, body = null, data = {}, actionUrl = null) => {
  const notif = await Notification.create({
    user_id: userId,
    type,
    title,
    body,
    data,
    action_url: actionUrl,
  });

  const serialized = serializeNotification(notif);

  // Emit socket event
  try {
    const socketService = require('./socket.service');
    socketService.emitToUser(userId, 'notification:new', serialized);
  } catch {}

  // FCM Push
  try {
    await fcmService.sendPush(userId, title, body || '', data);
  } catch {}

  return serialized;
};

const listMine = async (userId, isRead = null, cursor = null, limit = 30) => {
  const q = { user_id: userId, is_deleted: { $ne: true } };
  if (isRead !== null) {
    q.is_read = isRead;
  }
  if (cursor) {
    q._id = { $lt: cursor };
  }

  const docs = await Notification.find(q).sort({ _id: -1 }).limit(limit + 1);
  const hasMore = docs.length > limit;
  const sliced = docs.slice(0, limit);
  const items = sliced.map(serializeNotification);

  return {
    items,
    next_cursor: hasMore && items.length > 0 ? items[items.length - 1].id : null,
    has_more: hasMore,
  };
};

const unreadCount = async (userId) => {
  return await Notification.countDocuments({ user_id: userId, is_read: false, is_deleted: { $ne: true } });
};

const markRead = async (nid, userId) => {
  const now = new Date().toISOString();
  await Notification.updateOne(
    { _id: nid, user_id: userId },
    { $set: { is_read: true, read_at: now } }
  );
};

const markAllRead = async (userId) => {
  const now = new Date().toISOString();
  await Notification.updateMany(
    { user_id: userId, is_read: false },
    { $set: { is_read: true, read_at: now } }
  );
};

const dismiss = async (nid, userId) => {
  await Notification.updateOne(
    { _id: nid, user_id: userId },
    { $set: { is_deleted: true } }
  );
};

module.exports = {
  create,
  listMine,
  unreadCount,
  markRead,
  markAllRead,
  dismiss,
};
