import express from "express";
import {
  getDashboardStats,
  getLowStockProducts,
} from "../../controllers/admin/dashboard.admin.controller.js";

const router = express.Router();

// /api/admin/dashboard
router.get("/", getDashboardStats);
router.get("/low-stock", getLowStockProducts);

export default router;
