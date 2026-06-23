import Product from "../../models/Product.js";
import ProductVariant from "../../models/ProductVariant.js";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";
import slugify from "slugify";

// GET /api/admin/products
export const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, isActive } = req.query;
    const filter = {};

    if (search) filter.$text = { $search: search };
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name")
        .populate("brand", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    return successResponse(res, "Products fetched", {
      products,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// POST /api/admin/products
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      discountPrice,
      category,
      brand,
      specifications,
      material,
      dimensions,
      weight,
      tags,
      fitnessGoals,
      sportsType,
      stock,
      sku,
      isFeatured,
    } = req.body;

    // generate slug from name — e.g. "Bowflex Dumbbell" → "bowflex-dumbbell"
    const slug = slugify(name, { lower: true, strict: true });

    const existing = await Product.findOne({ slug });
    if (existing) {
      return errorResponse(res, "A product with this name already exists", 400);
    }

    // images from multer upload
    const images = req.files
      ? req.files.map((file, index) => ({
          url: file.path,
          altText: name,
          isPrimary: index === 0, // first uploaded image is the main one
        }))
      : [];

    const product = await Product.create({
      name,
      slug,
      description,
      price,
      discountPrice,
      category,
      brand,
      images,
      specifications: specifications ? JSON.parse(specifications) : [],
      material,
      dimensions: dimensions ? JSON.parse(dimensions) : undefined,
      weight: weight ? JSON.parse(weight) : undefined,
      tags: tags ? JSON.parse(tags) : [],
      fitnessGoals: fitnessGoals ? JSON.parse(fitnessGoals) : [],
      sportsType: sportsType ? JSON.parse(sportsType) : [],
      stock,
      sku,
      isFeatured,
    });

    return successResponse(res, "Product created", { product }, 201);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// PUT /api/admin/products/:id
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return errorResponse(res, "Product not found", 404);

    const updates = { ...req.body };

    // re-generate slug if name changed
    if (updates.name && updates.name !== product.name) {
      updates.slug = slugify(updates.name, { lower: true, strict: true });
    }

    // parse JSON strings sent from multipart form
    ["specifications", "dimensions", "weight", "tags", "fitnessGoals", "sportsType"].forEach(
      (field) => {
        if (updates[field] && typeof updates[field] === "string") {
          updates[field] = JSON.parse(updates[field]);
        }
      }
    );

    // if new images uploaded, append them
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => ({
        url: file.path,
        altText: updates.name || product.name,
        isPrimary: false,
      }));
      updates.images = [...product.images, ...newImages];
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    return successResponse(res, "Product updated", { product: updated });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// DELETE /api/admin/products/:id
// soft delete — set isActive to false rather than truly deleting
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!product) return errorResponse(res, "Product not found", 404);

    return successResponse(res, "Product deactivated");
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// DELETE /api/admin/products/:id/image/:imageId
export const deleteProductImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return errorResponse(res, "Product not found", 404);

    product.images = product.images.filter(
      (img) => img._id.toString() !== req.params.imageId
    );

    // if we removed the primary, make the first remaining image primary
    if (!product.images.some((img) => img.isPrimary) && product.images.length > 0) {
      product.images[0].isPrimary = true;
    }

    await product.save();

    return successResponse(res, "Image removed", { images: product.images });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// ─── VARIANTS ────────────────────────────────────────────────────────────────

// POST /api/admin/products/:id/variants
export const addVariant = async (req, res) => {
  try {
    const { label, price, discountPrice, stock, sku } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) return errorResponse(res, "Product not found", 404);

    const image = req.file ? req.file.path : null;

    const variant = await ProductVariant.create({
      product: req.params.id,
      label,
      price,
      discountPrice,
      stock,
      sku,
      image,
    });

    return successResponse(res, "Variant added", { variant }, 201);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// PUT /api/admin/products/:id/variants/:variantId
export const updateVariant = async (req, res) => {
  try {
    const variant = await ProductVariant.findOneAndUpdate(
      { _id: req.params.variantId, product: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!variant) return errorResponse(res, "Variant not found", 404);

    return successResponse(res, "Variant updated", { variant });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// DELETE /api/admin/products/:id/variants/:variantId
export const deleteVariant = async (req, res) => {
  try {
    const variant = await ProductVariant.findOneAndDelete({
      _id: req.params.variantId,
      product: req.params.id,
    });

    if (!variant) return errorResponse(res, "Variant not found", 404);

    return successResponse(res, "Variant deleted");
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
