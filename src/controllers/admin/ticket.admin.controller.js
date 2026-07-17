// controllers/admin/ticket.admin.controller.js
import Ticket from "../../models/SupportTicket.js";
import User from "../../models/User.js";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";

// ─── GET /api/admin/tickets ──────────────────────────────────────────────────
// ✅ This should return ALL tickets from ALL customers

export const getAdminTickets = async (req, res) => {
  try {
    console.log("🚀 [getAdminTickets] Admin fetching ALL customer tickets...");
    console.log("📋 [getAdminTickets] Admin:", req.user?.email || req.user?.id);
    console.log("📋 [getAdminTickets] Query params:", req.query);

    const { page = 1, limit = 20, status, priority, search } = req.query;

    const filter = { isActive: true }; // ✅ Get all active tickets from all users

    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    // Optional: Search by subject or customer name
    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: "i" } },
        { "user.name": { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .populate("user", "name email phone") // ✅ Populate customer info
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Ticket.countDocuments(filter),
    ]);

    console.log(
      `✅ [getAdminTickets] Found ${tickets.length} tickets from ${total} total`,
    );

    if (tickets.length === 0) {
      console.log(
        "⚠️ [getAdminTickets] No tickets found in database. Create a test ticket!",
      );
    }

    return successResponse(res, "Tickets fetched", {
      tickets,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error("❌ [getAdminTickets] Error:", error.message);
    return errorResponse(res, error.message);
  }
};

// ─── GET /api/admin/tickets/:id ──────────────────────────────────────────────
// ✅ Get a specific ticket by ID (admin view)

export const getAdminTicketById = async (req, res) => {
  try {
    console.log("🚀 [getAdminTicketById] Admin fetching ticket...");
    console.log("📋 [getAdminTicketById] Ticket ID:", req.params.id);

    const { id } = req.params;

    const ticket = await Ticket.findOne({
      _id: id,
      isActive: true,
    })
      .populate("user", "name email phone")
      .populate("messages.sender", "name email role");

    if (!ticket) {
      console.log(`❌ [getAdminTicketById] Ticket ${id} not found`);
      return errorResponse(res, "Ticket not found", 404);
    }

    console.log(
      `✅ [getAdminTicketById] Found ticket: ${ticket.subject} from ${ticket.user?.name}`,
    );

    return successResponse(res, "Ticket fetched", { ticket });
  } catch (error) {
    console.error("❌ [getAdminTicketById] Error:", error.message);
    return errorResponse(res, error.message);
  }
};

// ─── POST /api/admin/tickets/:id/reply ──────────────────────────────────────
// ✅ Admin replies to a customer ticket

export const replyToAdminTicket = async (req, res) => {
  try {
    console.log("🚀 [replyToAdminTicket] Admin replying to ticket...");
    console.log("📋 [replyToAdminTicket] Ticket ID:", req.params.id);
    console.log(
      "📋 [replyToAdminTicket] Admin:",
      req.user?.email || req.user?.id,
    );

    const { message } = req.body;
    const ticketId = req.params.id;

    if (!message || !message.trim()) {
      return errorResponse(res, "Reply message is required", 400);
    }

    const ticket = await Ticket.findOne({
      _id: ticketId,
      isActive: true,
    });

    if (!ticket) {
      return errorResponse(res, "Ticket not found", 404);
    }

    const admin = await User.findById(req.user.id);
    if (!admin) {
      return errorResponse(res, "Admin user not found", 404);
    }

    // Add admin reply
    ticket.messages.push({
      sender: req.user.id,
      senderName: admin.name,
      senderRole: "admin",
      message: message.trim(),
      isAdmin: true,
    });

    // Update status if open
    if (ticket.status === "open") {
      ticket.status = "in_progress";
    }

    await ticket.save();

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate("user", "name email")
      .populate("messages.sender", "name email role");

    console.log("✅ [replyToAdminTicket] Reply sent successfully");

    return successResponse(res, "Reply sent successfully", {
      ticket: populatedTicket,
    });
  } catch (error) {
    console.error("❌ [replyToAdminTicket] Error:", error.message);
    return errorResponse(res, error.message);
  }
};

// ─── PATCH /api/admin/tickets/:id/status ────────────────────────────────────
// ✅ Admin updates ticket status

export const updateAdminTicketStatus = async (req, res) => {
  try {
    console.log("🚀 [updateAdminTicketStatus] Updating ticket status...");
    console.log("📋 [updateAdminTicketStatus] Ticket ID:", req.params.id);

    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return errorResponse(res, "Status is required", 400);
    }

    const validStatuses = ["open", "in_progress", "resolved", "closed"];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, "Invalid status", 400);
    }

    const ticket = await Ticket.findOne({
      _id: id,
      isActive: true,
    });

    if (!ticket) {
      return errorResponse(res, "Ticket not found", 404);
    }

    ticket.status = status;
    await ticket.save();

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate("user", "name email")
      .populate("messages.sender", "name email role");

    console.log("✅ [updateAdminTicketStatus] Status updated to:", status);

    return successResponse(res, "Ticket status updated", {
      ticket: populatedTicket,
    });
  } catch (error) {
    console.error("❌ [updateAdminTicketStatus] Error:", error.message);
    return errorResponse(res, error.message);
  }
};

// ─── PATCH /api/admin/tickets/:id/priority ──────────────────────────────────
// ✅ Admin updates ticket priority

export const updateAdminTicketPriority = async (req, res) => {
  try {
    console.log("🚀 [updateAdminTicketPriority] Updating ticket priority...");
    console.log("📋 [updateAdminTicketPriority] Ticket ID:", req.params.id);

    const { id } = req.params;
    const { priority } = req.body;

    if (!priority) {
      return errorResponse(res, "Priority is required", 400);
    }

    const validPriorities = ["low", "medium", "high", "urgent"];
    if (!validPriorities.includes(priority)) {
      return errorResponse(res, "Invalid priority", 400);
    }

    const ticket = await Ticket.findOne({
      _id: id,
      isActive: true,
    });

    if (!ticket) {
      return errorResponse(res, "Ticket not found", 404);
    }

    ticket.priority = priority;
    await ticket.save();

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate("user", "name email")
      .populate("messages.sender", "name email role");

    console.log(
      "✅ [updateAdminTicketPriority] Priority updated to:",
      priority,
    );

    return successResponse(res, "Ticket priority updated", {
      ticket: populatedTicket,
    });
  } catch (error) {
    console.error("❌ [updateAdminTicketPriority] Error:", error.message);
    return errorResponse(res, error.message);
  }
};

// ─── GET /api/admin/tickets/stats ────────────────────────────────────────────
// ✅ Get overall ticket statistics for admin dashboard

export const getAdminTicketStats = async (req, res) => {
  try {
    console.log("🚀 [getAdminTicketStats] Getting overall ticket stats...");

    const stats = await Ticket.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const total = await Ticket.countDocuments({ isActive: true });

    const formattedStats = {
      total,
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
    };

    stats.forEach((stat) => {
      formattedStats[stat._id] = stat.count;
    });

    console.log("✅ [getAdminTicketStats] Stats:", formattedStats);

    return successResponse(res, "Ticket stats fetched", {
      stats: formattedStats,
    });
  } catch (error) {
    console.error("❌ [getAdminTicketStats] Error:", error.message);
    return errorResponse(res, error.message);
  }
};
