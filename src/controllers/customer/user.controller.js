// controllers/customer/user.controller.js
import User from "../../models/User.js";
import bcrypt from "bcryptjs";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";

// GET /api/users/profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-password -otp -passwordResetToken -passwordResetExpires",
    );

    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    return successResponse(res, "Profile fetched successfully", { user });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return errorResponse(res, error.message);
  }
};

// PUT /api/users/profile
export const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    // Update fields
    if (name) user.name = name;
    if (phone) user.phone = phone;

    await user.save();

    // Return updated user without sensitive data
    const updatedUser = await User.findById(req.user.id).select(
      "-password -otp -passwordResetToken -passwordResetExpires",
    );

    return successResponse(res, "Profile updated successfully", {
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return errorResponse(res, error.message);
  }
};

// PUT /api/users/password
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return errorResponse(
        res,
        "Current password and new password are required",
        400,
      );
    }

    if (newPassword.length < 8) {
      return errorResponse(
        res,
        "New password must be at least 8 characters",
        400,
      );
    }

    // Find user with password field
    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    // Check current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return errorResponse(res, "Current password is incorrect", 400);
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return successResponse(res, "Password updated successfully");
  } catch (error) {
    console.error("Error updating password:", error);
    return errorResponse(res, error.message);
  }
};

// DELETE /api/users/profile
export const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    // Soft delete
    user.isActive = false;
    await user.save();

    return successResponse(res, "Account deactivated successfully");
  } catch (error) {
    console.error("Error deleting account:", error);
    return errorResponse(res, error.message);
  }
};
