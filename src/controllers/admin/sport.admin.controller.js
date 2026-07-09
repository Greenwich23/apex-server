// controllers/admin/sport.controller.js
import Sport from "../../models/Sport.js";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";
import slugify from "slugify";

export const getAllSports = async (req, res) => {
  try {
    const { isActive } = req.query;
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const sports = await Sport.find(filter).sort({ name: 1 });
    return successResponse(res, "Sports fetched", { sports });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const createSport = async (req, res) => {
  try {
    const { name, icon, description } = req.body;

    if (!name) {
      return errorResponse(res, "Sport name is required", 400);
    }

    const slug = slugify(name, { lower: true, strict: true });

    const existing = await Sport.findOne({ slug });
    if (existing) {
      return errorResponse(res, "Sport already exists", 400);
    }

    const sport = await Sport.create({
      name,
      slug,
      icon: icon || null,
      description: description || "",
      isActive: true,
    });

    return successResponse(res, "Sport created", { sport }, 201);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const updateSport = async (req, res) => {
  try {
    const { name, icon, description, isActive } = req.body;

    const sport = await Sport.findById(req.params.id);
    if (!sport) {
      return errorResponse(res, "Sport not found", 404);
    }

    const updates = { ...req.body };
    if (name && name !== sport.name) {
      updates.slug = slugify(name, { lower: true, strict: true });
    }

    const updated = await Sport.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    return successResponse(res, "Sport updated", { sport: updated });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const deleteSport = async (req, res) => {
  try {
    const sport = await Sport.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    );

    if (!sport) {
      return errorResponse(res, "Sport not found", 404);
    }

    return successResponse(res, "Sport deactivated");
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
