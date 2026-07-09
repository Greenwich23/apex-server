import express from "express";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  moveToCart,
  checkWishlistStatus,
} from "../../controllers/customer/wishlist.controller.js";
import protect from "../../middleware/auth.js";

const router = express.Router();

// all wishlist routes require login
router.use(protect);

router.get("/", getWishlist);
router.post("/:productId", addToWishlist);
router.delete("/clear", clearWishlist);                    // must be before /:productId
router.delete("/:productId", removeFromWishlist);
router.post("/:productId/move-to-cart", moveToCart);
router.get("/check/:productId", checkWishlistStatus);

export default router;
