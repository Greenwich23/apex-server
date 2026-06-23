import SupportTicket from "../../models/SupportTicket.js";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";

// GET /api/admin/support/tickets
export const getAllTickets = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, priority, category } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    const skip = (Number(page) - 1) * Number(limit);

    const [tickets, total] = await Promise.all([
      SupportTicket.find(filter)
        .populate("user", "name email")
        .populate("order", "createdAt total")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select("-messages"),
      SupportTicket.countDocuments(filter),
    ]);

    return successResponse(res, "Tickets fetched", {
      tickets,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// GET /api/admin/support/tickets/:id
export const getTicketById = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate("user", "name email avatar")
      .populate("order", "items total createdAt");

    if (!ticket) return errorResponse(res, "Ticket not found", 404);

    return successResponse(res, "Ticket fetched", { ticket });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// POST /api/admin/support/tickets/:id/reply
export const replyToTicket = async (req, res) => {
  try {
    const { message } = req.body;

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return errorResponse(res, "Ticket not found", 404);

    ticket.messages.push({ sender: "admin", message });
    ticket.status = "in_progress";
    await ticket.save();

    return successResponse(res, "Reply sent", { ticket });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// PATCH /api/admin/support/tickets/:id/status
export const updateTicketStatus = async (req, res) => {
  try {
    const { status, priority } = req.body;

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return errorResponse(res, "Ticket not found", 404);

    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;
    if (status === "resolved" || status === "closed") {
      ticket.resolvedAt = new Date();
    }

    await ticket.save();

    return successResponse(res, "Ticket updated", { ticket });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
