import express from "express";
import {
  createTicket,
  getMyTickets,
  getTicketById,
  replyToTicket,
} from "../../controllers/customer/support.controller.js";
import protect from "../../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.post("/tickets", createTicket);
router.get("/tickets", getMyTickets);
router.get("/tickets/:id", getTicketById);
router.post("/tickets/:id/reply", replyToTicket);

export default router;
