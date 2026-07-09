// controllers/customer/category.controller.js
import Category from "../../models/Category.js";
import { successResponse } from "../../utils/apiResponse.js";

export const getPublicCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({
      order: 1,
      name: 1,
    });

    return successResponse(res, "Categories fetched", { categories });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
