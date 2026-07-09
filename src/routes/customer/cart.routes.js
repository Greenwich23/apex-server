import express from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  mergeCart,
} from "../../controllers/customer/cart.controller.js";
import protect from "../../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", getCart);
router.post("/", addToCart);
router.post("/merge", mergeCart); // New route to merge cart items
router.put("/:itemId", updateCartItem);
router.delete("/clear", clearCart); // must come before /:itemId
router.delete("/:itemId", removeFromCart);

export default router;
