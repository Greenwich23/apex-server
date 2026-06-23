import express from "express";
import authRoutes from "./auth.routes.js";
import profileRoutes from "./profile.routes.js";
import addressRoutes from "./address.routes.js";
import productRoutes from "./product.routes.js";
import cartRoutes from "./cart.routes.js";
import orderRoutes from "./order.routes.js";
import couponRoutes from "./coupon.routes.js";
import returnRoutes from "./return.routes.js";
import supportRoutes from "./support.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);
router.use("/addresses", addressRoutes);
router.use("/products", productRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);
router.use("/coupons", couponRoutes);
router.use("/returns", returnRoutes);
router.use("/support", supportRoutes);

export default router;
