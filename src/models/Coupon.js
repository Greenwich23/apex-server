import mongoose, { Schema } from "mongoose";

const couponSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },

    value: {
      type: Number,
      required: true,
      min: 0, // percentage: 0-100, fixed: any positive number
    },

    minOrderAmount: {
      type: Number,
      default: 0, // minimum cart total to apply coupon
    },

    maxDiscount: {
      type: Number,
      default: null, // cap on percentage discounts e.g. max ₦5000 off
    },

    usageLimit: {
      type: Number,
      default: null, // null = unlimited
    },

    usageCount: {
      type: Number,
      default: 0,
    },

    perUserLimit: {
      type: Number,
      default: 1, // how many times one user can use this coupon
    },

    isFirstTimeOnly: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;
