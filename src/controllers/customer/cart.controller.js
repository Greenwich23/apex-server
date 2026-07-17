// controllers/cart.controller.js
import mongoose from "mongoose";
import Cart from "../../models/Cart.js";
import Product from "../../models/Product.js";
import ProductVariant from "../../models/ProductVariant.js";
import Coupon from "../../models/Coupon.js";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";

// ─── shared populate helper ───────────────────────────────────────────────────
const populateCart = (cartQuery) =>
  cartQuery
    .populate({
      path: "items.product",
      select: "name images price discountPrice stock isActive brand",
      populate: {
        path: "brand",
        select: "name logo",
      },
    })
    .populate("items.variant", "label price discountPrice stock image");

// ─── helper to enrich coupon data ────────────────────────────────────────────
const enrichCouponData = async (cart) => {
  if (!cart) return cart;

  console.log("🔍 [enrichCouponData] Cart couponApplied:", cart.couponApplied);

  // ✅ Check if couponApplied exists and is a reference (ObjectId)
  if (cart.couponApplied) {
    let couponId = cart.couponApplied;

    // If couponApplied is an object with _id, extract the id
    if (typeof couponId === "object" && couponId._id) {
      couponId = couponId._id;
    }

    // If couponApplied is a string (ObjectId), fetch the coupon
    if (
      couponId &&
      (typeof couponId === "string" ||
        couponId instanceof mongoose.Types.ObjectId)
    ) {
      console.log("🔍 [enrichCouponData] Fetching coupon with ID:", couponId);
      const coupon = await Coupon.findById(couponId);
      if (coupon) {
        console.log("✅ [enrichCouponData] Found coupon:", coupon.code);
        // ✅ Replace the ID with the full coupon object
        cart.couponApplied = {
          _id: coupon._id,
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          discountAmount: cart.discount || 0,
          maxDiscount: coupon.maxDiscount,
          minOrderAmount: coupon.minOrderAmount,
          expiresAt: coupon.expiresAt,
          isActive: coupon.isActive,
          usageLimit: coupon.usageLimit,
          perUserLimit: coupon.perUserLimit,
          isFirstTimeOnly: coupon.isFirstTimeOnly,
        };
        console.log(
          "✅ [enrichCouponData] Enriched couponApplied:",
          cart.couponApplied,
        );
      } else {
        console.log("❌ [enrichCouponData] Coupon not found for ID:", couponId);
        cart.couponApplied = null;
      }
    }
  }
  return cart;
};

// GET /api/cart
export const getCart = async (req, res) => {
  try {
    console.log("🔍 [getCart] Fetching cart for user:", req.user.id);

    let cart = await populateCart(Cart.findOne({ user: req.user.id }));

    if (!cart) {
      console.log("📦 [getCart] Cart is empty");
      return successResponse(res, "Cart is empty", {
        cart: { items: [], total: 0 },
      });
    }

    console.log("📦 [getCart] Cart found, couponApplied:", cart.couponApplied);

    // ✅ Enrich coupon data (convert ObjectId to full coupon object)
    cart = await enrichCouponData(cart);

    console.log(
      "📦 [getCart] After enrichment, couponApplied:",
      cart.couponApplied,
    );

    return successResponse(res, "Cart fetched", { cart });
  } catch (error) {
    console.error("❌ Error fetching cart:", error);
    return errorResponse(res, error.message);
  }
};

