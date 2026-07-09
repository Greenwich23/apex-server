// routes/customer/contact.routes.js
import express from "express";
import { sendContactMessage } from "../../controllers/customer/contact.controller.js";
import {
  validate,
  contactValidation,
} from "../../middleware/validateRequest.js";

const router = express.Router();

router.post("/", contactValidation, validate, sendContactMessage);

export default router;
