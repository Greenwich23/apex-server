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
  name: { type: String, required: true },
  image: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
});

const orderSchema = new Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      index: true,
    },
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
    couponCode: {
      type: String,
      default: null,
    },
    couponDiscount: {
      type: Number,
      default: 0,
    },
    loyaltyPointsUsed: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: [
        "card",
        "paypal",
        "razorpay",
        "stripe",
        "upi",
        "cod",
        "paystack",
        "flutterwave",
        "bank_transfer",
      ],
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
        "refunded",
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
      default: null,
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
    deliveryAgent: {
      type: Schema.Types.ObjectId,
      ref: "DeliveryAgent",
      default: null,
    },
    deliveryToken: {
      type: String,
      unique: true,
      sparse: true,
    },
    deliveryStatus: {
      type: String,
      enum: [
        "pending",
        "assigned",
        "picked_up",
        "in_transit",
        "delivered",
        "failed",
        "pending_verification",
      ],
      default: "pending",
    },
    deliveryNotes: {
      type: String,
      default: null,
    },
    deliveryProof: {
      type: String,
      default: null,
    },
    assignedAt: {
      type: Date,
      default: null,
    },
    pickedUpAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// Helper function to generate unique 6-digit order number
async function generateUniqueOrderNumber() {
  const Order = mongoose.model("Order");
  let orderNumber;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    const num = Math.floor(100000 + Math.random() * 900000);
    orderNumber = `ORD-${num}`;

    const existing = await Order.findOne({ orderNumber });
    if (!existing) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    const timestamp = Date.now().toString().slice(-6);
    orderNumber = `ORD-${timestamp}`;
  }

  return orderNumber;
}

// ✅ FIXED: Correct pre-save hook - don't use next with async
orderSchema.pre("save", async function () {
  if (!this.orderNumber) {
    this.orderNumber = await generateUniqueOrderNumber();
  }
});

const Order = mongoose.model("Order", orderSchema);
export default Order;
