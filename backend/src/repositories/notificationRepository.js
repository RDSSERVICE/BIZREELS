const mongoose = require('mongoose');
const Notification = require('../models/Notification');

/**
 * NotificationRepository
 * Access layer for in-app client alerts.
 */
class NotificationRepository {
  async getNotificationsForUser(userId, { isRead = null, cursor = null, limit = 30 } = {}) {
    const query = { recipient: userId.toString() };
    
    if (isRead !== null) {
      query.isRead = isRead;
    }
    
    if (cursor) {
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(cursor)) {
        query._id = { $lt: new mongoose.Types.ObjectId(cursor) };
      }
    }

    return Notification.find(query)
      .sort({ _id: -1 })
      .limit(limit)
      .lean();
  }

  async unreadCount(userId) {
    return Notification.countDocuments({
      recipient: userId.toString(),
      isRead: false
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
    return Notification.updateMany(
      { recipient: userId.toString(), isRead: false },
      { isRead: true }
    );
  }

  async markAsRead(notificationId, userId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId.toString() },
      { isRead: true },
      { returnDocument: 'after' }
    );
  }

  async deleteNotification(notificationId, userId) {
    return Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId.toString()
    });
  }
}

module.exports = new NotificationRepository();
