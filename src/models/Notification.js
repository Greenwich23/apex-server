import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ["order", "delivery", "promotion", "return", "general"],
      default: "general",
    },

    channel: {
      type: String,
      enum: ["email", "sms", "push", "in_app"],
      default: "in_app",
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    link: {
      type: String, // e.g. "/orders/abc123" to deep link from notification
      default: null,
    },
  },
  { timestamps: true },
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
