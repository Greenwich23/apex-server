// routes/admin/fitnessGoal.routes.js
import express from "express";
import {
  getAllFitnessGoals,
  createFitnessGoal,
  updateFitnessGoal,
  deleteFitnessGoal,
} from "../../controllers/admin/fitnessGoal.admin.controller.js";

const router = express.Router();

router.get("/", getAllFitnessGoals);
router.post("/", createFitnessGoal);
router.put("/:id", updateFitnessGoal);
router.delete("/:id", deleteFitnessGoal);

export default router;
