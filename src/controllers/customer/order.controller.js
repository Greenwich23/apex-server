// controllers/order.controller.js
import Order from "../../models/Order.js";
import Cart from "../../models/Cart.js";
import Product from "../../models/Product.js";
import ProductVariant from "../../models/ProductVariant.js";
import Coupon from "../../models/Coupon.js";
import CouponUsage from "../../models/CouponUsage.js";
import User from "../../models/User.js";
import ShipmentTracking from "../../models/ShipmentTracking.js";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";
import { sendOrderConfirmationEmail } from "../../services/emailService.js";
import {
  notifyOrderPlaced,
  notifyPaymentSuccess,
  notifyPaymentFailed,
  notifyOrderCancelled,
} from "../../utils/notificationHelper.js";
import { notifyNewOrder } from "../../services/notificationService.js";

// Helper function to get order filter for both ID and order number formats
function getOrderFilter(id) {
  if (/^ORD-\d{6}$/.test(id)) {
    return { orderNumber: id };
  } else if (/^\d{6}$/.test(id)) {
    return { orderNumber: `ORD-${id}` };
  } else {
    return { _id: id };
  }
}

// POST /api/orders
export const createOrder = async (req, res) => {
  try {
    const {
      addressId,
      paymentMethod,
      deliveryPreference,
      specialInstructions,
      loyaltyPointsToUse = 0,
    } = req.body;

    const validPaymentMethods = [
      "card",
      "bank_transfer",
      "cod",
      "paystack",
      "flutterwave",
    ];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return errorResponse(
        res,
        `Invalid payment method: ${paymentMethod}`,
        400,
      );
    }

    // 1. get cart with populated items
    const cart = await Cart.findOne({ user: req.user.id })
      .populate("items.product")
      .populate("items.variant");

    if (!cart || cart.items.length === 0) {
      return errorResponse(res, "Your cart is empty", 400);
    }

    // 2. get the user's chosen shipping address
    const Address = (await import("../../models/Address.js")).default;
    const address = await Address.findOne({
      _id: addressId,
      user: req.user.id,
    });
    if (!address) return errorResponse(res, "Shipping address not found", 404);

    // 3. validate stock and build order items
    const orderItems = [];
    let subtotal = 0;

    for (const item of cart.items) {
      const product = item.product;

      if (!product.isActive) {
        return errorResponse(
          res,
          `${product.name} is no longer available`,
          400,
        );
      }

      const stock = item.variant ? item.variant.stock : product.stock;
      if (stock < item.quantity) {
        return errorResponse(res, `Not enough stock for ${product.name}`, 400);
      }

      const price = item.variant
        ? item.variant.discountPrice || item.variant.price
        : product.discountPrice || product.price;

      orderItems.push({
        product: product._id,
        variant: item.variant?._id || null,
        name: product.name,
        image: product.images[0]?.url || null,
        quantity: item.quantity,
        price,
      });

      subtotal += price * item.quantity;
    }

    // 4. Handle coupon
    let discount = 0;
    let couponId = null;
    let couponCode = null;

    if (cart.couponApplied) {
      let coupon;

      if (typeof cart.couponApplied === "object" && cart.couponApplied._id) {
        coupon = cart.couponApplied;

        const validCoupon = await Coupon.findOne({
          _id: coupon._id,
          isActive: true,
          expiresAt: { $gt: new Date() },
        });

        if (!validCoupon) {
          return errorResponse(
            res,
            "Coupon is no longer valid. Please remove it and try again.",
            400,
          );
        }

        if (
          validCoupon.minOrderAmount &&
          subtotal < validCoupon.minOrderAmount
        ) {
          return errorResponse(
            res,
            `Order must be at least ₦${validCoupon.minOrderAmount} to use this coupon`,
            400,
          );
        }

        if (validCoupon.type === "percentage") {
          discount = (subtotal * validCoupon.value) / 100;
          if (validCoupon.maxDiscount) {
            discount = Math.min(discount, validCoupon.maxDiscount);
          }
        } else {
          discount = validCoupon.value;
        }

        couponId = validCoupon._id;
        couponCode = validCoupon.code;
      } else {
        const validCoupon = await Coupon.findOne({
          _id: cart.couponApplied,
          isActive: true,
          expiresAt: { $gt: new Date() },
        });

        if (!validCoupon) {
          return errorResponse(
            res,
            "Coupon is no longer valid. Please remove it and try again.",
            400,
          );
        }

        if (
          validCoupon.minOrderAmount &&
          subtotal < validCoupon.minOrderAmount
        ) {
          return errorResponse(
            res,
            `Order must be at least ₦${validCoupon.minOrderAmount} to use this coupon`,
            400,
          );
        }

        if (validCoupon.type === "percentage") {
          discount = (subtotal * validCoupon.value) / 100;
          if (validCoupon.maxDiscount) {
            discount = Math.min(discount, validCoupon.maxDiscount);
          }
        } else {
          discount = validCoupon.value;
        }

        couponId = validCoupon._id;
        couponCode = validCoupon.code;
      }
    }

    // 5. loyalty points
    const user = await User.findById(req.user.id);
    let pointsDiscount = 0;

    if (loyaltyPointsToUse > 0) {
      if (loyaltyPointsToUse > user.loyaltyPoints) {
        return errorResponse(res, "Not enough loyalty points", 400);
      }
      pointsDiscount = loyaltyPointsToUse;
    }

    // ✅ Calculate shipping fee - Fixed ₦5,000 or FREE for orders above ₦500,000
    const subtotalAfterDiscount = subtotal - discount - pointsDiscount;
    const shippingFee = subtotalAfterDiscount > 500000 ? 0 : 5000;

    // ✅ Log shipping calculation for debugging
    console.log("🔍 [Shipping] Subtotal:", subtotal);
    console.log("🔍 [Shipping] Discount:", discount);
    console.log("🔍 [Shipping] Points Discount:", pointsDiscount);
    console.log(
      "🔍 [Shipping] Subtotal after discount:",
      subtotalAfterDiscount,
    );
    console.log(
      "🔍 [Shipping] Free shipping?:",
      subtotalAfterDiscount > 500000,
    );
    console.log("🔍 [Shipping] Shipping fee:", shippingFee);

    const total = Math.max(0, subtotalAfterDiscount + shippingFee);

    // 6. create the order (orderNumber will be auto-generated by pre-save hook)
    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      shippingAddress: {
        fullName: address.fullName,
        phone: address.phone,
        street: address.street,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        country: address.country,
      },
      subtotal,
      discount,
      shippingFee,
      total,
      coupon: couponId,
      couponCode: couponCode,
      couponDiscount: discount,
      loyaltyPointsUsed: loyaltyPointsToUse,
      paymentMethod,
      deliveryPreference: "standard", // ✅ Always standard now
      specialInstructions,
    });

    // 7. deduct stock
    for (const item of cart.items) {
      if (item.variant) {
        await ProductVariant.findByIdAndUpdate(item.variant._id, {
          $inc: { stock: -item.quantity },
        });
      } else {
        await Product.findByIdAndUpdate(item.product._id, {
          $inc: { stock: -item.quantity },
        });
      }
    }

    // 8. deduct loyalty points and earn new ones
    if (loyaltyPointsToUse > 0) {
      user.loyaltyPoints -= loyaltyPointsToUse;
    }
    user.loyaltyPoints += Math.floor(total / 100);
    await user.save();

    // 9. record coupon usage
    if (couponId) {
      await CouponUsage.create({
        coupon: couponId,
        user: req.user.id,
        order: order._id,
        discountAmount: discount,
      });
      await Coupon.findByIdAndUpdate(couponId, { $inc: { usageCount: 1 } });
    }

    // 10. create shipment tracking record
    await ShipmentTracking.create({
      order: order._id,
      user: req.user.id,
      currentStatus: "order_placed",
      events: [
        {
          status: "order_placed",
          description: "Your order has been placed successfully",
          timestamp: new Date(),
        },
      ],
    });

    // 11. clear the cart
    await Cart.findOneAndUpdate(
      { user: req.user.id },
      { items: [], couponApplied: null },
    );

    // 12. Send order confirmation email (non-blocking)
    try {
      await sendOrderConfirmationEmail(order, user);
      console.log(`📧 Order confirmation email sent to ${user.email}`);
    } catch (emailError) {
      console.error("⚠️ Email notification failed:", emailError);
    }

    // 13. Create notifications (non-blocking - fire and forget)
    console.log("🔔 [DEBUG] About to create notifications for order:", {
      orderId: order._id,
      orderNumber: order.orderNumber,
      userId: user._id,
      userEmail: user.email,
      paymentMethod: paymentMethod,
      shippingFee: shippingFee,
      total: total,
    });

    // Order placed notification
    console.log("🔔 [DEBUG] Calling notifyOrderPlaced...");
    notifyOrderPlaced(order, user).catch((err) => {
      console.error("❌ [DEBUG] Failed to create order notification:", err);
    });

    // Payment success notification (skip for COD)
    if (paymentMethod !== "cod") {
      console.log("🔔 [DEBUG] Calling notifyPaymentSuccess...");
      notifyPaymentSuccess(order, user).catch((err) => {
        console.error("❌ [DEBUG] Failed to create payment notification:", err);
      });
    } else {
      console.log("🔔 [DEBUG] Skipping payment notification for COD");
    }

    console.log("🔔 [DEBUG] Notification calls completed");

    return successResponse(res, "Order placed successfully", { order }, 201);
  } catch (error) {
    console.error("❌ Error creating order:", error);
    return errorResponse(res, error.message);
  }
};

