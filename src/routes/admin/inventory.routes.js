import express from "express";
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllBrands,
  createBrand,
  updateBrand,
  deleteBrand,
} from "../../controllers/admin/catalog.admin.controller.js";
import {
  uploadCategoryImage,
  uploadBrandLogo,
} from "../../middleware/upload.js";

const router = express.Router();

// /api/admin/categories
router.get("/categories", getAllCategories);
router.post("/categories", uploadCategoryImage, createCategory);
router.put("/categories/:id", uploadCategoryImage, updateCategory);
router.delete("/categories/:id", deleteCategory);

// /api/admin/brands
router.get("/brands", getAllBrands);
router.post("/brands", uploadBrandLogo, createBrand);
router.put("/brands/:id", uploadBrandLogo, updateBrand);
router.delete("/brands/:id", deleteBrand);

export default router;
