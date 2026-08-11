const mongoose = require('mongoose');
const Notification = require('../models/Notification');

/**
 * NotificationRepository
 * Access layer for in-app client alerts.
 * Uses `recipientRole` as primary filter; falls back to actionUrl regex for legacy data.
 */
class NotificationRepository {
  async getNotificationsForUser(userId, { isRead = null, cursor = null, limit = 30, role = null } = {}) {
    const query = { recipient: userId.toString() };
    
    if (isRead !== null) {
      query.isRead = isRead;
    }
    
    if (cursor) {
      if (mongoose.Types.ObjectId.isValid(cursor)) {
        query._id = { $lt: new mongoose.Types.ObjectId(cursor) };
      }
    }

    if (role) {
      // Primary: match recipientRole field directly
      // Fallback: for legacy notifications without recipientRole, match by actionUrl pattern
      if (role === 'customer') {
        query.$or = [
          { recipientRole: 'customer' },
          // Legacy: no recipientRole set AND actionUrl doesn't belong to vendor/creator/admin
          {
            recipientRole: { $in: [null, undefined] },
            $and: [
              { actionUrl: { $not: { $regex: '^/(vendor|creator|admin)', $options: 'i' } } },
            ]
          },
        ];
      } else {
        // vendor, creator, admin
        query.$or = [
          { recipientRole: role },
          // Legacy: no recipientRole set AND actionUrl starts with /role
          {
            recipientRole: { $in: [null, undefined] },
            actionUrl: { $regex: `^/${role}`, $options: 'i' },
          },
        ];
      }
    }

    return Notification.find(query)
      .sort({ _id: -1 })
      .limit(limit)
      .lean();
  }

  async unreadCount(userId, role = null) {
    const query = {
      recipient: userId.toString(),
      isRead: false
    };

    if (role) {
      if (role === 'customer') {
        query.$or = [
          { recipientRole: 'customer' },
          {
            recipientRole: { $in: [null, undefined] },
            $and: [
              { actionUrl: { $not: { $regex: '^/(vendor|creator|admin)', $options: 'i' } } },
            ]
          },
        ];
      } else {
        query.$or = [
          { recipientRole: role },
          {
            recipientRole: { $in: [null, undefined] },
            actionUrl: { $regex: `^/${role}`, $options: 'i' },
          },
        ];
      }
    }

    return Notification.countDocuments(query);
  }

  async createNotification({ recipient, sender, type, title, body, message, data, actionUrl, recipientRole }) {
    return Notification.create({
      recipient: recipient.toString(),
      sender: sender ? sender.toString() : null,
      recipientRole: recipientRole || null,
      type: type || 'system',
      title,
      body: body || message || '',
      message: message || body || '',
      data: data || {},
      actionUrl: actionUrl || null,
      isRead: false,
    });
  }

  async markAllAsRead(userId, role = null) {
    const query = { recipient: userId.toString(), isRead: false };

    // Scope to the active role so other roles' notifications stay unread
    if (role) {
      if (role === 'customer') {
        query.$or = [
          { recipientRole: 'customer' },
          {
            recipientRole: { $in: [null, undefined] },
            $and: [
              { actionUrl: { $not: { $regex: '^/(vendor|creator|admin)', $options: 'i' } } },
            ]
          },
        ];
      } else {
        query.$or = [
          { recipientRole: role },
          {
            recipientRole: { $in: [null, undefined] },
            actionUrl: { $regex: `^/${role}`, $options: 'i' },
          },
        ];
      }
    }

    return Notification.updateMany(query, { isRead: true });
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
