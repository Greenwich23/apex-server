import express from "express";
import {
  getAllProducts,
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
router.post(
  "/",
  uploadProductImages,
  productValidation,
  validate,
  createProduct,
);
router.put("/:id", uploadProductImages, updateProduct);
router.delete("/:id", deleteProduct);
router.delete("/:id/images/:imageId", deleteProductImage);

// variants
router.post("/:id/variants", uploadVariantImage, addVariant);
router.put("/:id/variants/:variantId", updateVariant);
router.delete("/:id/variants/:variantId", deleteVariant);

export default router;
