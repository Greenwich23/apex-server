import Cart from "../../models/Cart.js";
import Product from "../../models/Product.js";
import ProductVariant from "../../models/ProductVariant.js";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";

// ─── shared populate helper ───────────────────────────────────────────────────
// one place to define which fields come back on every cart response
// so getCart, addToCart, updateCartItem, removeFromCart all return the same shape

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
    .populate("items.variant", "label price discountPrice stock image")
    .populate("couponApplied", "code type value maxDiscount");

// GET /api/cart
export const getCart = async (req, res) => {
  try {
    const cart = await populateCart(Cart.findOne({ user: req.user.id }));

    if (!cart) {
      return successResponse(res, "Cart is empty", {
        cart: { items: [], total: 0 },
      });
    }

    return successResponse(res, "Cart fetched", { cart });
  } catch (error) {
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

    // re-populate after save so the response has full product data
    const populatedCart = await populateCart(Cart.findById(cart._id));

    return successResponse(
      res,
      "Item added to cart",
      { cart: populatedCart },
      201,
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// controllers/cart.controller.js

// POST /api/cart/merge
export const mergeCart = async (req, res) => {
  try {
    const { items } = req.body;
    const userId = req.user.id;

    // Get or create user's cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    // Merge guest items with existing cart
    for (const guestItem of items) {
      const existingItem = cart.items.find(
        (item) =>
          item.product.toString() === guestItem.productId &&
          (guestItem.variantId
            ? item.variant?.toString() === guestItem.variantId
            : !item.variant),
      );

      if (existingItem) {
        // Update quantity if item exists
        existingItem.quantity += guestItem.quantity;
      } else {
        // Add new item
        cart.items.push({
          product: guestItem.productId,
          variant: guestItem.variantId || null,
          quantity: guestItem.quantity,
          price: guestItem.price || 0,
        });
      }
    }

    await cart.save();
    await cart.populate("items.product items.variant");

    return successResponse(res, "Cart merged successfully", { cart });
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

    if (quantity < 1)
      return errorResponse(res, "Quantity must be at least 1", 400);

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return errorResponse(res, "Cart not found", 404);

    const item = cart.items.id(itemId);
    if (!item) return errorResponse(res, "Item not found in cart", 404);

    // re-check stock before updating
    const product = await Product.findById(item.product);
    const stock = item.variant
      ? (await ProductVariant.findById(item.variant))?.stock
      : product?.stock;

    if (stock < quantity) {
      return errorResponse(res, "Not enough stock available", 400);
    }

    item.quantity = quantity;
    await cart.save();

    // re-populate so response has full product/brand/images data
    const populatedCart = await populateCart(Cart.findById(cart._id));

    return successResponse(res, "Cart updated", { cart: populatedCart });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// DELETE /api/cart/:itemId
export const removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return errorResponse(res, "Cart not found", 404);

    cart.items = cart.items.filter(
      (item) => item._id.toString() !== req.params.itemId,
    );

    await cart.save();

    // re-populate so response stays consistent
    const populatedCart = await populateCart(Cart.findById(cart._id));

    return successResponse(res, "Item removed from cart", {
      cart: populatedCart,
    });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// DELETE /api/cart
export const clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate(
      { user: req.user.id },
      { items: [], couponApplied: null },
    );

    return successResponse(res, "Cart cleared");
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
