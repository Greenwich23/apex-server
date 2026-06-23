import express from "express";
import {
  getProducts,
  getProductBySlug,
  getSearchSuggestions,
  getRelatedProducts,
  getFeaturedProducts,
} from "../../controllers/customer/product.controller.js";
import {
  createReview,
  getProductReviews,
  deleteReview,
} from "../../controllers/customer/review.controller.js";
import protect from "../../middleware/auth.js";
import { uploadReviewImages } from "../../middleware/upload.js";
import {
  validate,
  reviewValidation,
} from "../../middleware/validateRequest.js";

const router = express.Router();

// public routes — no login needed to browse
router.get("/", getProducts);
router.get("/featured", getFeaturedProducts);
router.get("/search/suggestions", getSearchSuggestions);
router.get("/:id/related", getRelatedProducts);
router.get("/:productId/reviews", getProductReviews);

// slug must come last — otherwise "featured" and "search" would be caught as slugs
router.get("/:slug", getProductBySlug);

// protected routes — must be logged in
router.post(
  "/:productId/reviews",
  protect,
  uploadReviewImages,
  reviewValidation,
  validate,
  createReview,
);
router.delete("/reviews/:id", protect, deleteReview);

export default router;
