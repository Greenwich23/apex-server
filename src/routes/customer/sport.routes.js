// routes/customer/sport.routes.js
import express from "express";
import { getPublicSports } from "../../controllers/customer/sport.controller.js";

const router = express.Router();

router.get("/", getPublicSports);

export default router;
