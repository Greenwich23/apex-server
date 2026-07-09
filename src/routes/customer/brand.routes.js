// routes/customer/brand.routes.js
import express from "express";
import { getPublicBrands } from "../../controllers/customer/brand.controller.js";

const router = express.Router();

router.get("/", getPublicBrands);

export default router;
