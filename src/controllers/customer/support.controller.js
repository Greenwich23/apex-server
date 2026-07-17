// controllers/customer/ticket.customer.controller.js
import Ticket from "../../models/SupportTicket.js"; // ✅ Fixed import path
import User from "../../models/User.js";
import Order from "../../models/Order.js";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";
import { notifyNewSupportTicket } from "../../services/notificationService.js";

export const createTicket = async (req, res) => {
  try {
    console.log("🚀 [createTicket] Starting...");
    console.log("📋 [createTicket] User:", req.user?.email || req.user?.id);
    console.log("📋 [createTicket] Body:", req.body);

    const { subject, message, priority, category, orderId } = req.body;

    if (!subject || !message) {
      console.error("❌ [createTicket] Subject or message missing");
      return errorResponse(res, "Subject and message are required", 400);
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      console.error("❌ [createTicket] User not found:", req.user.id);
      return errorResponse(res, "User not found", 404);
    }

    let order = null;
    if (orderId) {
      order = await Order.findOne({
        _id: orderId,
        user: req.user.id,
      });
      if (!order) {
        return errorResponse(
          res,
          "Order not found or does not belong to you",
          404,
        );
      }
    }

    // Create ticket
    const ticket = await Ticket.create({
      user: req.user.id,
      order: orderId || null,
      subject,
      priority: priority || "medium",
      category: category || "general",
      status: "open",
      isActive: true,
      messages: [
        {
          sender: req.user.id,
          senderName: user.name,
          senderRole: "customer",
          message: message.trim(),
          isAdmin: false,
        },
      ],
    });

    await notifyNewSupportTicket(ticket);
    console.log("New Support ticket created");

    console.log("✅ [createTicket] Ticket created:", ticket._id);

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate("user", "name email")
      .populate("messages.sender", "name email role")
      .populate("order", "orderId total createdAt");

    return successResponse(
      res,
      "Ticket created successfully",
      { ticket: populatedTicket },
      201,
    );
  } catch (error) {
    console.error("❌ [createTicket] Error:", error.message);
    console.error("❌ [createTicket] Error details:", error.errors);
    return errorResponse(res, error.message);
  }
};

export const replyToTicket = async (req, res) => {
  try {
    console.log("🚀 [replyToTicket] Starting...");
    console.log("📋 [replyToTicket] Ticket ID:", req.params.id);
    console.log("📋 [replyToTicket] User:", req.user?.email || req.user?.id);

    const { message } = req.body;
    const ticketId = req.params.id;

    if (!message || !message.trim()) {
      return errorResponse(res, "Reply message is required", 400);
    }

    const ticket = await Ticket.findOne({
      _id: ticketId,
      user: req.user.id,
      isActive: true,
    });

    if (!ticket) {
      console.error("❌ [replyToTicket] Ticket not found:", ticketId);
      return errorResponse(res, "Ticket not found", 404);
    }

    if (ticket.status === "closed") {
      return errorResponse(res, "Cannot reply to a closed ticket", 400);
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    // Add reply
    ticket.messages.push({
      sender: req.user.id,
      senderName: user.name,
      senderRole: "customer",
      message: message.trim(),
      isAdmin: false,
    });

    // Reopen ticket if it was resolved
    if (ticket.status === "resolved") {
      ticket.status = "open";
      console.log("📋 [replyToTicket] Ticket reopened from resolved to open");
    }

    await ticket.save();
    console.log("✅ [replyToTicket] Reply saved");

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate("user", "name email")
      .populate("messages.sender", "name email role")
      .populate("order", "orderId total createdAt");

    return successResponse(res, "Reply sent successfully", {
      ticket: populatedTicket,
    });
  } catch (error) {
    console.error("❌ [replyToTicket] Error:", error.message);
    return errorResponse(res, error.message);
  }
};

export const getMyTickets = async (req, res) => {
  try {
    console.log("🚀 [getMyTickets] Starting...");
    console.log("📋 [getMyTickets] User:", req.user?.email || req.user?.id);
    console.log("📋 [getMyTickets] Query:", req.query);

    const { page = 1, limit = 10, status } = req.query;
    const filter = { user: req.user.id, isActive: true };

    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select("subject status priority category updatedAt messages"),
      Ticket.countDocuments(filter),
    ]);

    console.log(`✅ [getMyTickets] Found ${tickets.length} tickets`);

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
    console.error("❌ [getMyTickets] Error:", error.message);
    return errorResponse(res, error.message);
  }
};

export const getMyTicketById = async (req, res) => {
  try {
    console.log("🚀 [getMyTicketById] Starting...");
    console.log("📋 [getMyTicketById] Ticket ID:", req.params.id);
    console.log("📋 [getMyTicketById] User:", req.user?.email || req.user?.id);

    const ticket = await Ticket.findOne({
      _id: req.params.id,
      user: req.user.id,
      isActive: true,
    })
      .populate("user", "name email")
      .populate("messages.sender", "name email role")
      .populate("order", "orderId total createdAt");

    if (!ticket) {
      console.error("❌ [getMyTicketById] Ticket not found:", req.params.id);
      return errorResponse(res, "Ticket not found", 404);
    }

    console.log(`✅ [getMyTicketById] Found ticket: ${ticket.subject}`);

    return successResponse(res, "Ticket fetched", { ticket });
  } catch (error) {
    console.error("❌ [getMyTicketById] Error:", error.message);
    return errorResponse(res, error.message);
  }
};

export const cancelTicket = async (req, res) => {
  try {
    console.log("🚀 [cancelTicket] Starting...");
    console.log("📋 [cancelTicket] Ticket ID:", req.params.id);

    const ticket = await Ticket.findOne({
      _id: req.params.id,
      user: req.user.id,
      isActive: true,
    });

    if (!ticket) {
      return errorResponse(res, "Ticket not found", 404);
    }

    if (ticket.status === "closed" || ticket.status === "resolved") {
      return errorResponse(
        res,
        "Cannot cancel a ticket that is already resolved or closed",
        400,
      );
    }

    ticket.status = "closed";
    ticket.closedAt = new Date();
    await ticket.save();

    console.log("✅ [cancelTicket] Ticket cancelled");

    return successResponse(res, "Ticket cancelled successfully", { ticket });
  } catch (error) {
    console.error("❌ [cancelTicket] Error:", error.message);
    return errorResponse(res, error.message);
  }
};

export const getTicketStats = async (req, res) => {
  try {
    console.log("🚀 [getTicketStats] Starting...");
    console.log("📋 [getTicketStats] User:", req.user?.email || req.user?.id);

    const userId = req.user.id;

    const stats = await Ticket.aggregate([
      { $match: { user: userId, isActive: true } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const total = await Ticket.countDocuments({ user: userId, isActive: true });

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

    console.log("✅ [getTicketStats] Stats:", formattedStats);

    return successResponse(res, "Ticket stats fetched", {
      stats: formattedStats,
    });
  } catch (error) {
    console.error("❌ [getTicketStats] Error:", error.message);
    return errorResponse(res, error.message);
  }
};
