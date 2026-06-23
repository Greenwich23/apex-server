import mongoose, { Schema } from "mongoose";

const paymentSchema = new Schema(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    provider: {
      type: String,
      enum: ["stripe", "razorpay", "paypal", "cod"],
      required: true,
    },

    providerPaymentId: {
      type: String, // the ID returned by stripe/razorpay/paypal
      default: null,
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "NGN",
    },

    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },

    refundedAt: {
      type: Date,
      default: null,
    },

    metadata: {
      type: Schema.Types.Mixed, // store raw provider webhook payload
      default: {},
    },
  },
  { timestamps: true },
);

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
