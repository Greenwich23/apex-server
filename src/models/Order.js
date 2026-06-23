import mongoose, { Schema } from "mongoose";

const orderItemSchema = new Schema({
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

  name: { type: String, required: true }, // snapshot in case product changes
  image: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
});

const orderSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [orderItemSchema],

    shippingAddress: {
      fullName: String,
      phone: String,
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      // stored as a copy — not a ref — so address changes don't affect past orders
    },

    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    total: { type: Number, required: true },

    coupon: {
      type: Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
    },

    loyaltyPointsUsed: {
      type: Number,
      default: 0,
    },

    paymentMethod: {
      type: String,
      enum: ["card", "paypal", "razorpay", "stripe", "upi", "cod"],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    orderStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
      ],
      default: "pending",
    },

    deliveryPreference: {
      type: String,
      enum: ["standard", "express"],
      default: "standard",
    },

    trackingNumber: {
      type: String,
      default: null,
    },

    courierProvider: {
      type: String,
      default: null, // e.g. "DHL", "FedEx"
    },

    estimatedDelivery: {
      type: Date,
      default: null,
    },

    specialInstructions: {
      type: String,
      default: null,
    },

    deliveredAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
