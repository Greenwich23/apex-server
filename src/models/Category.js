import mongoose, { Schema } from "mongoose";

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      // e.g. "fitness-equipment"
    },

    description: {
      type: String,
      trim: true,
    },

    image: {
      type: String, // URL
      default: null,
    },

    parent: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null, // null = top-level category
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

const Category = mongoose.model("Category", categorySchema);
export default Category;
