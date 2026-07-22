const Notification = require('../models/Notification');

/**
 * NotificationRepository
 * Access layer for in-app client alerts.
 */
class NotificationRepository {
  async getNotificationsForUser(userId) {
    const uIdStr = userId.toString();
    return Notification.find({
      $or: [{ recipient: userId }, { recipient: uIdStr }, { user_id: uIdStr }]
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
  }

  async unreadCount(userId) {
    const uIdStr = userId.toString();
    return Notification.countDocuments({
      $or: [{ recipient: userId }, { recipient: uIdStr }, { user_id: uIdStr }],
      $and: [{ isRead: { $ne: true } }, { is_read: { $ne: true } }]
    });
  }

  async createNotification({ recipient, sender, type, title, body, message, data, actionUrl }) {
    return Notification.create({
      recipient: recipient.toString(),
      sender: sender ? sender.toString() : null,
      type: type || 'system',
      title,
      body: body || message || '',
      message: message || body || '',
      data: data || {},
      actionUrl: actionUrl || null,
      isRead: false,
    });
  }

  async markAllAsRead(userId) {
    const uIdStr = userId.toString();
    return Notification.updateMany(
      { $or: [{ recipient: userId }, { recipient: uIdStr }, { user_id: uIdStr }] },
      { isRead: true, is_read: true }
    );
  }

  async markAsRead(notificationId, userId) {
    const uIdStr = userId.toString();
    return Notification.findOneAndUpdate(
      { _id: notificationId, $or: [{ recipient: userId }, { recipient: uIdStr }, { user_id: uIdStr }] },
      { isRead: true, is_read: true },
      { new: true }
    );
  }

  async deleteNotification(notificationId, userId) {
    const uIdStr = userId.toString();
    return Notification.findOneAndDelete({
      _id: notificationId,
      $or: [{ recipient: userId }, { recipient: uIdStr }, { user_id: uIdStr }]
    });
  }
}

module.exports = new NotificationRepository();
