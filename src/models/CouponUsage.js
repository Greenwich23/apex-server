import mongoose, { Schema } from "mongoose";

const couponUsageSchema = new Schema(
  {
    coupon: {
      type: Schema.Types.ObjectId,
      ref: "Coupon",
      required: true,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    code: {
      type: String,
      // required: true,
      uppercase: true,
    },

    discountAmount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

const CouponUsage = mongoose.model("CouponUsage", couponUsageSchema);

export default CouponUsage;
