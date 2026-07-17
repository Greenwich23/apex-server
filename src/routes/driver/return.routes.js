// routes/driver/return.routes.js
import express from "express";
import {
  getReturnRequestById,
  markReturnPickedUp,
} from "../../controllers/admin/return.admin.controller.js";

const router = express.Router();

// ✅ PUBLIC ROUTES - No authentication required (driver uses email link)
// GET return details for pickup
router.get("/:returnRequestId", getReturnRequestById);

// PUT mark return as picked up
router.put("/:returnRequestId/picked-up", markReturnPickedUp);

export default router;
