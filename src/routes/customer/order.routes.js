import express from "express";
import {
  createOrder,
  getOrderHistory,
  getOrderById,
  reorder,
  cancelOrder,
} from "../../controllers/customer/order.controller.js";
import protect from "../../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.post("/", createOrder);
router.get("/", getOrderHistory);
router.get("/:id", getOrderById);
router.post("/:id/reorder", reorder);
router.post("/:id/cancel", cancelOrder);

export default router;
