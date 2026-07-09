// controllers/admin/product.controller.js
import Product from "../../models/Product.js";
import ProductVariant from "../../models/ProductVariant.js";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";
import slugify from "slugify";

// GET /api/admin/products
export const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      brand,
      isActive,
    } = req.query;
    const filter = {};

    if (search) filter.$text = { $search: search };
    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug")
        .populate("brand", "name slug logo")
        .populate("fitnessGoals", "name slug")
        .populate("sportsType", "name slug")
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

// GET /api/admin/products/:id
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category", "name slug")
      .populate("brand", "name slug logo")
      .populate("fitnessGoals", "name slug")
      .populate("sportsType", "name slug");

    if (!product) {
      return errorResponse(res, "Product not found", 404);
    }

    const variants = await ProductVariant.find({
      product: product._id,
      isActive: true,
    });

    return successResponse(res, "Product fetched", {
      product,
      variants,
      hasVariants: variants.length > 0,
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
      images,
    } = req.body;

    // Validate required fields
    if (!name) return errorResponse(res, "Product name is required", 400);
    if (!description)
      return errorResponse(res, "Product description is required", 400);
    if (!price) return errorResponse(res, "Product price is required", 400);
    if (!category) return errorResponse(res, "Category is required", 400);

    const slug = slugify(name, { lower: true, strict: true });

    const existing = await Product.findOne({ slug });
    if (existing) {
      return errorResponse(res, "A product with this name already exists", 400);
    }

    const imageArray =
      images && Array.isArray(images)
        ? images.map((url, index) => ({
            url: url,
            altText: name,
            isPrimary: index === 0,
          }))
        : [];

    const product = await Product.create({
      name,
      slug,
      description,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : null,
      category,
      brand: brand || null,
      images: imageArray,
      specifications: specifications || [],
      material: material || null,
      dimensions: dimensions || undefined,
      weight: weight || undefined,
      tags: tags || [],
      fitnessGoals: fitnessGoals || [],
      sportsType: sportsType || [],
      stock: Number(stock) || 0,
      sku: sku || null,
      isFeatured: isFeatured === "true" || isFeatured === true || false,
      isActive: true,
    });

    // Populate the created product
    const populatedProduct = await Product.findById(product._id)
      .populate("category", "name slug")
      .populate("brand", "name slug")
      .populate("fitnessGoals", "name slug")
      .populate("sportsType", "name slug");

    return successResponse(
      res,
      "Product created successfully",
      { product: populatedProduct },
      201,
    );
  } catch (error) {
    console.error("Error creating product:", error);
    return errorResponse(res, error.message || "Failed to create product");
  }
};

// POST /api/admin/products/bulk
export const createProductWithVariants = async (req, res) => {
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
      images,
      variants,
    } = req.body;

    if (!name) return errorResponse(res, "Product name is required", 400);
    if (!description)
      return errorResponse(res, "Product description is required", 400);
    if (!price) return errorResponse(res, "Product price is required", 400);
    if (!category) return errorResponse(res, "Category is required", 400);

    const slug = slugify(name, { lower: true, strict: true });

    const existing = await Product.findOne({ slug });
    if (existing) {
      return errorResponse(res, "A product with this name already exists", 400);
    }

    const imageArray =
      images && Array.isArray(images)
        ? images.map((url, index) => ({
            url: url,
            altText: name,
            isPrimary: index === 0,
          }))
        : [];

    const product = await Product.create({
      name,
      slug,
      description,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : null,
      category,
      brand: brand || null,
      images: imageArray,
      specifications: specifications || [],
      material: material || null,
      dimensions: dimensions || undefined,
      weight: weight || undefined,
      tags: tags || [],
      fitnessGoals: fitnessGoals || [],
      sportsType: sportsType || [],
      stock: Number(stock) || 0,
      sku: sku || null,
      isFeatured: isFeatured === "true" || isFeatured === true || false,
      isActive: true,
    });

    let createdVariants = [];
    if (variants && Array.isArray(variants) && variants.length > 0) {
      const variantPromises = variants.map((variant) => {
        return ProductVariant.create({
          product: product._id,
          label: variant.label,
          price: Number(variant.price),
          discountPrice: variant.discountPrice
            ? Number(variant.discountPrice)
            : null,
          stock: Number(variant.stock) || 0,
          sku: variant.sku || null,
          image: variant.image || null,
          isActive: true,
        });
      });
      createdVariants = await Promise.all(variantPromises);
    }

    const populatedProduct = await Product.findById(product._id)
      .populate("category", "name slug")
      .populate("brand", "name slug")
      .populate("fitnessGoals", "name slug")
      .populate("sportsType", "name slug");

    return successResponse(
      res,
      "Product with variants created successfully",
      {
        product: populatedProduct,
        variants: createdVariants,
      },
      201,
    );
  } catch (error) {
    console.error("Error creating product with variants:", error);
    return errorResponse(res, error.message || "Failed to create product");
  }
};

