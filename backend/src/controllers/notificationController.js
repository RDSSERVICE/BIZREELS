const notificationService = require('../services/notification.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * NotificationController
 * Handles request parameters parsing for client alert list fetches, marking seen, and deletes.
 */
class NotificationController {
  getNotifications = asyncHandler(async (req, res) => {
    const role = req.query.role || req.user.activeRole || req.user.current_role || 'customer';
    const list = await notificationService.getNotifications(req.user._id, role);
    const normalized = (list || []).map(n => ({
      ...n,
      id: n._id?.toString() || n.id,
      _id: n._id?.toString() || n.id,
      isRead: n.isRead !== undefined ? n.isRead : (n.is_read || false),
      is_read: n.isRead !== undefined ? n.isRead : (n.is_read || false),
      actionUrl: n.actionUrl || n.action_url || null,
      action_url: n.actionUrl || n.action_url || null,
    }));
    return ApiResponse.ok(res, 'Notifications log retrieved.', { items: normalized, notifications: normalized });
  });

  getUnreadCount = asyncHandler(async (req, res) => {
    const role = req.query.role || req.user.activeRole || req.user.current_role || 'customer';
    const count = await notificationService.unreadCount(req.user._id, role);
    return ApiResponse.ok(res, 'Unread count retrieved.', { count, unreadCount: count });
  });

  markAllAsRead = asyncHandler(async (req, res) => {
    const role = req.query.role || req.body.role || req.user.activeRole || req.user.current_role || 'customer';
    await notificationService.markAllAsRead(req.user._id, role);
    return ApiResponse.ok(res, 'All notifications marked as read.');
  });

  markAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const notification = await notificationService.markAsRead(id, req.user._id);
    return ApiResponse.ok(res, 'Notification marked as read.', { notification });
  });

  delete = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await notificationService.deleteNotification(id, req.user._id);
    return ApiResponse.ok(res, result.message);
  });
}

module.exports = new NotificationController();
