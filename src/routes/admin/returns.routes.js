// routes/admin/return.routes.js
import express from "express";
import {
  getAllReturnRequests,
  updateReturnStatus,
  resolveReturnRequest,
  getReturnRequestById,
  markReturnPickedUp,
  getPendingReturnPickups,
  verifyReturnPickup,
} from "../../controllers/admin/return.admin.controller.js";
import { protect, admin } from "../../middleware/auth.js";

const router = express.Router();

// GET all return requests
router.get("/", protect, admin, getAllReturnRequests);

router.get("/pending-pickups", protect, admin, getPendingReturnPickups);

// GET single return request by ID
router.get("/:returnRequestId", protect, admin, getReturnRequestById);

// PUT update return status
router.put("/:id/status", protect, admin, updateReturnStatus);

// PUT resolve return request
router.put("/:id/resolve", protect, admin, resolveReturnRequest);

// routes/customer/return.routes.js

// PUT /api/returns/:returnRequestId/picked-up
router.put("/:returnRequestId/picked-up", markReturnPickedUp);

// PUT verify return pickup
router.put("/:returnId/verify-pickup", protect, admin, verifyReturnPickup);

export default router;
