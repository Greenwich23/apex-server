// routes/admin/refund.routes.js
import express from "express";
import {
  assignPickupAgent,
  markReturnPickedUp,
  markReturnReceived,
  processRefund,
  getReturnRequests,
  getReturnRequestById,
  updateReturnStatus,
} from "../../controllers/admin/refund.admin.controller.js";
import { protect, admin } from "../../middleware/auth.js";

const router = express.Router();

// All routes require admin authentication
router.use(protect);
router.use(admin);

// Get all return requests
router.get("/returns", getReturnRequests);

// Get single return request
router.get("/returns/:returnRequestId", getReturnRequestById);

// Update return status
router.patch("/returns/:returnRequestId/status", updateReturnStatus);

// Assign pickup agent
router.post("/returns/:returnRequestId/assign-pickup", assignPickupAgent);

// Mark return as picked up (driver)
router.put("/returns/:returnRequestId/picked-up", markReturnPickedUp);

// Mark return as received (admin)
router.put("/returns/:returnRequestId/received", markReturnReceived);

// Process refund
router.post("/returns/:returnRequestId/refund", processRefund);

export default router;
