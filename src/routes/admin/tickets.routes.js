import express from "express";
import {
  getAllTickets,
  getTicketById,
  replyToTicket,
  updateTicketStatus,
} from "../../controllers/admin/ticket.admin.controller.js";

const router = express.Router();

// /api/admin/support/tickets
router.get("/tickets", getAllTickets);
router.get("/tickets/:id", getTicketById);
router.post("/tickets/:id/reply", replyToTicket);
router.patch("/tickets/:id/status", updateTicketStatus);

export default router;
