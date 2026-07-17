// routes/admin/brand.routes.js
import express from "express";
import {
  getAllBrands,
  createBrand,
  updateBrand,
  deleteBrand,
} from "../../controllers/admin/brand.admin.controller.js";
import { protect, admin } from "../../middleware/auth.js";
import { uploadBrandLogo } from "../../middleware/upload.js";

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(admin);

// GET all brands
router.get("/", getAllBrands);

// POST create brand - with logo upload
router.post("/", uploadBrandLogo, createBrand);

// PUT update brand - with logo upload
router.put("/:id", uploadBrandLogo, updateBrand);

// DELETE brand
router.delete("/:id", deleteBrand);

export default router;
