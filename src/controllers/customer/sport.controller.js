// controllers/customer/sport.controller.js
import Sport from "../../models/Sport.js";
import { successResponse } from "../../utils/apiResponse.js";

export const getPublicSports = async (req, res) => {
  try {
    const sports = await Sport.find({ isActive: true }).sort({ name: 1 });

    return successResponse(res, "Sports fetched", { sports });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
