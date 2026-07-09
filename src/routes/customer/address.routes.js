// routes/address.routes.js
import express from "express";
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../../controllers/customer/address.controller.js";
import protect from "../../middleware/auth.js";
import {
  validate,
  addressValidation,
} from "../../middleware/validateRequest.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get("/", getAddresses);
router.post("/", addressValidation, validate, addAddress);
router.put("/:id", addressValidation, validate, updateAddress);
router.delete("/:id", deleteAddress);
router.put("/:id/set-default", setDefaultAddress);

export default router;
