// routes/admin/product.routes.js
import express from "express";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteProductImage,
  addVariant,
  updateVariant,
  deleteVariant,
} from "../../controllers/admin/product.admin.controller.js";
import {
  uploadProductImages,
  uploadVariantImage,
} from "../../middleware/upload.js";
import {
  validate,
  productValidation,
} from "../../middleware/validateRequest.js";

const router = express.Router();

// /api/admin/products
router.get("/", getAllProducts);

router.get("/:id", getProductById);

// ✅ For creating with images - skip validation (or use different approach)
router.post("/", uploadProductImages, createProduct);

// ✅ For updating with images - skip validation
router.put("/:id", uploadProductImages, updateProduct);

router.delete("/:id", deleteProduct);
router.delete("/:id/images/:imageId", deleteProductImage);

// variants
router.post("/:id/variants", uploadVariantImage, addVariant);
router.put("/:id/variants/:variantId", updateVariant);
router.delete("/:id/variants/:variantId", deleteVariant);

export default router;
