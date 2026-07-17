// models/DeliveryAgent.js
import mongoose, { Schema } from "mongoose";

const deliveryAgentSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    photo: {
      type: String,
      default: null,
    },
    vehicleType: {
      type: String,
      enum: ["bike", "car", "van", "truck"],
      default: "bike",
    },
    vehicleNumber: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "busy"],
      default: "active",
    },
    currentLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    totalDeliveries: {
      type: Number,
      default: 0,
    },
    assignedOrders: [
      {
        type: Schema.Types.ObjectId,
        ref: "Order",
      },
    ],
    completedOrders: [
      {
        type: Schema.Types.ObjectId,
        ref: "Order",
      },
    ],
    photo: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

// Create geospatial index for location queries
deliveryAgentSchema.index({ currentLocation: "2dsphere" });

const DeliveryAgent = mongoose.model("DeliveryAgent", deliveryAgentSchema);
export default DeliveryAgent;
