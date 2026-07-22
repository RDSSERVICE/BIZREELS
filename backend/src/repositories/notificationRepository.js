const mongoose = require('mongoose');
const Notification = require('../models/Notification');

/**
 * NotificationRepository
 * Access layer for in-app client alerts.
 */
class NotificationRepository {
  _getUserConditions(userId) {
    const uIdStr = userId.toString();
    const conditions = [{ recipient: userId }, { recipient: uIdStr }, { user_id: uIdStr }];
    if (mongoose.Types.ObjectId.isValid(uIdStr)) {
      const objId = new mongoose.Types.ObjectId(uIdStr);
      conditions.push({ recipient: objId }, { user_id: objId });
    }
    return conditions;
  }

  async getNotificationsForUser(userId) {
    return Notification.find({
      $or: this._getUserConditions(userId)
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
  }

  async unreadCount(userId) {
    return Notification.countDocuments({
      $or: this._getUserConditions(userId),
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
    return Notification.updateMany(
      { $or: this._getUserConditions(userId) },
      { isRead: true, is_read: true }
    );
  }

  async markAsRead(notificationId, userId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, $or: this._getUserConditions(userId) },
      { isRead: true, is_read: true },
      { new: true }
    );
  }

  async deleteNotification(notificationId, userId) {
    return Notification.findOneAndDelete({
      _id: notificationId,
      $or: this._getUserConditions(userId)
    });
  }
}

module.exports = new NotificationRepository();
