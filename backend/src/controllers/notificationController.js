const notificationService = require('../services/notification.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * NotificationController
 * Handles request parameters parsing for client alert list fetches, marking seen, and deletes.
 */
class NotificationController {
  getNotifications = asyncHandler(async (req, res) => {
    const list = await notificationService.getNotifications(req.user._id);
    return ApiResponse.ok(res, 'Notifications log retrieved.', { items: list, notifications: list });
  });

  getUnreadCount = asyncHandler(async (req, res) => {
    const count = await notificationService.unreadCount(req.user._id);
    return ApiResponse.ok(res, 'Unread count retrieved.', { count });
  });

  markAllAsRead = asyncHandler(async (req, res) => {
    await notificationService.markAllAsRead(req.user._id);
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
