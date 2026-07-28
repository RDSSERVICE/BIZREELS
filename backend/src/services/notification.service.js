const notificationRepository = require('../repositories/notificationRepository');
const ApiError = require('../utils/ApiError');
const { emitToUser } = require('../sockets');

/**
 * NotificationService
 * Handles core backend methods for reading, listing, and cleaning alerts.
 */
class NotificationService {
  async getNotifications(userId) {
    return notificationRepository.getNotificationsForUser(userId);
  }

  async markAllAsRead(userId) {
    return notificationRepository.markAllAsRead(userId);
  }

  async markAsRead(notificationId, userId) {
    const updated = await notificationRepository.markAsRead(notificationId, userId);
    if (!updated) {
      throw ApiError.notFound('Notification alert not found.');
    }
    return updated;
  }

  async deleteNotification(notificationId, userId) {
    const deleted = await notificationRepository.deleteNotification(notificationId, userId);
    if (!deleted) {
      throw ApiError.notFound('Notification alert not found.');
    }
    return { message: 'Alert removed successfully.' };
  }

  async create(userId, type, title, body = null, data = {}, actionUrl = null) {
    let savedNotif = null;
    try {
      savedNotif = await notificationRepository.createNotification({
        recipient: userId,
        type: type || 'system',
        title: title || 'New Alert',
        body: body || title || '',
        message: body || title || '',
        data: data || {},
        actionUrl: actionUrl || null,
      });
    } catch (err) {
      console.error('Error saving notification in DB:', err.message);
    }

    emitToUser(userId.toString(), 'notification:new', {
      _id: savedNotif?._id ? savedNotif._id.toString() : Date.now().toString(),
      userId,
      type,
      title,
      body: body || title || '',
      message: body || title || '',
      data,
      actionUrl,
      createdAt: new Date().toISOString(),
    });

    return savedNotif || { userId, type, title, body, data, actionUrl };
  }

  async listMine(userId, isRead = null, cursor = null, limit = 30) {
    const listLimit = Math.max(1, Math.min(100, parseInt(limit || 30, 10)));
    const notifs = await notificationRepository.getNotificationsForUser(userId, {
      isRead,
      cursor,
      limit: listLimit + 1
    });

    const hasMore = notifs.length > listLimit;
    const items = notifs.slice(0, listLimit);
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]._id.toString() : null;

    return {
      items: items.map(n => ({ ...n, id: n._id.toString() })),
      next_cursor: nextCursor,
      has_more: hasMore,
    };
  }

  async unreadCount(userId) {
    return notificationRepository.unreadCount(userId);
  }

  async markRead(nid, userId) {
    return this.markAsRead(nid, userId);
  }

  async markAllRead(userId) {
    return this.markAllAsRead(userId);
  }

  async dismiss(nid, userId) {
    return this.deleteNotification(nid, userId);
  }
}

module.exports = new NotificationService();
