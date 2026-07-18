const notificationRepository = require('../repositories/notificationRepository');
const ApiError = require('../utils/ApiError');

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
}

module.exports = new NotificationService();
