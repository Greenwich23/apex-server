// controllers/admin/category.admin.controller.js
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
    console.log("🔍 [createCategory] Body:", req.body);
    console.log("🔍 [createCategory] File:", req.file);

    const { name, description, icon, order } = req.body;

    if (!name) {
      return errorResponse(res, "Category name is required", 400);
    }

    const slug = slugify(name, { lower: true, strict: true });

    const existing = await Category.findOne({ slug });
    if (existing) {
      return errorResponse(res, "Category already exists", 400);
    }

    // ✅ Get image URL from uploaded file if present
    let imageUrl = null;
    if (req.file) {
      imageUrl = req.file.path; // Cloudinary URL
    }

    const category = await Category.create({
      name,
      slug,
      description: description || "",
      icon: icon || null,
      image: imageUrl,
      order: order || 0,
      isActive: true,
    });

    return successResponse(res, "Category created", { category }, 201);
  } catch (error) {
    console.error("❌ [createCategory] Error:", error);
    return errorResponse(res, error.message);
  }
};

// PUT /api/admin/categories/:id
export const updateCategory = async (req, res) => {
  try {
    console.log("🔍 [updateCategory] Body:", req.body);
    console.log("🔍 [updateCategory] File:", req.file);
    console.log("🔍 [updateCategory] ID:", req.params.id);

    const category = await Category.findById(req.params.id);
    if (!category) {
      return errorResponse(res, "Category not found", 404);
    }

    const { name, description, icon, order, isActive } = req.body;

    // ✅ Build updates object
    const updates = {};
    if (name !== undefined) {
      updates.name = name;
      updates.slug = slugify(name, { lower: true, strict: true });
    }
    if (description !== undefined) updates.description = description;
    if (icon !== undefined) updates.icon = icon;
    if (order !== undefined) updates.order = Number(order);
    if (isActive !== undefined) updates.isActive = isActive === "true";

    // ✅ If a new image was uploaded, update it
    if (req.file) {
      updates.image = req.file.path; // Cloudinary URL
    }

    const updated = await Category.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    console.log("✅ [updateCategory] Updated category:", updated);

    return successResponse(res, "Category updated", { category: updated });
  } catch (error) {
    console.error("❌ [updateCategory] Error:", error);
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
