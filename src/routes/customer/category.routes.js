// routes/customer/category.routes.js
import express from "express";
import { getPublicCategories } from "../../controllers/customer/category.controller.js";

const router = express.Router();

router.get("/", getPublicCategories);

export default router;
