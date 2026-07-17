// routes/customer/return.routes.js
import express from "express";
import {
  createReturnRequest,
  getMyReturnRequests,
  getReturnRequestById,
  getReturnByOrderId,
} from "../../controllers/customer/return.controller.js";
import protect from "../../middleware/auth.js";
import { uploadReviewImages } from "../../middleware/upload.js";

const router = express.Router();

console.log("🔍 Customer return routes initialized");

// ✅ Log each route as it's registered
router.use((req, res, next) => {
  console.log(`🔍 [Return Routes] ${req.method} ${req.path}`);
  next();
});

router.use(protect);

//  Specific routes must come BEFORE dynamic routes
router.get("/order/:orderId", getReturnByOrderId); //  Move this BEFORE /:id

router.post("/", uploadReviewImages, createReturnRequest);
router.get("/", getMyReturnRequests);
router.get("/:id", getReturnRequestById); // This catches any other ID

export default router;
