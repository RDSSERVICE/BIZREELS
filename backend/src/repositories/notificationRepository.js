const Notification = require('../models/Notification');

/**
 * NotificationRepository
 * Access layer for in-app client alerts.
 */
class NotificationRepository {
  async getNotificationsForUser(userId) {
    return Notification.find({ recipient: userId })
      .populate('sender', 'name avatarUrl activeRole')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
  }

  async markAllAsRead(userId) {
    return Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });
  }

  async markAsRead(notificationId, userId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true },
      { returnDocument: 'after' }
    );
  }

  async deleteNotification(notificationId, userId) {
    return Notification.findOneAndDelete({ _id: notificationId, recipient: userId });
  }
}

module.exports = new NotificationRepository();
