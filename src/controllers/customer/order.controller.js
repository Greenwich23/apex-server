import Order from "../../models/Order.js";
import Cart from "../../models/Cart.js";
import Product from "../../models/Product.js";
import ProductVariant from "../../models/ProductVariant.js";
import Coupon from "../../models/Coupon.js";
import CouponUsage from "../../models/CouponUsage.js";
import User from "../../models/User.js";
import ShipmentTracking from "../../models/ShipmentTracking.js";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";

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

    // 1. get cart
    const cart = await Cart.findOne({ user: req.user.id })
      .populate("items.product")
      .populate("items.variant")
      .populate("couponApplied");

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
        return errorResponse(res, `${product.name} is no longer available`, 400);
      }

      const stock = item.variant ? item.variant.stock : product.stock;
      if (stock < item.quantity) {
        return errorResponse(
          res,
          `Not enough stock for ${product.name}`,
          400
        );
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

    // 4. apply coupon if any
    let discount = 0;
    let couponId = null;

    if (cart.couponApplied) {
      const coupon = cart.couponApplied;

      if (subtotal < coupon.minOrderAmount) {
        return errorResponse(
          res,
          `Order must be at least ₦${coupon.minOrderAmount} to use this coupon`,
          400
        );
      }

      if (coupon.type === "percentage") {
        discount = (subtotal * coupon.value) / 100;
        if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
      } else {
        discount = coupon.value;
      }

      couponId = coupon._id;
    }

    // 5. loyalty points (1 point = ₦1 for simplicity)
    const user = await User.findById(req.user.id);
    let pointsDiscount = 0;

    if (loyaltyPointsToUse > 0) {
      if (loyaltyPointsToUse > user.loyaltyPoints) {
        return errorResponse(res, "Not enough loyalty points", 400);
      }
      pointsDiscount = loyaltyPointsToUse;
    }

    const shippingFee = deliveryPreference === "express" ? 2000 : 500;
    const total = Math.max(0, subtotal - discount - pointsDiscount + shippingFee);

    // 6. create the order
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
      loyaltyPointsUsed: loyaltyPointsToUse,
      paymentMethod,
      deliveryPreference,
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

    // 8. deduct loyalty points and earn new ones (earn 1 point per ₦100 spent)
    if (loyaltyPointsToUse > 0) {
      user.loyaltyPoints -= loyaltyPointsToUse;
    }
    user.loyaltyPoints += Math.floor(total / 100);
    await user.save();

    // 9. record coupon usage
    if (couponId) {
      await CouponUsage.create({ coupon: couponId, user: req.user.id, order: order._id });
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
      { items: [], couponApplied: null }
    );

    return successResponse(res, "Order placed successfully", { order }, 201);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// GET /api/orders
export const getOrderHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = { user: req.user.id };
    if (status) filter.orderStatus = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select("-__v"), // no need to expose mongoose internals
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
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.id,
    }).populate("items.product", "name images slug");

    if (!order) return errorResponse(res, "Order not found", 404);

    // attach live tracking info
    const tracking = await ShipmentTracking.findOne({ order: order._id });

    return successResponse(res, "Order fetched", { order, tracking });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// POST /api/orders/:id/reorder
// adds all items from a past order back into the current cart
export const reorder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!order) return errorResponse(res, "Order not found", 404);

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    for (const item of order.items) {
      // check the product still exists and is in stock
      const product = await Product.findOne({
        _id: item.product,
        isActive: true,
      });
      if (!product || product.stock < 1) continue; // skip unavailable items silently

      const existing = cart.items.findIndex(
        (i) => i.product.toString() === item.product.toString()
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
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!order) return errorResponse(res, "Order not found", 404);

    const cancellableStatuses = ["pending", "confirmed"];
    if (!cancellableStatuses.includes(order.orderStatus)) {
      return errorResponse(
        res,
        "This order can no longer be cancelled",
        400
      );
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
      }
    );

    return successResponse(res, "Order cancelled successfully", { order });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
