import express from "express";
import {
  createStripePaymentIntent,
  stripeWebhook,
  createRazorpayOrder,
  verifyRazorpayPayment,
  confirmCodOrder,
  getPaymentStatus,
  initializePaystackPayment,
  verifyPaystackPayment,
  paystackWebhook,
} from "../../controllers/customer/payment.controller.js";
import protect from "../../middleware/auth.js";

const router = express.Router();

// ─── STRIPE ───────────────────────────────────────────────────────────────────

// Stripe webhook MUST use raw body — it needs to verify the signature
// So this route is defined BEFORE express.json() would normally run
// In app.js, register this route with express.raw() for the webhook path only
router.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }), // raw body for Stripe signature check
  stripeWebhook,
);

// all other payment routes require login
router.post("/stripe/create-intent", protect, createStripePaymentIntent);

// ─── RAZORPAY ─────────────────────────────────────────────────────────────────

router.post("/razorpay/create-order", protect, createRazorpayOrder);
router.post("/razorpay/verify", protect, verifyRazorpayPayment);

// -----PAYSTACK ------ //

router.post("/paystack/initialize", protect, initializePaystackPayment);

router.get("/paystack/verify/:reference", protect, verifyPaystackPayment);

router.post("/paystack/webhook", protect, paystackWebhook);
// ─── COD ──────────────────────────────────────────────────────────────────────

router.post("/cod/confirm", protect, confirmCodOrder);

// ─── STATUS ───────────────────────────────────────────────────────────────────

router.get("/:orderId", protect, getPaymentStatus);

export default router;
