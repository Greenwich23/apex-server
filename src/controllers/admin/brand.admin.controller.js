// controllers/admin/brand.controller.js
import Brand from "../../models/Brand.js";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";
import slugify from "slugify";

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

export const createBrand = async (req, res) => {
  try {
    const { name, logo, description } = req.body;

    if (!name) {
      return errorResponse(res, "Brand name is required", 400);
    }

    const slug = slugify(name, { lower: true, strict: true });

    const existing = await Brand.findOne({ slug });
    if (existing) {
      return errorResponse(res, "Brand already exists", 400);
    }

    const brand = await Brand.create({
      name,
      slug,
      logo: logo || null,
      description: description || "",
      isActive: true,
    });

    return successResponse(res, "Brand created", { brand }, 201);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const updateBrand = async (req, res) => {
  try {
    const { name, logo, description, isActive } = req.body;

    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return errorResponse(res, "Brand not found", 404);
    }

    const updates = { ...req.body };
    if (name && name !== brand.name) {
      updates.slug = slugify(name, { lower: true, strict: true });
    }

    const updated = await Brand.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    return successResponse(res, "Brand updated", { brand: updated });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

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
