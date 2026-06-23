import mongoose, { Schema } from "mongoose";

const productVariantSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    // what the customer sees on the button/dropdown
    label: {
      type: String,
      required: true,
      trim: true,
      // e.g. "5kg", "Large / Red", "6mm"
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    discountPrice: {
      type: Number,
      default: null,
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    sku: {
      type: String,
      unique: true,
      sparse: true, // allows multiple nulls
      trim: true,
    },

    image: {
      type: String,
      default: null,
      // only needed if this variant looks different e.g. different color
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

const ProductVariant = mongoose.model("ProductVariant", productVariantSchema);
export default ProductVariant;
