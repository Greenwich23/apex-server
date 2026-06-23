import mongoose, { Schema } from "mongoose";

const reviewSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      trim: true,
      maxLength: [1000, "Review too long"],
    },

    images: {
      type: [String], // URLs of photos uploaded with the review
      default: [],
    },

    isVerifiedPurchase: {
      type: Boolean,
      default: false, // set to true if user actually ordered this product
    },
  },
  { timestamps: true },
);

// one review per user per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);
export default Review;
