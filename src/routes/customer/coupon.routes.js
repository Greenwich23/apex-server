import express from "express";
import {
  validateCoupon,
  applyCoupon,
  removeCoupon,
} from "../../controllers/customer/coupon.controller.js";
import protect from "../../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.post("/validate", validateCoupon);
router.post("/apply", applyCoupon);
router.delete("/remove", removeCoupon);

export default router;
