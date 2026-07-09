// models/FitnessGoal.js
import mongoose, { Schema } from "mongoose";

const fitnessGoalSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    icon: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

const FitnessGoal = mongoose.model("FitnessGoal", fitnessGoalSchema);
export default FitnessGoal;
