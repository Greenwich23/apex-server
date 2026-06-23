import Review from "../../models/Review.js";
import Product from "../../models/Product.js";
import Order from "../../models/Order.js";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";

// ─── helper: recalculate product average rating ──────────────────────────────
const updateProductRating = async (productId) => {
  const result = await Review.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: "$product",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (result.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      averageRating: Math.round(result[0].averageRating * 10) / 10,
      totalReviews: result[0].totalReviews,
    });
  }
};

// POST /api/products/:productId/reviews
export const createReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;

    const product = await Product.findById(productId);
    if (!product) return errorResponse(res, "Product not found", 404);

    // check if user already left a review for this product
    const existing = await Review.findOne({
      product: productId,
      user: req.user.id,
    });
    if (existing) {
      return errorResponse(res, "You have already reviewed this product", 400);
    }

    // check if user actually bought this product (verified purchase)
    const hasPurchased = await Order.findOne({
      user: req.user.id,
      "items.product": productId,
      orderStatus: "delivered",
    });

    // images from multer (optional — customer can upload photos with review)
    const images = req.files ? req.files.map((f) => f.path) : [];

    const review = await Review.create({
      product: productId,
      user: req.user.id,
      rating,
      comment,
      images,
      isVerifiedPurchase: !!hasPurchased,
    });

    // update the product's average rating after adding the new review
    await updateProductRating(product._id);

    await review.populate("user", "name avatar");

    return successResponse(res, "Review submitted", { review }, 201);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// GET /api/products/:productId/reviews
export const getProductReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, rating } = req.query;
    const filter = { product: req.params.productId };
    if (rating) filter.rating = Number(rating);

    const skip = (Number(page) - 1) * Number(limit);

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate("user", "name avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Review.countDocuments(filter),
    ]);

    // rating breakdown e.g. { 5: 40, 4: 10, 3: 5, 2: 2, 1: 1 }
    const breakdown = await Review.aggregate([
      { $match: { product: reviews[0]?.product } },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
    ]);

    return successResponse(res, "Reviews fetched", {
      reviews,
      breakdown,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// DELETE /api/reviews/:id
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!review) return errorResponse(res, "Review not found", 404);

    const productId = review.product;
    await review.deleteOne();

    // recalculate rating now that review is removed
    await updateProductRating(productId);

    return successResponse(res, "Review deleted");
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
