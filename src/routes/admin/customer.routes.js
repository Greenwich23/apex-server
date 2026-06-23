import express from "express";
import {
  getAllCustomers,
  getCustomerById,
  toggleCustomerStatus,
} from "../../controllers/admin/customer.admin.controller.js";

const router = express.Router();

// /api/admin/customers
router.get("/", getAllCustomers);
router.get("/:id", getCustomerById);
router.patch("/:id/toggle-status", toggleCustomerStatus);

export default router;
