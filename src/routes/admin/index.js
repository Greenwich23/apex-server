// routes/admin/index.js
import express from "express";
import protect from "../../middleware/auth.js";
import requireAdmin from "../../middleware/requireAdmin.js";
import dashboardRoutes from "./dashboard.routes.js";
import productRoutes from "./product.routes.js";
import orderRoutes from "./order.routes.js";
import couponRoutes from "./coupon.routes.js";
import customerRoutes from "./customer.routes.js";
import returnRoutes from "./returns.routes.js";
import ticketsRoutes from "./tickets.routes.js";
import fitnessGoalRoutes from "./fitnessGoal.routes.js";
import sportRoutes from "./sport.routes.js";
import categoryRoutes from "./category.routes.js";
import brandRoutes from "./brand.routes.js";

const router = express.Router();

// ✅ Apply authentication and admin check to ALL admin routes
// This ensures every route in this file requires admin privileges
router.use(protect);
router.use(requireAdmin);

// Mount all admin routes - all protected
router.use("/dashboard", dashboardRoutes);
router.use("/products", productRoutes);
router.use("/orders", orderRoutes);
router.use("/coupons", couponRoutes);
router.use("/customers", customerRoutes);
router.use("/returns", returnRoutes);
router.use("/support", ticketsRoutes);
router.use("/fitnessGoals", fitnessGoalRoutes);
router.use("/sports", sportRoutes);
router.use("/categories", categoryRoutes);
router.use("/brands", brandRoutes);

export default router;
