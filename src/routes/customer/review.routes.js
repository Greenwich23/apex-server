import express from "express";
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

const router = express.Router({ mergeParams: true });
// mergeParams: true is important here — it lets this router
// access :productId from the parent route in product.routes.js

// GET /api/products/:productId/reviews — public, no login needed
router.get("/", getProductReviews);

// POST /api/products/:productId/reviews — must be logged in
router.post(
  "/",
  protect,
  uploadReviewImages,
  reviewValidation,
  validate,
  createReview,
);

// DELETE /api/reviews/:id — must be logged in
// this one is mounted separately in product.routes.js
// router.delete("/:reviewId", protect, deleteReview);

export default router;
