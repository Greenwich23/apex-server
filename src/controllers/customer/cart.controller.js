import Cart from "../../models/Cart.js";
import Product from "../../models/Product.js";
import ProductVariant from "../../models/ProductVariant.js";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";

// GET /api/cart
export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id })
      .populate("items.product", "name images price stock isActive")
      .populate("items.variant", "label price stock")
      .populate("couponApplied", "code type value");

    if (!cart) {
      return successResponse(res, "Cart is empty", { cart: { items: [], total: 0 } });
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

    // validate the product exists and is active
    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) return errorResponse(res, "Product not found", 404);

    // if a variant is selected, use its price and check its stock
    let price = product.price;
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
    } else {
      price = product.discountPrice || product.price;
    }

    if (availableStock < quantity) {
      return errorResponse(res, "Not enough stock available", 400);
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      // first item — create the cart
      cart = await Cart.create({
        user: req.user.id,
        items: [{ product: productId, variant: variantId || null, quantity, price }],
      });
    } else {
      // check if this exact product+variant combo is already in the cart
      const existingIndex = cart.items.findIndex(
        (item) =>
          item.product.toString() === productId &&
          (variantId
            ? item.variant?.toString() === variantId
            : !item.variant)
      );

      if (existingIndex >= 0) {
        // just increase quantity
        const newQty = cart.items[existingIndex].quantity + quantity;
        if (newQty > availableStock) {
          return errorResponse(res, "Not enough stock for that quantity", 400);
        }
        cart.items[existingIndex].quantity = newQty;
      } else {
        // add as new item
        cart.items.push({
          product: productId,
          variant: variantId || null,
          quantity,
          price,
        });
      }

      await cart.save();
    }

    await cart.populate("items.product", "name images");
    await cart.populate("items.variant", "label");

    return successResponse(res, "Item added to cart", { cart }, 201);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// PUT /api/cart/:itemId
export const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { itemId } = req.params;

    if (quantity < 1) return errorResponse(res, "Quantity must be at least 1", 400);

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return errorResponse(res, "Cart not found", 404);

    const item = cart.items.id(itemId);
    if (!item) return errorResponse(res, "Item not found in cart", 404);

    // re-check stock
    const product = await Product.findById(item.product);
    const stock = item.variant
      ? (await ProductVariant.findById(item.variant))?.stock
      : product?.stock;

    if (stock < quantity) {
      return errorResponse(res, "Not enough stock available", 400);
    }

    item.quantity = quantity;
    await cart.save();

    return successResponse(res, "Cart updated", { cart });
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
      (item) => item._id.toString() !== req.params.itemId
    );

    await cart.save();

    return successResponse(res, "Item removed from cart", { cart });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// DELETE /api/cart
export const clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate(
      { user: req.user.id },
      { items: [], couponApplied: null }
    );

    return successResponse(res, "Cart cleared");
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