// POST /api/cart
export const addToCart = async (req, res) => {
  try {
    const { productId, variantId, quantity = 1 } = req.body;

    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) return errorResponse(res, "Product not found", 404);

    let price = product.discountPrice || product.price;
    let availableStock = product.stock;

    if (variantId) {
      const variant = await ProductVariant.findOne({
        _id: variantId,
        product: productId,
        isActive: true,
      });
      if (!variant) return errorResponse(res, "Variant not found", 404);
      price = variant.discountPrice || variant.price;
      availableStock = variant.stock;
    }

    if (availableStock < quantity) {
      return errorResponse(res, "Not enough stock available", 400);
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: [
          { product: productId, variant: variantId || null, quantity, price },
        ],
      });
    } else {
      const existingIndex = cart.items.findIndex(
        (item) =>
          item.product.toString() === productId &&
          (variantId ? item.variant?.toString() === variantId : !item.variant),
      );

      if (existingIndex >= 0) {
        const newQty = cart.items[existingIndex].quantity + quantity;
        if (newQty > availableStock) {
          return errorResponse(res, "Not enough stock for that quantity", 400);
        }
        cart.items[existingIndex].quantity = newQty;
      } else {
        cart.items.push({
          product: productId,
          variant: variantId || null,
          quantity,
          price,
        });
      }

      await cart.save();
    }

    let populatedCart = await populateCart(Cart.findById(cart._id));
    populatedCart = await enrichCouponData(populatedCart);

    return successResponse(
      res,
      "Item added to cart",
      { cart: populatedCart },
      201,
    );
  } catch (error) {
    console.error("❌ Error adding to cart:", error);
    return errorResponse(res, error.message);
  }
};

// POST /api/cart/merge
export const mergeCart = async (req, res) => {
  try {
    const { items } = req.body;
    const userId = req.user.id;

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    for (const guestItem of items) {
      const existingItem = cart.items.find(
        (item) =>
          item.product.toString() === guestItem.productId &&
          (guestItem.variantId
            ? item.variant?.toString() === guestItem.variantId
            : !item.variant),
      );

      if (existingItem) {
        existingItem.quantity += guestItem.quantity;
      } else {
        cart.items.push({
          product: guestItem.productId,
          variant: guestItem.variantId || null,
          quantity: guestItem.quantity,
          price: guestItem.price || 0,
        });
      }
    }

    await cart.save();
    let populatedCart = await populateCart(Cart.findById(cart._id));
    populatedCart = await enrichCouponData(populatedCart);

    return successResponse(res, "Cart merged successfully", {
      cart: populatedCart,
    });
  } catch (error) {
    console.error("Error merging cart:", error);
    return errorResponse(res, error.message);
  }
};

// PUT /api/cart/:itemId
export const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { itemId } = req.params;

    if (quantity < 1) {
      return errorResponse(res, "Quantity must be at least 1", 400);
    }

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return errorResponse(res, "Cart not found", 404);
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return errorResponse(res, "Item not found in cart", 404);
    }

    const product = await Product.findById(item.product);
    const stock = item.variant
      ? (await ProductVariant.findById(item.variant))?.stock
      : product?.stock;

    if (stock < quantity) {
      return errorResponse(res, "Not enough stock available", 400);
    }

    item.quantity = quantity;
    await cart.save();

    let populatedCart = await populateCart(Cart.findById(cart._id));
    populatedCart = await enrichCouponData(populatedCart);

    return successResponse(res, "Cart updated", { cart: populatedCart });
  } catch (error) {
    console.error("❌ Error updating cart:", error);
    return errorResponse(res, error.message);
  }
};

// DELETE /api/cart/:itemId
export const removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return errorResponse(res, "Cart not found", 404);
    }

    cart.items = cart.items.filter(
      (item) => item._id.toString() !== req.params.itemId,
    );

    await cart.save();

    let populatedCart = await populateCart(Cart.findById(cart._id));
    populatedCart = await enrichCouponData(populatedCart);

    return successResponse(res, "Item removed from cart", {
      cart: populatedCart,
    });
  } catch (error) {
    console.error("❌ Error removing from cart:", error);
    return errorResponse(res, error.message);
  }
};

// DELETE /api/cart
export const clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate(
      { user: req.user.id },
      { items: [], couponApplied: null, discount: 0 },
    );

    return successResponse(res, "Cart cleared");
  } catch (error) {
    console.error("❌ Error clearing cart:", error);
    return errorResponse(res, error.message);
  }
};
