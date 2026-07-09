// controllers/customer/brand.controller.js
import Brand from "../../models/Brand.js";
import { successResponse } from "../../utils/apiResponse.js";

export const getPublicBrands = async (req, res) => {
  try {
    const brands = await Brand.find({ isActive: true }).sort({ name: 1 });

    return successResponse(res, "Brands fetched", { brands });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
