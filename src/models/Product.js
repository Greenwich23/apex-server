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
      default: null, // set if product is on sale
    },

    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
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

    videos: [
      {
        url: { type: String },
        title: { type: String },
      },
    ],

    specifications: [
      {
        key: { type: String }, // e.g. "Weight Capacity"
        value: { type: String }, // e.g. "150kg"
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
      type: [String], // e.g. ["yoga", "cardio", "gym"]
      default: [],
    },

    fitnessGoals: {
      type: [String], // e.g. ["strength", "flexibility"]
      default: [],
    },

    sportsType: {
      type: [String], // e.g. ["running", "cycling"]
      default: [],
    },

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
      type: String, // downloadable PDF URL
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

// simple text index so search works across name, description, tags
productSchema.index({ name: "text", description: "text", tags: "text" });

const Product = mongoose.model("Product", productSchema);
export default Product;
