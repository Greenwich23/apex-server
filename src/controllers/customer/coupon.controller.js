import Coupon from "../../models/Coupon.js";
import CouponUsage from "../../models/CouponUsage.js";
import Cart from "../../models/Cart.js";
import Order from "../../models/Order.js";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";

// POST /api/coupons/validate
// call this when customer types in a coupon code before checkout
export const validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (!coupon) {
      return errorResponse(res, "Invalid or expired coupon code", 400);
    }

    // check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return errorResponse(res, "This coupon has reached its usage limit", 400);
    }

    // check per-user limit
    const userUsageCount = await CouponUsage.countDocuments({
      coupon: coupon._id,
      user: req.user.id,
    });

    if (userUsageCount >= coupon.perUserLimit) {
      return errorResponse(res, "You have already used this coupon", 400);
    }

    // check first-time-only restriction
    if (coupon.isFirstTimeOnly) {
      const previousOrders = await Order.countDocuments({ user: req.user.id });
      if (previousOrders > 0) {
        return errorResponse(res, "This coupon is for first-time buyers only", 400);
      }
    }

    return successResponse(res, "Coupon is valid", {
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        minOrderAmount: coupon.minOrderAmount,
        maxDiscount: coupon.maxDiscount,
      },
    });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// POST /api/coupons/apply
// attaches the coupon to the user's cart
export const applyCoupon = async (req, res) => {
  try {
    const { code } = req.body;

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (!coupon) return errorResponse(res, "Invalid or expired coupon code", 400);

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart || cart.items.length === 0) {
      return errorResponse(res, "Your cart is empty", 400);
    }

    cart.couponApplied = coupon._id;
    await cart.save();

    return successResponse(res, "Coupon applied to cart", {
      couponCode: coupon.code,
    });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// DELETE /api/coupons/remove
export const removeCoupon = async (req, res) => {
  try {
    await Cart.findOneAndUpdate(
      { user: req.user.id },
      { couponApplied: null }
    );

    return successResponse(res, "Coupon removed from cart");
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
