import mongoose, { Schema } from "mongoose";

// each individual status event in the journey
const trackingEventSchema = new Schema({
  status: {
    type: String,
    enum: [
      "order_placed",
      "confirmed",
      "processing",
      "packed",
      "handed_to_courier",
      "in_transit",
      "out_for_delivery",
      "delivered",
      "delivery_attempted",
      "returned_to_sender",
      "cancelled",
    ],
    required: true,
  },

  description: {
    type: String,
    trim: true,
    // e.g. "Your order has been picked up by DHL"
  },

  location: {
    type: String,
    trim: true,
    // e.g. "Lagos Sorting Centre"
    default: null,
  },

  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const shipmentTrackingSchema = new Schema(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true, // one tracking record per order
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    trackingNumber: {
      type: String,
      trim: true,
      default: null,
      // assigned by the courier company e.g. "DHL1234567890"
    },

    courierProvider: {
      type: String,
      trim: true,
      default: null,
      // e.g. "DHL", "FedEx", "GIG Logistics"
    },

    courierTrackingUrl: {
      type: String,
      default: null,
      // direct link to courier's own tracking page
      // e.g. "https://www.dhl.com/track?id=DHL1234567890"
    },

    currentStatus: {
      type: String,
      enum: [
        "order_placed",
        "confirmed",
        "processing",
        "packed",
        "handed_to_courier",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "delivery_attempted",
        "returned_to_sender",
        "cancelled",
      ],
      default: "order_placed",
    },

    estimatedDelivery: {
      type: Date,
      default: null,
    },

    deliveredAt: {
      type: Date,
      default: null,
    },

    // full history of every status change
    events: [trackingEventSchema],

    // for bulky items like treadmills that need installation
    requiresInstallation: {
      type: Boolean,
      default: false,
    },

    installationScheduled: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

const ShipmentTracking = mongoose.model(
  "ShipmentTracking",
  shipmentTrackingSchema,
);
export default ShipmentTracking;
