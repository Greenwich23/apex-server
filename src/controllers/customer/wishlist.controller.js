import User from "../../models/User.js";
import Product from "../../models/Product.js";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";

// GET /api/wishlist
export const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate(
      "wishlist",
      "name slug price discountPrice images averageRating totalReviews stock isActive brand category"
    );

    if (!user) return errorResponse(res, "User not found", 404);

    // filter out any products that have been deactivated since being wishlisted
    const activeItems = user.wishlist.filter((p) => p.isActive);

    return successResponse(res, "Wishlist fetched", {
      wishlist: activeItems,
      total: activeItems.length,
    });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// POST /api/wishlist/:productId
export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    // confirm product exists and is active
    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) return errorResponse(res, "Product not found", 404);

    const user = await User.findById(req.user.id);

    // check if already in wishlist
    const alreadyAdded = user.wishlist.some(
      (id) => id.toString() === productId
    );

    if (alreadyAdded) {
      return errorResponse(res, "Product is already in your wishlist", 400);
    }

    user.wishlist.push(productId);
    await user.save();

    return successResponse(
      res,
      "Product added to wishlist",
      { wishlistCount: user.wishlist.length },
      201
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// DELETE /api/wishlist/:productId
export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.user.id);

    const exists = user.wishlist.some((id) => id.toString() === productId);
    if (!exists) {
      return errorResponse(res, "Product not found in wishlist", 404);
    }

    user.wishlist = user.wishlist.filter(
      (id) => id.toString() !== productId
    );

    await user.save();

    return successResponse(res, "Product removed from wishlist", {
      wishlistCount: user.wishlist.length,
    });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// DELETE /api/wishlist
export const clearWishlist = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { wishlist: [] });

    return successResponse(res, "Wishlist cleared");
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// POST /api/wishlist/:productId/move-to-cart
// moves an item from wishlist to cart in one action
export const moveToCart = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) return errorResponse(res, "Product not found", 404);

    if (product.stock < 1) {
      return errorResponse(res, "Product is out of stock", 400);
    }

    // remove from wishlist
    const user = await User.findById(req.user.id);
    user.wishlist = user.wishlist.filter(
      (id) => id.toString() !== productId
    );
    await user.save();

    // add to cart — import Cart here to avoid circular deps at the top
    const Cart = (await import("../../models/Cart.js")).default;

    let cart = await Cart.findOne({ user: req.user.id });

    const price = product.discountPrice || product.price;

    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: [{ product: productId, quantity: 1, price }],
      });
    } else {
      const existingIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId
      );

      if (existingIndex >= 0) {
        cart.items[existingIndex].quantity += 1;
      } else {
        cart.items.push({ product: productId, quantity: 1, price });
      }

      await cart.save();
    }

    return successResponse(res, "Product moved to cart");
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// GET /api/wishlist/check/:productId
// lets the frontend know if a product is already wishlisted
// so you can toggle the heart icon correctly
export const checkWishlistStatus = async (req, res) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.user.id).select("wishlist");

    const isWishlisted = user.wishlist.some(
      (id) => id.toString() === productId
    );

    return successResponse(res, "Wishlist status fetched", { isWishlisted });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
