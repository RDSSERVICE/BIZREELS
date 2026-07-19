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
    emitToUser(userId, 'notification:new', { userId, type, title, body, data, actionUrl });
    return { userId, type, title, body, data, actionUrl };
  }

  async listMine(userId, isRead = null, cursor = null, limit = 30) {
    const notifs = await this.getNotifications(userId);
    return { items: notifs || [], next_cursor: null, has_more: false };
  }

  async unreadCount(userId) {
    return 0;
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
