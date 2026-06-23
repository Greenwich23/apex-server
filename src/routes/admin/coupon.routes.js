import express from "express";
import {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  toggleCoupon,
  deleteCoupon,
} from "../../controllers/admin/coupon.admin.controller.js";
import {
  validate,
  couponValidation,
} from "../../middleware/validateRequest.js";

const router = express.Router();

// /api/admin/coupons
router.get("/", getAllCoupons);
router.post("/", couponValidation, validate, createCoupon);
router.put("/:id", updateCoupon);
router.patch("/:id/toggle", toggleCoupon);
router.delete("/:id", deleteCoupon);

export default router;
