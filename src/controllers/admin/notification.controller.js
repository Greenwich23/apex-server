// controllers/admin/notification.controller.js
import Notification from "../../models/Notification.js";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";
import logger from "../../utils/logger.js";

// ─── GET /api/admin/notifications ────────────────────────────────────────────
export const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, isRead, type } = req.query;
    const filter = {};

    if (isRead !== undefined) {
      filter.isRead = isRead === "true";
    }
    if (type) {
      filter.type = type;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Notification.countDocuments(filter),
    ]);

    // Get unread count
    const unreadCount = await Notification.countDocuments({ isRead: false });

    return successResponse(res, "Notifications fetched", {
      notifications,
      unreadCount,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (error) {
    logger.error("Error fetching notifications:", error);
    return errorResponse(res, error.message);
  }
};

// ─── GET /api/admin/notifications/unread-count ──────────────────────────────
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ isRead: false });
    return successResponse(res, "Unread count fetched", { count });
  } catch (error) {
    logger.error("Error fetching unread count:", error);
    return errorResponse(res, error.message);
  }
};

// ─── PUT /api/admin/notifications/:id/read ──────────────────────────────────
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findById(id);
    if (!notification) {
      return errorResponse(res, "Notification not found", 404);
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    return successResponse(res, "Notification marked as read", {
      notification,
    });
  } catch (error) {
    logger.error("Error marking notification as read:", error);
    return errorResponse(res, error.message);
  }
};

// ─── PUT /api/admin/notifications/mark-all-read ─────────────────────────────
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { isRead: false },
      { isRead: true, readAt: new Date() },
    );

    return successResponse(res, "All notifications marked as read");
  } catch (error) {
    logger.error("Error marking all as read:", error);
    return errorResponse(res, error.message);
  }
};

// ─── DELETE /api/admin/notifications/:id ────────────────────────────────────
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndDelete(id);
    if (!notification) {
      return errorResponse(res, "Notification not found", 404);
    }

    return successResponse(res, "Notification deleted successfully");
  } catch (error) {
    logger.error("Error deleting notification:", error);
    return errorResponse(res, error.message);
  }
};

// ─── DELETE /api/admin/notifications/clear-read ─────────────────────────────
export const clearAllReadNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({ isRead: true });
    return successResponse(res, "Read notifications cleared", {
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    logger.error("Error clearing read notifications:", error);
    return errorResponse(res, error.message);
  }
};
