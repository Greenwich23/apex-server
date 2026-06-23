import express from "express";
import {
  register,
  login,
  sendOtp,
  verifyOtp,
  socialLogin,
  forgotPassword,
  resetPassword,
  logout,
} from "../../controllers/customer/auth.controller.js";
import protect from "../../middleware/auth.js";
import {
  validate,
  registerValidation,
  loginValidation,
  otpValidation,
} from "../../middleware/validateRequest.js";

const router = express.Router();

router.post("/register", registerValidation, validate, register);
router.post("/login", loginValidation, validate, login);
router.post("/otp/send", sendOtp);
router.post("/otp/verify", otpValidation, validate, verifyOtp);
router.post("/social", socialLogin);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/logout", protect, logout);

export default router;
