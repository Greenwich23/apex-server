// routes/user.routes.js
import express from "express";
import {
  getProfile,
  updateProfile,
  updatePassword,
  deleteAccount,
} from "../../controllers/customer/user.controller.js";
import protect from "../../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.put("/password", updatePassword);
router.delete("/profile", deleteAccount);

export default router;
