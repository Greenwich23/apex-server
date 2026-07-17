// middleware/auth.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { errorResponse } from "../utils/apiResponse.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return errorResponse(res, "Not authenticated. Please log in.", 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select(
      "-password -otp -passwordResetToken -passwordResetExpires",
    );

    if (!user) {
      return errorResponse(res, "User no longer exists", 401);
    }

    if (!user.isActive) {
      return errorResponse(res, "Your account has been deactivated", 403);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return errorResponse(res, "Invalid token. Please log in again.", 401);
    }
    if (error.name === "TokenExpiredError") {
      return errorResponse(
        res,
        "Your session has expired. Please log in again.",
        401,
      );
    }
    return errorResponse(res, error.message);
  }
};

// Admin middleware - checks if user has admin role
export const admin = (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, "Not authenticated. Please log in.", 401);
  }

  // Check if user has admin role (since your enum has "customer" and "admin")
  if (req.user.role !== "admin") {
    console.log(
      `❌ Access denied: User ${req.user.email} has role: ${req.user.role}`,
    );
    return errorResponse(res, "Access denied. Admin privileges required.", 403);
  }

  console.log(`✅ Admin access granted: ${req.user.email}`);
  next();
};

export default protect;
