// routes/admin/sport.routes.js
import express from "express";
import {
  getAllSports,
  createSport,
  updateSport,
  deleteSport,
} from "../../controllers/admin/sport.admin.controller.js";

const router = express.Router();

router.get("/", getAllSports);
router.post("/", createSport);
router.put("/:id", updateSport);
router.delete("/:id", deleteSport);

export default router;
