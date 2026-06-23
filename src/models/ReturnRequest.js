import mongoose, { Schema } from "mongoose";

const returnRequestSchema = new Schema(
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

    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, required: true },
        reason: { type: String, required: true },
      },
    ],

    type: {
      type: String,
      enum: ["return", "refund", "exchange"],
      required: true,
    },

    reason: {
      type: String,
      required: [true, "Reason is required"],
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "refunded", "completed"],
      default: "pending",
    },

    images: {
      type: [String], // photos of damaged item
      default: [],
    },

    adminNote: {
      type: String,
      default: null,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

const ReturnRequest = mongoose.model("ReturnRequest", returnRequestSchema);
export default ReturnRequest;
