import SupportTicket from "../../models/SupportTicket.js";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";

// POST /api/support/tickets
export const createTicket = async (req, res) => {
  try {
    const { subject, category, message, orderId } = req.body;

    const ticket = await SupportTicket.create({
      user: req.user.id,
      order: orderId || null,
      subject,
      category,
      messages: [
        {
          sender: "customer",
          message,
        },
      ],
    });

    return successResponse(res, "Support ticket created", { ticket }, 201);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// GET /api/support/tickets
export const getMyTickets = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { user: req.user.id };
    if (status) filter.status = status;

    const tickets = await SupportTicket.find(filter)
      .populate("order", "createdAt total")
      .sort({ updatedAt: -1 }) // most recently updated first
      .select("-messages"); // don't load full message history in list view

    return successResponse(res, "Tickets fetched", { tickets });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// GET /api/support/tickets/:id
export const getTicketById = async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({
      _id: req.params.id,
      user: req.user.id,
    }).populate("order", "items total createdAt");

    if (!ticket) return errorResponse(res, "Ticket not found", 404);

    return successResponse(res, "Ticket fetched", { ticket });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// POST /api/support/tickets/:id/reply
export const replyToTicket = async (req, res) => {
  try {
    const { message } = req.body;

    const ticket = await SupportTicket.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!ticket) return errorResponse(res, "Ticket not found", 404);

    if (ticket.status === "closed") {
      return errorResponse(res, "This ticket is closed. Please open a new one.", 400);
    }

    ticket.messages.push({ sender: "customer", message });
    ticket.status = "open"; // reopen if it was resolved
    await ticket.save();

    return successResponse(res, "Reply sent", { ticket });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