// PUT /api/admin/products/:id
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return errorResponse(res, "Product not found", 404);
    }

    const updates = { ...req.body };

    if (updates.name && updates.name !== product.name) {
      updates.slug = slugify(updates.name, { lower: true, strict: true });
    }

    if (updates.price) updates.price = Number(updates.price);
    if (updates.discountPrice)
      updates.discountPrice = Number(updates.discountPrice);
    if (updates.stock !== undefined) updates.stock = Number(updates.stock);

    const updated = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    })
      .populate("category", "name slug")
      .populate("brand", "name slug")
      .populate("fitnessGoals", "name slug")
      .populate("sportsType", "name slug");

    return successResponse(res, "Product updated successfully", {
      product: updated,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return errorResponse(res, error.message || "Failed to update product");
  }
};

// DELETE /api/admin/products/:id
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    );

    if (!product) {
      return errorResponse(res, "Product not found", 404);
    }

    return successResponse(res, "Product deactivated successfully");
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// DELETE /api/admin/products/:id/image/:imageId
export const deleteProductImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return errorResponse(res, "Product not found", 404);
    }

    product.images = product.images.filter(
      (img) => img._id.toString() !== req.params.imageId,
    );

    if (
      !product.images.some((img) => img.isPrimary) &&
      product.images.length > 0
    ) {
      product.images[0].isPrimary = true;
    }

    await product.save();

    return successResponse(res, "Image removed successfully", {
      images: product.images,
    });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// ─── VARIANTS ────────────────────────────────────────────────────────────────

// POST /api/admin/products/:id/variants
export const addVariant = async (req, res) => {
  try {
    const { label, price, discountPrice, stock, sku, image } = req.body;

    if (!label) return errorResponse(res, "Variant label is required", 400);
    if (!price) return errorResponse(res, "Variant price is required", 400);

    const product = await Product.findById(req.params.id);
    if (!product) {
      return errorResponse(res, "Product not found", 404);
    }

    const existingVariant = await ProductVariant.findOne({
      product: req.params.id,
      label: label,
    });

    if (existingVariant) {
      return errorResponse(
        res,
        "A variant with this label already exists",
        400,
      );
    }

    const variantImage = req.file ? req.file.path : image || null;

    const variant = await ProductVariant.create({
      product: req.params.id,
      label,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : null,
      stock: Number(stock) || 0,
      sku: sku || null,
      image: variantImage,
      isActive: true,
    });

    return successResponse(res, "Variant added successfully", { variant }, 201);
  } catch (error) {
    console.error("Error adding variant:", error);
    return errorResponse(res, error.message || "Failed to add variant");
  }
};

// PUT /api/admin/products/:id/variants/:variantId
export const updateVariant = async (req, res) => {
  try {
    const { label, price, discountPrice, stock, sku, image, isActive } =
      req.body;

    const variant = await ProductVariant.findOne({
      _id: req.params.variantId,
      product: req.params.id,
    });

    if (!variant) {
      return errorResponse(res, "Variant not found", 404);
    }

    if (label && label !== variant.label) {
      const existingVariant = await ProductVariant.findOne({
        product: req.params.id,
        label: label,
        _id: { $ne: req.params.variantId },
      });
      if (existingVariant) {
        return errorResponse(
          res,
          "A variant with this label already exists",
          400,
        );
      }
    }

    const updates = {};
    if (label !== undefined) updates.label = label;
    if (price !== undefined) updates.price = Number(price);
    if (discountPrice !== undefined)
      updates.discountPrice = discountPrice ? Number(discountPrice) : null;
    if (stock !== undefined) updates.stock = Number(stock);
    if (sku !== undefined) updates.sku = sku || null;
    if (image !== undefined) updates.image = image || null;
    if (isActive !== undefined) updates.isActive = isActive;

    const updated = await ProductVariant.findByIdAndUpdate(
      req.params.variantId,
      updates,
      { new: true, runValidators: true },
    );

    return successResponse(res, "Variant updated successfully", {
      variant: updated,
    });
  } catch (error) {
    console.error("Error updating variant:", error);
    return errorResponse(res, error.message || "Failed to update variant");
  }
};

// DELETE /api/admin/products/:id/variants/:variantId
export const deleteVariant = async (req, res) => {
  try {
    const variant = await ProductVariant.findOneAndDelete({
      _id: req.params.variantId,
      product: req.params.id,
    });

    if (!variant) {
      return errorResponse(res, "Variant not found", 404);
    }

    return successResponse(res, "Variant deleted successfully");
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
