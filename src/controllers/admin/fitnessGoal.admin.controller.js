// controllers/admin/fitnessGoal.admin.controller.js
import FitnessGoal from "../../models/FitnessGoal.js";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";
import slugify from "slugify";

export const getAllFitnessGoals = async (req, res) => {
  try {
    const { isActive } = req.query;
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const goals = await FitnessGoal.find(filter).sort({ name: 1 });
    return successResponse(res, "Fitness goals fetched", { goals });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const createFitnessGoal = async (req, res) => {
  try {
    const { name, icon, description } = req.body;

    if (!name) {
      return errorResponse(res, "Fitness goal name is required", 400);
    }

    const slug = slugify(name, { lower: true, strict: true });

    const existing = await FitnessGoal.findOne({ slug });
    if (existing) {
      return errorResponse(res, "Fitness goal already exists", 400);
    }

    const goal = await FitnessGoal.create({
      name,
      slug,
      icon: icon || null,
      description: description || "",
      isActive: true,
    });

    return successResponse(res, "Fitness goal created", { goal }, 201);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const updateFitnessGoal = async (req, res) => {
  try {
    const { name, icon, description, isActive } = req.body;

    const goal = await FitnessGoal.findById(req.params.id);
    if (!goal) {
      return errorResponse(res, "Fitness goal not found", 404);
    }

    const updates = { ...req.body };
    if (name && name !== goal.name) {
      updates.slug = slugify(name, { lower: true, strict: true });
    }

    const updated = await FitnessGoal.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true },
    );

    return successResponse(res, "Fitness goal updated", { goal: updated });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const deleteFitnessGoal = async (req, res) => {
  try {
    const goal = await FitnessGoal.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    );

    if (!goal) {
      return errorResponse(res, "Fitness goal not found", 404);
    }

    return successResponse(res, "Fitness goal deactivated");
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
