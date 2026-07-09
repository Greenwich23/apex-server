import express from "express";
import authRoutes from "./auth.routes.js";
import profileRoutes from "./profile.routes.js";
import addressRoutes from "./address.routes.js";
import productRoutes from "./product.routes.js";
import cartRoutes from "./cart.routes.js";
import categoryRoutes from "./category.routes.js";
import brandRoutes from "./brand.routes.js";
import sportRoutes from "./sport.routes.js";
import userRoutes from "./user.routes.js";
import wishlistRoutes from "./wishlist.routes.js"; // ← this was missing
import orderRoutes from "./order.routes.js";
import paymentRoutes from "./payment.routes.js"; // ← this was missing
import couponRoutes from "./coupon.routes.js";
import contactRoutes from "./contact.routes.js";
// import returnRoutes from "./return.routes.js";
// import supportRoutes from "./support.routes.js";

const router = express.Router();

// Public routes - NO authentication needed

// export default router;
router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);
router.use("/addresses", addressRoutes);
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);
router.use("/users", userRoutes);
router.use("/brands", brandRoutes);
router.use("/sports", sportRoutes);
router.use("/cart", cartRoutes);
router.use("/wishlist", wishlistRoutes); // ← this was missing
router.use("/orders", orderRoutes);
router.use("/payments", paymentRoutes); // ← this was missing
router.use("/coupons", couponRoutes);
router.use("/contact", contactRoutes);

// app.js or server.js

// router.use("/returns", returnRoutes);
// router.use("/support", supportRoutes);

export default router;
