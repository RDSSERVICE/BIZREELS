const notificationRepository = require('../repositories/notificationRepository');
const ApiError = require('../utils/ApiError');
const { emitToUser } = require('../sockets');

/**
 * NotificationService
 * Handles core backend methods for reading, listing, and cleaning alerts.
 * Now supports explicit `recipientRole` for proper role-scoped notifications.
 */
class NotificationService {
  async getNotifications(userId, role = null) {
    return notificationRepository.getNotificationsForUser(userId, { role });
  }

  async markAllAsRead(userId, role = null) {
    return notificationRepository.markAllAsRead(userId, role);
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

  /**
   * Create a notification.
   * @param {string} userId - recipient user ID
   * @param {string} type - notification type (requirement, quote, payment, etc.)
   * @param {string} title - notification title
   * @param {string|null} body - notification body text
   * @param {object} data - extra data payload
   * @param {string|null} actionUrl - deep-link URL
   * @param {string|null} recipientRole - explicit target role (vendor/customer/creator/admin)
   */
  async create(userId, type, title, body = null, data = {}, actionUrl = null, recipientRole = null) {
    let resolvedUrl = actionUrl;
    let resolvedRole = recipientRole;

    try {
      const User = require('../models/User');
      const user = await User.findById(userId).select('activeRole current_role').lean();
      const activeRole = user?.activeRole || user?.current_role || 'customer';

      // If no explicit recipientRole was given, auto-detect from actionUrl or user's activeRole
      if (!resolvedRole) {
        if (resolvedUrl) {
          if (resolvedUrl.startsWith('/vendor')) resolvedRole = 'vendor';
          else if (resolvedUrl.startsWith('/creator')) resolvedRole = 'creator';
          else if (resolvedUrl.startsWith('/admin')) resolvedRole = 'admin';
          else resolvedRole = activeRole;
        } else {
          resolvedRole = activeRole;
        }
      }

      if (resolvedUrl) {
        if (resolvedUrl.startsWith('/wallet')) {
          resolvedUrl = resolvedRole === 'customer' ? '/wallet' : `/${resolvedRole}/wallet`;
        } else if (resolvedUrl.startsWith('/subscriptions') || resolvedUrl.startsWith('/subscription')) {
          resolvedUrl = resolvedRole === 'customer' ? '/subscriptions' : `/${resolvedRole}/subscription`;
        } else if (resolvedUrl.startsWith('/chat')) {
          resolvedUrl = resolvedRole === 'customer' ? '/chat' : `/${resolvedRole}/chat`;
        } else if (resolvedUrl === '/notifications') {
          resolvedUrl = resolvedRole === 'customer' ? '/notifications' : `/${resolvedRole}/notifications`;
        }
      } else {
        if (type === 'requirement' || type === 'proposal' || type === 'lead') {
          resolvedUrl = resolvedRole === 'customer' ? '/my-requirements' : `/${resolvedRole}/leads`;
        } else if (type === 'hire' || type === 'campaign') {
          resolvedUrl = resolvedRole === 'customer' ? '/activities' : `/${resolvedRole}/hire-creator`;
          if (resolvedRole === 'creator') {
            resolvedUrl = '/creator/dashboard';
          }
        }
      }
    } catch (err) {
      console.error('Error resolving actionUrl for notification:', err.message);
    }

    let savedNotif = null;
    try {
      savedNotif = await notificationRepository.createNotification({
        recipient: userId,
        type: type || 'system',
        title: title || 'New Alert',
        body: body || title || '',
        message: body || title || '',
        data: data || {},
        actionUrl: resolvedUrl || null,
        recipientRole: resolvedRole || null,
      });
    } catch (err) {
      console.error('Error saving notification in DB:', err.message);
    }

    const payload = {
      _id: savedNotif?._id ? savedNotif._id.toString() : Date.now().toString(),
      id: savedNotif?._id ? savedNotif._id.toString() : Date.now().toString(),
      userId,
      recipient: userId,
      type: type || 'system',
      title: title || 'New Alert',
      body: body || title || '',
      message: body || title || '',
      data: data || {},
      actionUrl: resolvedUrl || null,
      action_url: resolvedUrl || null,
      recipientRole: resolvedRole || null,
      isRead: false,
      is_read: false,
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    // Dual emit for complete frontend subscriber compatibility
    emitToUser(userId.toString(), 'notification:new', payload);
    emitToUser(userId.toString(), 'notification', payload);

    return savedNotif || payload;
  }

  async listMine(userId, isRead = null, cursor = null, limit = 30, role = null) {
    const listLimit = Math.max(1, Math.min(100, parseInt(limit || 30, 10)));
    const notifs = await notificationRepository.getNotificationsForUser(userId, {
      isRead,
      cursor,
      limit: listLimit + 1,
      role
    });

    const hasMore = notifs.length > listLimit;
    const items = notifs.slice(0, listLimit);
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]._id.toString() : null;

    return {
      items: items.map(n => ({
        ...n,
        id: n._id?.toString() || n.id,
        _id: n._id?.toString() || n.id,
        isRead: n.isRead !== undefined ? n.isRead : (n.is_read || false),
        is_read: n.isRead !== undefined ? n.isRead : (n.is_read || false),
        actionUrl: n.actionUrl || n.action_url || null,
        action_url: n.actionUrl || n.action_url || null,
      })),
      next_cursor: nextCursor,
      has_more: hasMore,
    };
  }

  async unreadCount(userId, role = null) {
    return notificationRepository.unreadCount(userId, role);
  }

  async markRead(nid, userId) {
    return this.markAsRead(nid, userId);
  }

  async markAllRead(userId, role = null) {
    return this.markAllAsRead(userId, role);
  }

  async dismiss(nid, userId) {
    return this.deleteNotification(nid, userId);
  }
}

module.exports = new NotificationService();
