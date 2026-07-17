// routes/customer/ticket.routes.js
import express from "express";
import {
  getMyTickets,
  getMyTicketById,
  createTicket,
  replyToTicket,
  cancelTicket,
  getTicketStats,
} from "../../controllers/customer/support.controller.js";
import protect from "../../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// GET /api/tickets - Get customer's tickets
router.get("/", getMyTickets);

// GET /api/tickets/stats - Get ticket stats
router.get("/stats", getTicketStats);

// GET /api/tickets/:id - Get specific ticket
router.get("/:id", getMyTicketById);

// POST /api/tickets - Create new ticket
router.post("/", createTicket);

// POST /api/tickets/:id/reply - Reply to ticket
router.post("/:id/reply", replyToTicket);

// PUT /api/tickets/:id/cancel - Cancel ticket
router.put("/:id/cancel", cancelTicket);

export default router;
