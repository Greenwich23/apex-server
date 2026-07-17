// routes/admin/delivery.routes.js
import express from "express";
import {
  assignDeliveryAgent,
  updateDeliveryStatus,
  getDeliveryUpdatePage,
  createDeliveryAgent,
  getAllDeliveryAgents,
  getDeliveryAgentById,
  toggleDeliveryAgentStatus,
  updateDeliveryAgent,
  deleteDeliveryAgent,
  unassignDeliveryAgent,
  getPendingDeliveries,
  verifyDelivery,
  getDeliveryProof,
  getDeliveryStats,
} from "../../controllers/admin/delivery.admin.controller.js";
import { protect, admin } from "../../middleware/auth.js";
import { uploadDeliveryAgentPhoto } from "../../middleware/upload.js";

const router = express.Router();

console.log("🚀 [Delivery Routes] Initializing...");

// ==================== Public Delivery Status Routes ====================
console.log("📋 [Delivery Routes] Registering public routes...");

// GET delivery update page (no auth - uses token)
router.get("/update/:orderId/:token", getDeliveryUpdatePage);

// PUT update delivery status (no auth - uses token)
router.put("/update/:orderId/:token", updateDeliveryStatus);

console.log("✅ [Delivery Routes] Public routes registered");

// ==================== Admin Verification Routes ====================
// ✅ These must come BEFORE /:id
console.log("📋 [Delivery Routes] Registering admin verification routes...");

// GET pending deliveries for admin verification
router.get("/pending-verification", protect, admin, getPendingDeliveries);

// GET delivery stats
router.get("/stats", protect, admin, getDeliveryStats);

// GET delivery proof for admin
router.get("/:orderId/proof", protect, admin, getDeliveryProof);

// PUT verify delivery (approve/reject)
router.put("/verify/:orderId", protect, admin, verifyDelivery);

console.log("✅ [Delivery Routes] Admin verification routes registered");

// ==================== Delivery Agent Management ====================
// All routes below require authentication and admin role

console.log("📋 [Delivery Routes] Registering admin routes...");

// GET all delivery agents (with filters)
router.get("/", protect, admin, getAllDeliveryAgents);

// GET single delivery agent by ID
// ⚠️ This must come AFTER the specific routes
router.get("/:id", protect, admin, getDeliveryAgentById);

// POST create new delivery agent
router.post("/", protect, admin, uploadDeliveryAgentPhoto, createDeliveryAgent);

// PUT update delivery agent
router.put(
  "/:id",
  protect,
  admin,
  uploadDeliveryAgentPhoto,
  updateDeliveryAgent,
);

// PATCH toggle agent status (active/inactive)
router.patch("/:id/toggle-status", protect, admin, toggleDeliveryAgentStatus);

// DELETE delivery agent
router.delete("/:id", protect, admin, deleteDeliveryAgent);

// ==================== Order Assignment ====================

// POST assign delivery agent to order
router.post("/assign", protect, admin, assignDeliveryAgent);

// POST unassign delivery agent from order
router.post("/unassign/:orderId", protect, admin, unassignDeliveryAgent);

console.log("✅ [Delivery Routes] All routes registered");

export default router;
