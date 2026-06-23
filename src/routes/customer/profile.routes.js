import express from "express";
import {
  getProfile,
  updateProfile,
  updateAvatar,
  changePassword,
} from "../../controllers/customer/profile.controller.js";
import protect from "../../middleware/auth.js";
import { uploadAvatar } from "../../middleware/upload.js";

const router = express.Router();

// all profile routes require the user to be logged in
router.use(protect);

router.get("/", getProfile);
router.put("/", updateProfile);
router.put("/avatar", uploadAvatar, updateAvatar);
router.put("/change-password", changePassword);

export default router;
