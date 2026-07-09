// models/User.js
import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      minlength: [2, "Name must be at least 2 characters"],
      maxLength: [30, "Name cannot exceed 30 characters"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [8, "Email too short"],
      maxLength: [60, "Email too long"],
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },

    password: {
      type: String,
      minlength: [8, "Password must be at least 8 characters"],
      maxLength: [80, "Password too long"],
    },

    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s\-]{7,15}$/, "Please enter a valid phone number"],
    },

    avatar: {
      type: String,
      default: null,
    },

    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },

    authProvider: {
      type: String,
      enum: ["local", "google", "facebook"],
      default: "local",
    },

    providerId: {
      type: String,
      default: null,
    },

    // ✅ Wishlist - array of product IDs
    wishlist: {
      type: [Schema.Types.ObjectId],
      ref: "Product",
      default: [],
    },

    // ✅ Default Address Reference
    defaultAddress: {
      type: Schema.Types.ObjectId,
      ref: "Address",
      default: null,
    },

    loyaltyPoints: {
      type: Number,
      default: 0,
      min: 0,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    passwordResetToken: {
      type: String,
      default: null,
    },

    passwordResetExpires: {
      type: Date,
      default: null,
    },

    otp: {
      code: { type: String, default: null },
      expiresAt: { type: Date, default: null },
    },

    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare entered password with hashed one
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ✅ Virtual to get all addresses
userSchema.virtual("addresses", {
  ref: "Address",
  localField: "_id",
  foreignField: "user",
  justOne: false,
});

// ✅ Method to get default address
userSchema.methods.getDefaultAddress = async function () {
  if (this.defaultAddress) {
    const Address = mongoose.model("Address");
    return await Address.findById(this.defaultAddress);
  }
  return null;
};

// ✅ Method to get all user addresses
userSchema.methods.getAddresses = async function () {
  const Address = mongoose.model("Address");
  return await Address.find({
    user: this._id,
    isActive: true,
  }).sort({ isDefault: -1, createdAt: -1 });
};

// Don't send password, otp, or reset tokens in any response
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.otp;
  delete user.passwordResetToken;
  delete user.passwordResetExpires;
  return user;
};

const User = mongoose.model("User", userSchema);
export default User;
