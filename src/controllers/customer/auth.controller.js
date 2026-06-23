import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../../models/User.js";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";

// ─── helpers ────────────────────────────────────────────────────────────────

const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

const generateOtp = () => {
  // 6-digit numeric OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ─── REGISTER ───────────────────────────────────────────────────────────────

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, "Email is already registered", 400);
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      authProvider: "local",
    });

    // send OTP for email verification (plug in your email service here)
    const otp = generateOtp();
    user.otp = {
      code: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    };
    user.isEmailVerified = false;
    await user.save();

    // TODO: await sendOtpEmail(user.email, otp);
    console.log(`OTP for ${email}: ${otp}`); // remove in production

    const token = generateToken(user._id, user.role);

    return successResponse(
      res,
      "Registration successful. Please verify your email.",
      { token, user },
      201
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// ─── LOGIN ───────────────────────────────────────────────────────────────────

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // explicitly select password since it may be excluded by default
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return errorResponse(res, "Invalid email or password", 401);
    }

    if (!user.isActive) {
      return errorResponse(res, "Your account has been deactivated", 403);
    }

    if (user.authProvider !== "local") {
      return errorResponse(
        res,
        `Please sign in with ${user.authProvider} instead`,
        400
      );
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, "Invalid email or password", 401);
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id, user.role);

    return successResponse(res, "Login successful", { token, user });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// ─── OTP ─────────────────────────────────────────────────────────────────────

// POST /api/auth/otp/send
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return errorResponse(res, "No account found with this email", 404);
    }

    const otp = generateOtp();
    user.otp = {
      code: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    };
    await user.save();

    // TODO: await sendOtpEmail(user.email, otp);
    console.log(`OTP for ${email}: ${otp}`); // remove in production

    return successResponse(res, "OTP sent to your email");
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// POST /api/auth/otp/verify
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    if (!user.otp?.code || !user.otp?.expiresAt) {
      return errorResponse(res, "No OTP found. Please request a new one", 400);
    }

    if (new Date() > user.otp.expiresAt) {
      return errorResponse(res, "OTP has expired. Please request a new one", 400);
    }

    if (user.otp.code !== otp) {
      return errorResponse(res, "Incorrect OTP", 400);
    }

    // clear OTP and mark email as verified
    user.otp = { code: null, expiresAt: null };
    user.isEmailVerified = true;
    await user.save();

    const token = generateToken(user._id, user.role);

    return successResponse(res, "OTP verified successfully", { token, user });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// ─── GOOGLE / FACEBOOK (social auth) ─────────────────────────────────────────
// You'd typically use passport.js or handle the token on the frontend
// (Firebase Auth / Supabase) and just send the provider + providerId here

// POST /api/auth/social
export const socialLogin = async (req, res) => {
  try {
    const { name, email, providerId, authProvider, avatar } = req.body;

    let user = await User.findOne({ email });

    if (!user) {
      // first time — create account automatically
      user = await User.create({
        name,
        email,
        providerId,
        authProvider,
        avatar,
        isEmailVerified: true, // social accounts are pre-verified
      });
    } else {
      // returning user — update their provider info if needed
      user.providerId = providerId;
      user.authProvider = authProvider;
      user.lastLogin = new Date();
      await user.save();
    }

    const token = generateToken(user._id, user.role);

    return successResponse(res, "Login successful", { token, user });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// ─── FORGOT / RESET PASSWORD ──────────────────────────────────────────────────

// POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // don't reveal if email exists or not — security best practice
      return successResponse(
        res,
        "If an account exists with that email, a reset link has been sent"
      );
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 min
    await user.save();

    const resetUrl = `${process.env.CUSTOMER_URL}/reset-password/${resetToken}`;
    // TODO: await sendPasswordResetEmail(user.email, resetUrl);
    console.log(`Reset URL: ${resetUrl}`); // remove in production

    return successResponse(
      res,
      "If an account exists with that email, a reset link has been sent"
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// POST /api/auth/reset-password/:token
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return errorResponse(res, "Reset token is invalid or has expired", 400);
    }

    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    return successResponse(res, "Password reset successful. Please log in.");
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// ─── LOGOUT ──────────────────────────────────────────────────────────────────

// POST /api/auth/logout
// With JWT you don't truly invalidate on the server unless you maintain
// a token blacklist. For now we just confirm logout on the client side.
export const logout = async (req, res) => {
  try {
    return successResponse(res, "Logged out successfully");
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
