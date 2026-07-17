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

// controllers/admin/category.controller.js

// GET /api/products/category-counts
export const getCategoryCounts = async (req, res) => {
  try {
    // Get all categories
    const categories = await Category.find({ isActive: true });

    // Get product counts per category
    const counts = {};

    for (const category of categories) {
      const count = await Product.countDocuments({
        category: category._id,
        isActive: true,
      });
      counts[category._id] = count;
      counts[category.name] = count; // Also store by name for fallback
    }

    return successResponse(res, "Category counts fetched", { data: counts });
  } catch (error) {
    console.error("Error fetching category counts:", error);
    return errorResponse(res, error.message);
  }
};