// GET /api/orders
export const getOrderHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const filter = { user: req.user.id };

    if (status) filter.orderStatus = status;

    // Search by order number - support both formats
    if (search && typeof search === "string") {
      const searchTerm = search.trim();
      if (/^ORD-\d{6}$/.test(searchTerm)) {
        filter.orderNumber = searchTerm;
      } else if (/^\d{6}$/.test(searchTerm)) {
        filter.orderNumber = `ORD-${searchTerm}`;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select("-__v"),
      Order.countDocuments(filter),
    ]);

    return successResponse(res, "Orders fetched", {
      orders,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// GET /api/orders/:id
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const filter = {
      ...getOrderFilter(id),
      user: req.user.id,
    };

    const order = await Order.findOne(filter).populate(
      "items.product",
      "name images slug",
    );

    if (!order) return errorResponse(res, "Order not found", 404);

    const tracking = await ShipmentTracking.findOne({ order: order._id });

    return successResponse(res, "Order fetched", { order, tracking });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// POST /api/orders/:id/reorder
export const reorder = async (req, res) => {
  try {
    const { id } = req.params;
    const filter = {
      ...getOrderFilter(id),
      user: req.user.id,
    };

    const order = await Order.findOne(filter);
    if (!order) return errorResponse(res, "Order not found", 404);

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    for (const item of order.items) {
      const product = await Product.findOne({
        _id: item.product,
        isActive: true,
      });
      if (!product || product.stock < 1) continue;

      const existing = cart.items.findIndex(
        (i) => i.product.toString() === item.product.toString(),
      );

      if (existing >= 0) {
        cart.items[existing].quantity += item.quantity;
      } else {
        cart.items.push({
          product: item.product,
          variant: item.variant || null,
          quantity: item.quantity,
          price: product.discountPrice || product.price,
        });
      }
    }

    await cart.save();

    return successResponse(res, "Items added to cart", { cart });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// POST /api/orders/:id/cancel
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const filter = {
      ...getOrderFilter(id),
      user: req.user.id,
    };

    const order = await Order.findOne(filter);
    if (!order) return errorResponse(res, "Order not found", 404);

    const cancellableStatuses = ["pending", "confirmed"];
    if (!cancellableStatuses.includes(order.orderStatus)) {
      return errorResponse(res, "This order can no longer be cancelled", 400);
    }

    order.orderStatus = "cancelled";
    await order.save();

    // restore stock
    for (const item of order.items) {
      if (item.variant) {
        await ProductVariant.findByIdAndUpdate(item.variant, {
          $inc: { stock: item.quantity },
        });
      } else {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }
    }

    // update tracking
    await ShipmentTracking.findOneAndUpdate(
      { order: order._id },
      {
        currentStatus: "cancelled",
        $push: {
          events: {
            status: "cancelled",
            description: "Order cancelled by customer",
            timestamp: new Date(),
          },
        },
      },
    );

    // Send cancellation notification
    const user = await User.findById(order.user);
    if (user) {
      notifyOrderCancelled(order, user).catch((err) =>
        console.error("⚠️ Failed to create cancellation notification:", err),
      );
    }

    return successResponse(res, "Order cancelled successfully", { order });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// GET /api/orders/track/:orderNumber - Public route for tracking orders without login
export const trackOrderByNumber = async (req, res) => {
  try {
    const { orderNumber } = req.params;

    let formattedNumber = orderNumber;
    // If it's just digits, add ORD- prefix
    if (/^\d{6}$/.test(orderNumber)) {
      formattedNumber = `ORD-${orderNumber}`;
    } else if (!orderNumber.startsWith("ORD-")) {
      // If it has some other format, still try to add ORD- if it's digits
      const digits = orderNumber.replace(/\D/g, "");
      if (digits.length >= 6) {
        formattedNumber = `ORD-${digits.slice(0, 6)}`;
      }
    }

    const order = await Order.findOne({
      orderNumber: formattedNumber,
    }).populate("items.product", "name images");

    if (!order) {
      return errorResponse(res, "Order not found", 404);
    }

    const tracking = await ShipmentTracking.findOne({ order: order._id });

    // Only return limited info for guest tracking
    return successResponse(res, "Order tracked", {
      order: {
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        createdAt: order.createdAt,
        estimatedDelivery: order.estimatedDelivery,
        items: order.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          image: item.image,
        })),
        tracking: tracking
          ? {
              currentStatus: tracking.currentStatus,
              events: tracking.events,
              courierProvider: tracking.courierProvider,
              trackingNumber: tracking.trackingNumber,
            }
          : null,
      },
    });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
