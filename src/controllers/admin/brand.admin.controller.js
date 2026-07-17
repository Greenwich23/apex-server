// controllers/admin/brand.admin.controller.js
import Brand from "../../models/Brand.js";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";
import slugify from "slugify";

// GET /api/admin/brands
export const getAllBrands = async (req, res) => {
  try {
    const { isActive } = req.query;
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const brands = await Brand.find(filter).sort({ name: 1 });
    return successResponse(res, "Brands fetched", { brands });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// POST /api/admin/brands
export const createBrand = async (req, res) => {
  try {
    console.log("🔍 [createBrand] Body:", req.body);
    console.log("🔍 [createBrand] File:", req.file);

    const { name, description } = req.body;

    if (!name) {
      return errorResponse(res, "Brand name is required", 400);
    }

    const slug = slugify(name, { lower: true, strict: true });

    const existing = await Brand.findOne({ slug });
    if (existing) {
      return errorResponse(res, "Brand already exists", 400);
    }

    // ✅ Get logo URL from uploaded file if present
    let logoUrl = null;
    if (req.file) {
      logoUrl = req.file.path; // Cloudinary URL
    }

    const brand = await Brand.create({
      name,
      slug,
      logo: logoUrl,
      description: description || "",
      isActive: true,
    });

    return successResponse(res, "Brand created", { brand }, 201);
  } catch (error) {
    console.error("❌ [createBrand] Error:", error);
    return errorResponse(res, error.message);
  }
};

// PUT /api/admin/brands/:id
export const updateBrand = async (req, res) => {
  try {
    console.log("🔍 [updateBrand] Body:", req.body);
    console.log("🔍 [updateBrand] File:", req.file);
    console.log("🔍 [updateBrand] ID:", req.params.id);

    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return errorResponse(res, "Brand not found", 404);
    }

    const { name, description, isActive } = req.body;

    // ✅ Build updates object
    const updates = {};
    if (name !== undefined) {
      updates.name = name;
      updates.slug = slugify(name, { lower: true, strict: true });
    }
    if (description !== undefined) updates.description = description;
    if (isActive !== undefined) updates.isActive = isActive === "true";

    // ✅ If a new logo was uploaded, update it
    if (req.file) {
      updates.logo = req.file.path; // Cloudinary URL
    }

    const updated = await Brand.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    console.log("✅ [updateBrand] Updated brand:", updated);

    return successResponse(res, "Brand updated", { brand: updated });
  } catch (error) {
    console.error("❌ [updateBrand] Error:", error);
    return errorResponse(res, error.message);
  }
};

// DELETE /api/admin/brands/:id
export const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    );

    if (!brand) {
      return errorResponse(res, "Brand not found", 404);
    }

    return successResponse(res, "Brand deactivated");
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
