// middleware/upload.js
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudStorage.js";

console.log("🔍 Upload middleware loading...");
console.log(
  "  Cloudinary instance:",
  cloudinary ? "✅ Available" : "❌ Missing",
);

// ─── Cloudinary storage configs ───────────────────────────────────────────────

const productImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "apex/products",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { width: 1000, height: 1000, crop: "limit", quality: "auto" },
    ],
  },
});

const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "apex/avatars",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { width: 300, height: 300, crop: "fill", gravity: "face" },
    ],
  },
});

const reviewImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "apex/reviews",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 800, quality: "auto" }],
  },
});

const categoryImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "apex/categories",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "svg"],
  },
});

const brandLogoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "apex/brands",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "svg"],
  },
});

// ─── NEW: Delivery Agent Photo Storage ──────────────────────────────────────
const deliveryAgentStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "apex/delivery-agents",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { width: 400, height: 400, crop: "fill", gravity: "face" },
    ],
  },
});

// ─── file size limits ─────────────────────────────────────────────────────────

const imageSizeLimit = 5 * 1024 * 1024; // 5MB

// ─── multer instances ─────────────────────────────────────────────────────────

// up to 10 product images at once
export const uploadProductImages = multer({
  storage: productImageStorage,
  limits: { fileSize: imageSizeLimit },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
}).array("images", 10);

// single avatar
export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: imageSizeLimit },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
}).single("avatar");

// up to 5 review photos
export const uploadReviewImages = multer({
  storage: reviewImageStorage,
  limits: { fileSize: imageSizeLimit },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
}).array("images", 5);

// single category image
export const uploadCategoryImage = multer({
  storage: categoryImageStorage,
  limits: { fileSize: imageSizeLimit },
}).single("image");

// single brand logo
export const uploadBrandLogo = multer({
  storage: brandLogoStorage,
  limits: { fileSize: imageSizeLimit },
}).single("logo");

// single variant image
export const uploadVariantImage = multer({
  storage: productImageStorage,
  limits: { fileSize: imageSizeLimit },
}).single("image");

// ─── NEW: Delivery Agent Photo Upload ──────────────────────────────────────
export const uploadDeliveryAgentPhoto = multer({
  storage: deliveryAgentStorage,
  limits: { fileSize: imageSizeLimit },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
}).single("photo");

// ─── Default export for backward compatibility ──────────────────────────────
// This is a generic upload that can be used for any single image upload
const genericUpload = multer({
  storage: deliveryAgentStorage,
  limits: { fileSize: imageSizeLimit },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// Default export for generic single file upload
export default genericUpload.single("photo");
