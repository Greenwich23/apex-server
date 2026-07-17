// models/ReturnRequest.js
import mongoose, { Schema } from "mongoose";

const returnRequestSchema = new Schema(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        variant: {
          type: Schema.Types.ObjectId,
          ref: "ProductVariant",
          default: null,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
          default: 1,
        },
        condition: {
          type: String,
          enum: ["unused_with_tags", "unused_no_tags", "opened_tried"],
          default: "opened_tried",
        },
        reason: {
          type: String,
          default: "",
        },
      },
    ],
    type: {
      type: String,
      enum: ["refund", "exchange"],
      required: true,
    },
    reason: {
      type: String,
      required: [true, "Reason is required"],
      trim: true,
    },
    returnMethod: {
      type: String,
      enum: ["dropoff", "home_pickup"],
    },
    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
        "refunded",
        "completed",
        "cancelled",
        "returned",
        "pickup_assigned", // New: Driver assigned for pickup
        "picked_up", // New: Driver picked up the item
        "received", // New: Admin received the item
      ],
      default: "pending",
    },
    pickupAgent: {
      type: Schema.Types.ObjectId,
      ref: "DeliveryAgent",
      default: null,
    },
    pickupAssignedAt: {
      type: Date,
      default: null,
    },
    pickedUpAt: {
      type: Date,
      default: null,
    },
    receivedAt: {
      type: Date,
      default: null,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    refundId: {
      type: String,
      default: null,
    },
    refundDate: {
      type: Date,
      default: null,
    },
    images: {
      type: [String],
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
    pickupToken: {
      type: String,
      default: null,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true },
);

const ReturnRequest = mongoose.model("ReturnRequest", returnRequestSchema);
export default ReturnRequest;
