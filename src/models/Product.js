// models/Product.js
import mongoose, { Schema } from "mongoose";

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxLength: [150, "Product name too long"],
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    description: {
      type: String,
      required: [true, "Product description is required"],
    },

    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },

    discountPrice: {
      type: Number,
      default: null,
    },

    // 🔥 REFERENCES to other collections
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },

    brand: {
      type: Schema.Types.ObjectId,
      ref: "Brand",
      default: null,
    },

    images: [
      {
        url: { type: String, required: true },
        altText: { type: String, default: "" },
        isPrimary: { type: Boolean, default: false },
      },
    ],

    specifications: [
      {
        key: { type: String },
        value: { type: String },
      },
    ],

    material: {
      type: String,
      trim: true,
    },

    dimensions: {
      length: { type: Number },
      width: { type: Number },
      height: { type: Number },
      unit: { type: String, default: "cm" },
    },

    weight: {
      value: { type: Number },
      unit: { type: String, default: "kg" },
    },

    tags: {
      type: [String],
      default: [],
    },

    // 🔥 REFERENCES to other collections
    fitnessGoals: [
      {
        type: Schema.Types.ObjectId,
        ref: "FitnessGoal",
      },
    ],

    sportsType: [
      {
        type: Schema.Types.ObjectId,
        ref: "Sport",
      },
    ],

    stock: {
      type: Number,
      required: true,
      min: [0, "Stock cannot be negative"],
      default: 0,
    },

    sku: {
      type: String,
      unique: true,
      trim: true,
    },

    manualUrl: {
      type: String,
      default: null,
    },

    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    totalReviews: {
      type: Number,
      default: 0,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Indexes for search
productSchema.index({ name: "text", description: "text", tags: "text" });
productSchema.index({ category: 1, brand: 1 });

const Product = mongoose.model("Product", productSchema);
export default Product;
