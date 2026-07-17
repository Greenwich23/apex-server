// controllers/admin/review.admin.controller.js
import Review from "../../models/Review.js";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";

// GET /api/admin/reviews
export const getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, rating } = req.query;

    const filter = {};

    // Filter by rating
    if (rating) {
      filter.rating = Number(rating);
    }

    // Search by product name or user name
    if (search) {
      const productReviews = await Review.find(filter)
        .populate({
          path: "product",
          match: { name: { $regex: search, $options: "i" } },
        })
        .populate({
          path: "user",
          match: { name: { $regex: search, $options: "i" } },
        });

      // Filter out reviews where product or user didn't match
      const filteredReviews = productReviews.filter(
        (r) => r.product !== null || r.user !== null,
      );

      const skip = (Number(page) - 1) * Number(limit);
      const total = filteredReviews.length;
      const reviews = filteredReviews.slice(skip, skip + Number(limit));

      return successResponse(res, "Reviews fetched", {
        reviews,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)),
          limit: Number(limit),
        },
      });
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate("user", "name email avatar")
        .populate("product", "name images sku slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Review.countDocuments(filter),
    ]);

    return successResponse(res, "Reviews fetched", {
      reviews,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return errorResponse(res, error.message);
  }
};
