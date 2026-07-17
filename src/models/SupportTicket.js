// models/Ticket.js
import mongoose, { Schema } from "mongoose";

// models/Ticket.js - Updated messageSchema

const messageSchema = new Schema({
  sender: {
    type: Schema.Types.Mixed, // ✅ Allows both ObjectId and string
    // required: true,
  },
  senderName: {
    type: String,
    // required: true,
  },
  senderRole: {
    type: String,
    enum: ["customer", "admin"],
    // required: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ticketSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    category: {
      type: String,
      enum: ["delivery", "product", "payment", "return", "account", "general"],
      default: "general",
    },

    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    messages: [messageSchema],

    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    closedAt: {
      type: Date,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Indexes
ticketSchema.index({ user: 1, status: 1 });
ticketSchema.index({ status: 1, priority: 1 });
ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ isActive: 1 });

const Ticket = mongoose.model("Ticket", ticketSchema);
export default Ticket;
