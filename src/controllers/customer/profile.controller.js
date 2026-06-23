import User from "../../models/User.js";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";

// GET /api/profile
export const getProfile = async (req, res) => {
  try {
    // req.user is set by the auth middleware after verifying the JWT
    const user = await User.findById(req.user.id);
    if (!user) return errorResponse(res, "User not found", 404);

    return successResponse(res, "Profile fetched", { user });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// PUT /api/profile
export const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;

    // only allow safe fields to be updated this way
    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone },
      { new: true, runValidators: true }
    );

    return successResponse(res, "Profile updated", { user: updated });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// PUT /api/profile/avatar
export const updateAvatar = async (req, res) => {
  try {
    // multer + cloudinary will put the URL on req.file.path or req.file.secure_url
    if (!req.file) {
      return errorResponse(res, "No image uploaded", 400);
    }

    const avatarUrl = req.file.path; // cloudinary returns the URL here

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { new: true }
    );

    return successResponse(res, "Avatar updated", { avatar: user.avatar });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// PUT /api/profile/change-password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select("+password");
    if (!user) return errorResponse(res, "User not found", 404);

    if (user.authProvider !== "local") {
      return errorResponse(
        res,
        "Password cannot be changed for social accounts",
        400
      );
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return errorResponse(res, "Current password is incorrect", 401);
    }

    if (currentPassword === newPassword) {
      return errorResponse(
        res,
        "New password must be different from current password",
        400
      );
    }

    user.password = newPassword;
    await user.save(); // pre-save hook hashes the new password

    return successResponse(res, "Password changed successfully");
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
