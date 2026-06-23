import Coupon from "../../models/Coupon.js";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";

// GET /api/admin/coupons
export const getAllCoupons = async (req, res) => {
  try {
    const { page = 1, limit = 20, isActive } = req.query;
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const skip = (Number(page) - 1) * Number(limit);

    const [coupons, total] = await Promise.all([
      Coupon.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Coupon.countDocuments(filter),
    ]);

    return successResponse(res, "Coupons fetched", {
      coupons,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// POST /api/admin/coupons
export const createCoupon = async (req, res) => {
  try {
    const {
      code,
      type,
      value,
      minOrderAmount,
      maxDiscount,
      usageLimit,
      perUserLimit,
      isFirstTimeOnly,
      expiresAt,
    } = req.body;

    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) return errorResponse(res, "Coupon code already exists", 400);

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      type,
      value,
      minOrderAmount,
      maxDiscount,
      usageLimit,
      perUserLimit,
      isFirstTimeOnly,
      expiresAt,
    });

    return successResponse(res, "Coupon created", { coupon }, 201);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// PUT /api/admin/coupons/:id
export const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!coupon) return errorResponse(res, "Coupon not found", 404);

    return successResponse(res, "Coupon updated", { coupon });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// PATCH /api/admin/coupons/:id/toggle
export const toggleCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return errorResponse(res, "Coupon not found", 404);

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    return successResponse(
      res,
      `Coupon ${coupon.isActive ? "activated" : "deactivated"}`,
      { coupon }
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// DELETE /api/admin/coupons/:id
export const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return errorResponse(res, "Coupon not found", 404);

    return successResponse(res, "Coupon deleted");
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
