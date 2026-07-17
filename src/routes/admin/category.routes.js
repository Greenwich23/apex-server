// routes/admin/category.routes.js
import express from "express";
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../controllers/admin/category.admin.controller.js";
import { protect, admin } from "../../middleware/auth.js";
import { uploadCategoryImage } from "../../middleware/upload.js";

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(admin);

// GET all categories
router.get("/", getAllCategories);

// POST create category - with image upload
router.post("/", uploadCategoryImage, createCategory);

// PUT update category - with image upload
router.put("/:id", uploadCategoryImage, updateCategory);

// DELETE category
router.delete("/:id", deleteCategory);

export default router;
