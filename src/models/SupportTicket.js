import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema({
  sender: {
    type: String,
    enum: ["customer", "admin"],
    required: true,
  },
  message: { type: String, required: true },
  sentAt: { type: Date, default: Date.now },
});

const supportTicketSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      default: null, // not all tickets are order-related
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: ["delivery", "product", "payment", "return", "other"],
      default: "other",
    },

    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    messages: [messageSchema],

    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

const SupportTicket = mongoose.model("SupportTicket", supportTicketSchema);
export default SupportTicket;
