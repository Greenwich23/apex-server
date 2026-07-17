// controllers/contact.controller.js
import { sendContactEmail } from "../services/emailService.js";
import Ticket from "../../models/SupportTicket.js";
import User from "../models/User.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

// POST /api/contact
export const sendContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return errorResponse(res, "All fields are required", 400);
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return errorResponse(res, "Please provide a valid email address", 400);
    }

    // 1. Send email to support
    const emailResult = await sendContactEmail({
      name,
      email,
      subject,
      message,
    });

    // 2. Check if user exists (to create a ticket)
    let user = await User.findOne({ email });

    // 3. If user exists, automatically create a support ticket
    if (user) {
      try {
        const ticket = await Ticket.create({
          user: user._id,
          subject: `[Contact Form] ${subject}`,
          messages: [
            {
              sender: user._id,
              senderName: name,
              senderRole: "customer",
              message: message,
              isAdmin: false,
            },
          ],
          priority: "medium",
          category: "general",
          status: "open",
        });
        console.log(`✅ Ticket created for ${email}: ${ticket._id}`);
      } catch (ticketError) {
        console.error(
          "Failed to create ticket from contact form:",
          ticketError,
        );
        // Don't fail the request if ticket creation fails
      }
    }

    if (emailResult.success) {
      return successResponse(
        res,
        "Your message has been sent successfully. We'll get back to you soon!",
      );
    } else {
      return errorResponse(
        res,
        "Failed to send message. Please try again later.",
        500,
      );
    }
  } catch (error) {
    console.error("❌ Contact form error:", error);
    return errorResponse(res, error.message || "Failed to send message");
  }
};
