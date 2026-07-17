// models/Notification.js
import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    type: {
      type: String,
      enum: [
        "order", // New order
        "customer", // New customer
        "payment", // New payment
        "return", // New return request
        "delivery", // Delivery update
        "review", // New review
        "support", // New support ticket
        "refund", // Refund processed
        "system", // System notification
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    link: {
      type: String,
      default: null,
    },
    icon: {
      type: String,
      default: "🔔",
    },
    color: {
      type: String,
      default: "#3B82F6",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: true,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    readAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// Index for efficient queries
notificationSchema.index({ isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
