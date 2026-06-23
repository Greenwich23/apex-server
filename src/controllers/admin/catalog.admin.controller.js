import Category from "../../models/Category.js";
import Brand from "../../models/Brand.js";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";
import slugify from "slugify";

// ─── CATEGORIES ───────────────────────────────────────────────────────────────

// GET /api/admin/categories  (also used by customer-facing app)
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find()
      .populate("parent", "name slug")
      .sort({ name: 1 });

    return successResponse(res, "Categories fetched", { categories });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// POST /api/admin/categories
export const createCategory = async (req, res) => {
  try {
    const { name, description, parentId } = req.body;
    const slug = slugify(name, { lower: true, strict: true });

    const image = req.file ? req.file.path : null;

    const category = await Category.create({
      name,
      slug,
      description,
      image,
      parent: parentId || null,
    });

    return successResponse(res, "Category created", { category }, 201);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// PUT /api/admin/categories/:id
export const updateCategory = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.name) {
      updates.slug = slugify(updates.name, { lower: true, strict: true });
    }
    if (req.file) updates.image = req.file.path;

    const category = await Category.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });

    if (!category) return errorResponse(res, "Category not found", 404);

    return successResponse(res, "Category updated", { category });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// DELETE /api/admin/categories/:id
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return errorResponse(res, "Category not found", 404);

    return successResponse(res, "Category deleted");
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// ─── BRANDS ───────────────────────────────────────────────────────────────────

// GET /api/admin/brands
export const getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find().sort({ name: 1 });
    return successResponse(res, "Brands fetched", { brands });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// POST /api/admin/brands
export const createBrand = async (req, res) => {
  try {
    const { name, description } = req.body;
    const slug = slugify(name, { lower: true, strict: true });
    const logo = req.file ? req.file.path : null;

    const brand = await Brand.create({ name, slug, description, logo });

    return successResponse(res, "Brand created", { brand }, 201);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// PUT /api/admin/brands/:id
export const updateBrand = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.name) updates.slug = slugify(updates.name, { lower: true, strict: true });
    if (req.file) updates.logo = req.file.path;

    const brand = await Brand.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!brand) return errorResponse(res, "Brand not found", 404);

    return successResponse(res, "Brand updated", { brand });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// DELETE /api/admin/brands/:id
export const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findByIdAndDelete(req.params.id);
    if (!brand) return errorResponse(res, "Brand not found", 404);

    return successResponse(res, "Brand deleted");
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
