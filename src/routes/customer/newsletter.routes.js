// routes/newsletter.routes.js
import express from "express";
import {
  subscribeToNewsletter,
  unsubscribeFromNewsletter,
  getSubscribers,
} from "../../controllers/customer/newsletter.controller.js";
import { protect, admin } from "../../middleware/auth.js";

const router = express.Router();

// Public routes
router.post("/subscribe", subscribeToNewsletter);
router.get("/unsubscribe/:email", unsubscribeFromNewsletter);

// Admin routes
router.get("/subscribers", protect, admin, getSubscribers);

export default router;
