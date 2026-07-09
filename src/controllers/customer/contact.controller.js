// controllers/customer/contact.controller.js
import { successResponse, errorResponse } from "../../utils/apiResponse.js";
import { sendContactEmail } from "../../services/emailService.js";

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

    // Send email
    const result = await sendContactEmail({ name, email, subject, message });

    if (result.success) {
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
