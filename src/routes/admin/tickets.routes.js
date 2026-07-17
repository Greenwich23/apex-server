// routes/admin/ticket.routes.js
import express from "express";
import {
  getAdminTickets,
  getAdminTicketById,
  replyToAdminTicket,
  updateAdminTicketStatus,
  updateAdminTicketPriority,
} from "../../controllers/admin/ticket.admin.controller.js";
import { protect, admin } from "../../middleware/auth.js";

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(admin);

// GET /api/admin/tickets - Get all tickets (admin)
router.get("/", getAdminTickets);

// GET /api/admin/tickets/:id - Get specific ticket (admin)
router.get("/:id", getAdminTicketById);

// POST /api/admin/tickets/:id/reply - Reply to ticket (admin)
router.post("/:id/reply", replyToAdminTicket);

// PATCH /api/admin/tickets/:id/status - Update ticket status (admin)
router.patch("/:id/status", updateAdminTicketStatus);

// PATCH /api/admin/tickets/:id/priority - Update ticket priority (admin)
router.patch("/:id/priority", updateAdminTicketPriority);

export default router;
