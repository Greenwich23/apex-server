// controllers/admin/category.controller.js
import Category from "../../models/Category.js";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";
import slugify from "slugify";

// GET /api/admin/categories
export const getAllCategories = async (req, res) => {
  try {
    const { isActive } = req.query;
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const categories = await Category.find(filter).sort({ order: 1, name: 1 });

    return successResponse(res, "Categories fetched", { categories });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// POST /api/admin/categories
export const createCategory = async (req, res) => {
  try {
    const { name, description, icon, image, order } = req.body;

    if (!name) {
      return errorResponse(res, "Category name is required", 400);
    }

    const slug = slugify(name, { lower: true, strict: true });

    const existing = await Category.findOne({ slug });
    if (existing) {
      return errorResponse(res, "Category already exists", 400);
    }

    const category = await Category.create({
      name,
      slug,
      description: description || "",
      icon: icon || null,
      image: image || null,
      order: order || 0,
      isActive: true,
    });

    return successResponse(res, "Category created", { category }, 201);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// PUT /api/admin/categories/:id
export const updateCategory = async (req, res) => {
  try {
    const { name, description, icon, image, order, isActive } = req.body;

    const category = await Category.findById(req.params.id);
    if (!category) {
      return errorResponse(res, "Category not found", 404);
    }

    const updates = { ...req.body };
    if (name && name !== category.name) {
      updates.slug = slugify(name, { lower: true, strict: true });
    }

    const updated = await Category.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    return successResponse(res, "Category updated", { category: updated });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// DELETE /api/admin/categories/:id
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    );

    if (!category) {
      return errorResponse(res, "Category not found", 404);
    }

    return successResponse(res, "Category deactivated");
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
