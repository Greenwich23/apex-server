// routes/customer/category.routes.js
import express from "express";
import {
  getPublicCategories,
  getCategoryCounts,
} from "../../controllers/customer/category.controller.js";

const router = express.Router();

router.get("/", getPublicCategories);
// routes/customer/product.routes.js
router.get("/category-counts", getCategoryCounts);

export default router;
