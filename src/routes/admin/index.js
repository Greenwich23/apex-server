import express from "express";
import protect from "../../middleware/auth.js";
import requireAdmin from "../../middleware/requireAdmin.js";
import dashboardRoutes from "./dashboard.routes.js";
import productRoutes from "./product.routes.js";
import inventoryRoutes from "./inventory.routes.js";
import orderRoutes from "./order.routes.js";
import couponRoutes from "./coupon.routes.js";
import customerRoutes from "./customer.routes.js";
import returnRoutes from "./returns.routes.js";
import ticketsRoutes from "./tickets.routes.js";

const router = express.Router();

// apply auth + admin check to every route in this file in one place
// no need to add protect/requireAdmin to each individual route file
router.use(protect, requireAdmin);

router.use("/dashboard", dashboardRoutes);
router.use("/products", productRoutes);
router.use("/", inventoryRoutes); // handles /categories and /brands
router.use("/orders", orderRoutes);
router.use("/coupons", couponRoutes);
router.use("/customers", customerRoutes);
router.use("/returns", returnRoutes);
router.use("/support", ticketsRoutes);

export default router;
