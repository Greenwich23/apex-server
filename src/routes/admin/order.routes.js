import express from "express";
import {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  assignTrackingInfo,
  getOrderStats,
} from "../../controllers/admin/order.admin.controller.js";

const router = express.Router();

// /api/admin/orders
router.get("/", getAllOrders);
router.get("/stats", getOrderStats); // must be before /:id
router.get("/:id", getOrderById);
router.put("/:id/status", updateOrderStatus);
router.put("/:id/tracking", assignTrackingInfo);

export default router;
