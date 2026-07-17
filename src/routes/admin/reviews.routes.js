// routes/admin/review.routes.js
import express from "express";
import { getAllReviews } from "../../controllers/admin/reviews.admin.controller.js";
import { protect, admin } from "../../middleware/auth.js";

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(admin);

// GET /api/admin/reviews - Get all reviews
router.get("/", getAllReviews);

export default router;
