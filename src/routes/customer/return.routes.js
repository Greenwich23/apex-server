import express from "express";
import {
  createReturnRequest,
  getMyReturnRequests,
  getReturnRequestById,
} from "../../controllers/customer/return.controller.js";
import protect from "../../middleware/auth.js";
import { uploadReviewImages } from "../../middleware/upload.js";

const router = express.Router();

router.use(protect);

router.post("/", uploadReviewImages, createReturnRequest); // reuse review image uploader for damage photos
router.get("/", getMyReturnRequests);
router.get("/:id", getReturnRequestById);

export default router;
