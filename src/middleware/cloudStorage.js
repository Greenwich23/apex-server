// src/config/cloudStorage.js
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

// ✅ MUST load dotenv here
dotenv.config();

// ✅ Debug: Check if env vars are loaded
console.log("🔍 Cloudinary Config Check:");
console.log("  Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME || "❌ Missing");
console.log(
  "  API Key:",
  process.env.CLOUDINARY_API_KEY ? "✅ Set" : "❌ Missing",
);
console.log(
  "  API Secret:",
  process.env.CLOUDINARY_API_SECRET ? "✅ Set" : "❌ Missing",
);

// ✅ Validate before configuring
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  console.error(
    "❌ Cloudinary credentials are missing! Please check your .env file.",
  );
} else {
  console.log("✅ All Cloudinary credentials found. Configuring...");
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log(
  "✅ Cloudinary configured successfully with cloud:",
  process.env.CLOUDINARY_CLOUD_NAME,
);

export default cloudinary;
