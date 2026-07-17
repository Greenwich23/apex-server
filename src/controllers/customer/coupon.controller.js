// controllers/customer/coupon.controller.js
import Coupon from "../../models/Coupon.js";
import CouponUsage from "../../models/CouponUsage.js";
import Cart from "../../models/Cart.js";
import Order from "../../models/Order.js";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";

// ─── POST /api/coupons/apply ──────────────────────────────────────────────────
export const applyCoupon = async (req, res) => {
  try {
    const { code } = req.body;

    console.log("🔍 [applyCoupon] Applying code:", code);

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (!coupon) {
      console.log("❌ [applyCoupon] Coupon not found");
      return errorResponse(res, "Invalid or expired coupon code", 400);
    }

    console.log("✅ [applyCoupon] Coupon found:", coupon.code);

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart || cart.items.length === 0) {
      return errorResponse(res, "Your cart is empty", 400);
    }

    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    console.log("📦 [applyCoupon] Subtotal:", subtotal);

    if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
      return errorResponse(
        res,
        `Minimum order amount of ₦${coupon.minOrderAmount} required for this coupon`,
        400,
      );
    }

    let discountAmount = 0;
    if (coupon.type === "percentage") {
      discountAmount = (subtotal * coupon.value) / 100;
      if (coupon.maxDiscount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscount);
      }
    } else {
      discountAmount = Math.min(coupon.value, subtotal);
    }

    discountAmount = Math.round(discountAmount * 100) / 100;
    console.log("💰 [applyCoupon] Discount amount:", discountAmount);

    // ✅ Store the FULL coupon object directly in the cart
    cart.couponApplied = {
      _id: coupon._id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discountAmount: discountAmount,
      maxDiscount: coupon.maxDiscount,
      minOrderAmount: coupon.minOrderAmount,
      expiresAt: coupon.expiresAt,
      isActive: coupon.isActive,
    };

    cart.discount = discountAmount;
    await cart.save();

    console.log("✅ [applyCoupon] Cart saved with coupon:", cart.couponApplied);

    await cart.populate("items.product items.variant");

    console.log("✅ [applyCoupon] Cart after save:", {
      couponApplied: cart.couponApplied,
      discount: cart.discount,
    });

    return successResponse(res, "Coupon applied successfully", {
      cart,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discountAmount: discountAmount,
        maxDiscount: coupon.maxDiscount,
        minOrderAmount: coupon.minOrderAmount,
      },
    });
  } catch (error) {
    console.error("❌ [applyCoupon] Error:", error);
    return errorResponse(res, error.message);
  }
};

// ─── POST /api/coupons/validate ──────────────────────────────────────────────
export const validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;

    console.log("🔍 [validateCoupon] Validating code:", code);

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (!coupon) {
      console.log("❌ [validateCoupon] Coupon not found");
      return errorResponse(res, "Invalid or expired coupon code", 400);
    }

    console.log("✅ [validateCoupon] Coupon found:", coupon.code);

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return errorResponse(res, "This coupon has reached its usage limit", 400);
    }

    const userUsageCount = await CouponUsage.countDocuments({
      coupon: coupon._id,
      user: req.user.id,
    });

    if (userUsageCount >= coupon.perUserLimit) {
      return errorResponse(res, "You have already used this coupon", 400);
    }

    if (coupon.isFirstTimeOnly) {
      const previousOrders = await Order.countDocuments({ user: req.user.id });
      if (previousOrders > 0) {
        return errorResponse(
          res,
          "This coupon is for first-time buyers only",
          400,
        );
      }
    }

    const cart = await Cart.findOne({ user: req.user.id });
    let subtotal = 0;
    if (cart) {
      subtotal = cart.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
    }

    let discountAmount = 0;
    if (coupon.type === "percentage") {
      discountAmount = (subtotal * coupon.value) / 100;
      if (coupon.maxDiscount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscount);
      }
    } else {
      discountAmount = Math.min(coupon.value, subtotal);
    }

    return successResponse(res, "Coupon is valid", {
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        minOrderAmount: coupon.minOrderAmount,
        maxDiscount: coupon.maxDiscount,
        expiresAt: coupon.expiresAt,
        isActive: coupon.isActive,
        discountAmount: discountAmount,
      },
    });
  } catch (error) {
    console.error("❌ [validateCoupon] Error:", error);
    return errorResponse(res, error.message);
  }
};

// ─── DELETE /api/coupons/remove ──────────────────────────────────────────────
export const removeCoupon = async (req, res) => {
  try {
    console.log("🔍 [removeCoupon] Removing coupon from cart");

    const cart = await Cart.findOneAndUpdate(
      { user: req.user.id },
      { couponApplied: null, discount: 0 },
      { new: true },
    );

    console.log("✅ [removeCoupon] Coupon removed");

    return successResponse(res, "Coupon removed from cart", { cart });
  } catch (error) {
    console.error("❌ [removeCoupon] Error:", error);
    return errorResponse(res, error.message);
  }
};
