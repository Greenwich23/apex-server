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
      // not required at top level because Google/Facebook users won't have one
    },

    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s\-]{7,15}$/, "Please enter a valid phone number"],
    },

    avatar: {
      type: String, // URL from Cloudinary/S3
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

    // for Google/Facebook login — stores their provider ID
    providerId: {
      type: String,
      default: null,
    },

    wishlist: {
      type: [Schema.Types.ObjectId],
      ref: "Product",
      default: [],
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
      default: true, // admin can deactivate accounts
    },

    // for "forgot password" flow
    passwordResetToken: {
      type: String,
      default: null,
    },

    passwordResetExpires: {
      type: Date,
      default: null,
    },

    // for OTP login/verification
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
    timestamps: true, // adds createdAt and updatedAt automatically
  },
);

// hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// compare entered password with hashed one
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// don't send password, otp, or reset tokens in any response
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
