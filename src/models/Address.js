// models/Address.js
import mongoose, { Schema } from "mongoose";

const addressSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    label: {
      type: String,
      enum: ["home", "work", "other"],
      default: "home",
    },

    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },

    street: {
      type: String,
      required: [true, "Street address is required"],
      trim: true,
    },

    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },

    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },

    zipCode: {
      type: String,
      required: [true, "Zip code is required"],
      trim: true,
    },

    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
      default: "Nigeria",
    },

    isDefault: {
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

// ✅ Indexes
addressSchema.index({ user: 1, isDefault: 1 });
addressSchema.index({ user: 1, createdAt: -1 });

// ✅ Virtual for formatted full address
addressSchema.virtual("fullAddress").get(function () {
  const parts = [
    this.street,
    `${this.city}, ${this.state} ${this.zipCode}`,
    this.country,
  ].filter(Boolean);
  return parts.join(", ");
});

// ✅ NO pre-save or post-save hooks - handle everything in controller

const Address = mongoose.model("Address", addressSchema);
export default Address;
