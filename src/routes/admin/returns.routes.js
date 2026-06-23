import express from "express";
import {
  getAllReturnRequests,
  resolveReturnRequest,
} from "../../controllers/admin/return.admin.controller.js";

const router = express.Router();

// /api/admin/returns
router.get("/", getAllReturnRequests);
router.put("/:id/resolve", resolveReturnRequest);

export default router;
