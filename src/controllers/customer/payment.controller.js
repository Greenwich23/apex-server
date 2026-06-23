import Stripe from "stripe";
import Razorpay from "razorpay";
import crypto from "crypto";
import Order from "../../models/Order.js";
import Payment from "../../models/Payment.js";
import ShipmentTracking from "../../models/ShipmentTracking.js";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";
import logger from "../../utils/logger.js";

// ─── provider instances ───────────────────────────────────────────────────────

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─── helper: mark order and payment as paid ───────────────────────────────────

const confirmPayment = async (orderId, providerPaymentId, provider) => {
  await Order.findByIdAndUpdate(orderId, {
    paymentStatus: "paid",
    orderStatus: "confirmed",
  });

  await Payment.findOneAndUpdate(
    { order: orderId },
    {
      status: "completed",
      providerPaymentId,
      provider,
    }
  );

  await ShipmentTracking.findOneAndUpdate(
    { order: orderId },
    {
      currentStatus: "confirmed",
      $push: {
        events: {
          status: "confirmed",
          description: "Payment confirmed. Order is being prepared.",
          timestamp: new Date(),
        },
      },
    }
  );
};

// ─── STRIPE ───────────────────────────────────────────────────────────────────

// POST /api/payments/stripe/create-intent
// call this right before the customer enters their card details
export const createStripePaymentIntent = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findOne({ _id: orderId, user: req.user.id });
    if (!order) return errorResponse(res, "Order not found", 404);

    if (order.paymentStatus === "paid") {
      return errorResponse(res, "This order has already been paid", 400);
    }

    // create a PaymentIntent on Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total * 100), // Stripe uses smallest currency unit (kobo for NGN)
      currency: process.env.CURRENCY || "ngn",
      metadata: {
        orderId: order._id.toString(),
        userId: req.user.id.toString(),
      },
    });

    // record a pending payment
    await Payment.create({
      order: order._id,
      user: req.user.id,
      provider: "stripe",
      providerPaymentId: paymentIntent.id,
      amount: order.total,
      currency: process.env.CURRENCY || "NGN",
      status: "pending",
    });

    return successResponse(res, "Stripe payment intent created", {
      clientSecret: paymentIntent.client_secret, // sent to frontend to complete payment
    });
  } catch (error) {
    logger.error("Stripe createIntent error", error);
    return errorResponse(res, error.message);
  }
};

// POST /api/payments/stripe/webhook
// Stripe calls this URL when a payment succeeds or fails
// IMPORTANT: this route must use raw body — see app.js note below
export const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body, // must be raw Buffer — NOT parsed JSON
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    logger.error("Stripe webhook signature error", error);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object;
      const orderId = intent.metadata.orderId;
      await confirmPayment(orderId, intent.id, "stripe");
      logger.info(`Stripe payment confirmed for order ${orderId}`);
    }

    if (event.type === "payment_intent.payment_failed") {
      const intent = event.data.object;
      const orderId = intent.metadata.orderId;
      await Payment.findOneAndUpdate(
        { order: orderId },
        { status: "failed" }
      );
      logger.warn(`Stripe payment failed for order ${orderId}`);
    }

    // always return 200 to Stripe immediately — even if our code errored
    // otherwise Stripe will keep retrying the webhook
    return res.status(200).json({ received: true });
  } catch (error) {
    logger.error("Stripe webhook handler error", error);
    return res.status(200).json({ received: true }); // still 200 so Stripe doesn't retry
  }
};

// ─── RAZORPAY ────────────────────────────────────────────────────────────────

// POST /api/payments/razorpay/create-order
export const createRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findOne({ _id: orderId, user: req.user.id });
    if (!order) return errorResponse(res, "Order not found", 404);

    if (order.paymentStatus === "paid") {
      return errorResponse(res, "This order has already been paid", 400);
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.total * 100), // paise
      currency: process.env.CURRENCY || "INR",
      receipt: order._id.toString(),
      notes: {
        orderId: order._id.toString(),
        userId: req.user.id.toString(),
      },
    });

    await Payment.create({
      order: order._id,
      user: req.user.id,
      provider: "razorpay",
      providerPaymentId: razorpayOrder.id,
      amount: order.total,
      currency: process.env.CURRENCY || "INR",
      status: "pending",
    });

    return successResponse(res, "Razorpay order created", {
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID, // frontend needs this to open the checkout
    });
  } catch (error) {
    logger.error("Razorpay createOrder error", error);
    return errorResponse(res, error.message);
  }
};

// POST /api/payments/razorpay/verify
// Razorpay doesn't use webhooks for basic integration — the frontend
// sends back the payment details and we verify the signature here
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      orderId,                 // our Order _id
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    // verify the signature to make sure the payment wasn't tampered with
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return errorResponse(res, "Payment verification failed. Invalid signature.", 400);
    }

    await confirmPayment(orderId, razorpay_payment_id, "razorpay");

    return successResponse(res, "Payment verified successfully");
  } catch (error) {
    logger.error("Razorpay verify error", error);
    return errorResponse(res, error.message);
  }
};

// ─── COD ──────────────────────────────────────────────────────────────────────

// POST /api/payments/cod/confirm
// For cash on delivery — just create the payment record, no provider needed
export const confirmCodOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findOne({ _id: orderId, user: req.user.id });
    if (!order) return errorResponse(res, "Order not found", 404);

    if (order.paymentMethod !== "cod") {
      return errorResponse(res, "This order is not a COD order", 400);
    }

    // COD payment is pending until delivery — just confirm the order
    await Order.findByIdAndUpdate(orderId, {
      orderStatus: "confirmed",
      // paymentStatus stays "pending" until delivered
    });

    await Payment.create({
      order: order._id,
      user: req.user.id,
      provider: "cod",
      amount: order.total,
      currency: "NGN",
      status: "pending", // will be updated to "completed" when admin marks as delivered
    });

    await ShipmentTracking.findOneAndUpdate(
      { order: order._id },
      {
        currentStatus: "confirmed",
        $push: {
          events: {
            status: "confirmed",
            description: "COD order confirmed. Payment will be collected on delivery.",
            timestamp: new Date(),
          },
        },
      }
    );

    return successResponse(res, "COD order confirmed successfully");
  } catch (error) {
    logger.error("COD confirm error", error);
    return errorResponse(res, error.message);
  }
};

// ─── GET PAYMENT STATUS ───────────────────────────────────────────────────────

// GET /api/payments/:orderId
export const getPaymentStatus = async (req, res) => {
  try {
    const payment = await Payment.findOne({
      order: req.params.orderId,
      user: req.user.id,
    });

    if (!payment) return errorResponse(res, "Payment record not found", 404);

    return successResponse(res, "Payment status fetched", { payment });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
