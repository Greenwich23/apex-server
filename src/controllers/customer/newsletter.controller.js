// controllers/newsletter.controller.js
import Newsletter from "../../models/NewsLetter.js";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";

// POST /api/newsletter/subscribe
export const subscribeToNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return errorResponse(res, "Email is required", 400);
    }

    // Check if email already exists
    const existing = await Newsletter.findOne({ email: email.toLowerCase() });

    if (existing) {
      // If inactive, reactivate
      if (!existing.isActive) {
        existing.isActive = true;
        existing.unsubscribedAt = null;
        await existing.save();
        return successResponse(res, "Welcome back! You've been resubscribed.", {
          email: existing.email,
        });
      }
      return errorResponse(res, "Email already subscribed", 400);
    }

    const subscription = await Newsletter.create({
      email: email.toLowerCase(),
      subscribedAt: new Date(),
    });

    // TODO: Send welcome email to subscriber
    // await sendNewsletterWelcomeEmail(email);

    return successResponse(
      res,
      "Successfully subscribed to the newsletter!",
      { subscription },
      201,
    );
  } catch (error) {
    console.error("Error subscribing to newsletter:", error);
    return errorResponse(res, error.message);
  }
};

// GET /api/newsletter/unsubscribe/:email
export const unsubscribeFromNewsletter = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return errorResponse(res, "Email is required", 400);
    }

    const subscription = await Newsletter.findOne({
      email: email.toLowerCase(),
    });

    if (!subscription) {
      return errorResponse(res, "Email not found in our records", 404);
    }

    if (!subscription.isActive) {
      return errorResponse(res, "Email is already unsubscribed", 400);
    }

    subscription.isActive = false;
    subscription.unsubscribedAt = new Date();
    await subscription.save();

    return successResponse(
      res,
      "Successfully unsubscribed from the newsletter",
    );
  } catch (error) {
    console.error("Error unsubscribing:", error);
    return errorResponse(res, error.message);
  }
};

// GET /api/newsletter/subscribers (Admin only)
export const getSubscribers = async (req, res) => {
  try {
    const { page = 1, limit = 20, isActive } = req.query;
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const skip = (Number(page) - 1) * Number(limit);

    const [subscribers, total] = await Promise.all([
      Newsletter.find(filter)
        .sort({ subscribedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select("-__v"),
      Newsletter.countDocuments(filter),
    ]);

    return successResponse(res, "Subscribers fetched", {
      subscribers,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching subscribers:", error);
    return errorResponse(res, error.message);
  }
};
