import express from "express";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllReadNotifications,
} from "../../controllers/admin/notification.controller.js";
import { protect, admin } from "../../middleware/auth.js";

const router = express.Router();

router.use(protect);
router.use(admin);

router.get("/unread-count", getUnreadCount);

router.put("/mark-all-read", markAllAsRead);

router.delete("/clear-read", clearAllReadNotifications);

router.get("/", getNotifications);

router.put("/:id/read", markAsRead);

router.delete("/:id", deleteNotification);

export default router;
