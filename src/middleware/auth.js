import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { errorResponse } from "../utils/apiResponse.js";

const protect = async (req, res, next) => {
  try {
    let token;

    // token comes in as "Bearer <token>" in the Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return errorResponse(res, "Not authenticated. Please log in.", 401);
    }

    // verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // attach the user to the request so controllers can access req.user
    const user = await User.findById(decoded.id).select(
      "-password -otp -passwordResetToken -passwordResetExpires"
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
      return errorResponse(res, "Your session has expired. Please log in again.", 401);
    }
    return errorResponse(res, error.message);
  }
};

export default protect;
