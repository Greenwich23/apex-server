// controllers/customer/product.controller.js

import Product from "../../models/Product.js";
import ProductVariant from "../../models/ProductVariant.js";
import Category from "../../models/Category.js";
import Sport from "../../models/Sport.js";
import FitnessGoal from "../../models/FitnessGoal.js";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";
import Review from "../../models/Review.js";

// GET /api/products
export const getProducts = async (req, res) => {
  try {
    const {
      category,
      brand,
      brands,
      minPrice,
      maxPrice,
      sport,
      goal,
      material,
      sort,
      page = 1,
      limit = 9,
      search,
      minRating,
    } = req.query;

    const filter = { isActive: true };

    // =====================
    // SEARCH
    // =====================
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [
        { name: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
        { tags: { $in: [searchRegex] } },
      ];
    }

    // =====================
    // CATEGORY FILTER
    // =====================
    if (category) {
      const isObjectId = category.match(/^[0-9a-fA-F]{24}$/);
      if (isObjectId) {
        filter.category = category;
      } else {
        const categoryDoc = await Category.findOne({
          name: category,
          isActive: true,
        });
        if (categoryDoc) {
          filter.category = categoryDoc._id;
        } else {
          return successResponse(res, "Products fetched", {
            products: [],
            pagination: { total: 0, page: 1, pages: 0, limit: Number(limit) },
            categoryCounts: {},
          });
        }
      }
    }

    // =====================
    // BRAND FILTER
    // =====================
    let brandNames = [];

    if (brands) {
      brandNames = brands
        .split(",")
        .map((b) => b.trim())
        .filter(Boolean);
    } else if (brand) {
      brandNames = Array.isArray(brand) ? brand : [brand];
    }

    if (brandNames.length > 0) {
      const brandDocs = await Brand.find({
        name: { $in: brandNames },
        isActive: true,
      });

      if (brandDocs.length > 0) {
        const brandIds = brandDocs.map((b) => b._id);
        filter.brand = { $in: brandIds };
      } else {
        return successResponse(res, "Products fetched", {
          products: [],
          pagination: { total: 0, page: 1, pages: 0, limit: Number(limit) },
          categoryCounts: {},
        });
      }
    }

    // =====================
    // PRICE RANGE
    // =====================
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // =====================
    // SPORT FILTER
    // =====================
    if (sport) {
      const sportDoc = await Sport.findOne({
        name: { $regex: new RegExp(`^${sport}$`, "i") },
        isActive: true,
      });

      if (sportDoc) {
        filter.sportsType = { $in: [sportDoc._id] };
      } else {
        return successResponse(res, "Products fetched", {
          products: [],
          pagination: { total: 0, page: 1, pages: 0, limit: Number(limit) },
          categoryCounts: {},
        });
      }
    }

    // =====================
    // MATERIAL FILTER
    // =====================
    if (material) {
      filter.material = new RegExp(material, "i");
    }

    // =====================
    // RATING FILTER
    // =====================
    if (minRating) {
      filter.averageRating = { $gte: Number(minRating) };
    }

    // =====================
    // SORTING
    // =====================
    const sortOptions = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      newest: { createdAt: -1 },
      rating: { averageRating: -1 },
      most_reviewed: { totalReviews: -1 },
    };

    const skip = (Number(page) - 1) * Number(limit);

    console.log("🔍 Filter:", JSON.stringify(filter, null, 2));

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug")
        .populate("brand", "name logo")
        .populate("fitnessGoals", "name slug")
        .populate("sportsType", "name slug")
        .sort(sortOptions[sort] || { createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    // Get variants for products
    const productIds = products.map((p) => p._id);
    const variants = await ProductVariant.find({
      product: { $in: productIds },
      isActive: true,
    });

    // ✅ FIXED: Map products with proper discount fields
    const productsWithVariants = products.map((product) => {
      const productVariants = variants.filter(
        (v) => v.product.toString() === product._id.toString(),
      );
      const productObj = product.toObject();

      // ✅ Ensure discount fields are included
      return {
        ...productObj,
        // ✅ If discountPrice exists, use it. Otherwise use price as fallback
        discountPrice: productObj.discountPrice || null,
        originalPrice: productObj.originalPrice || null,
        // ✅ Price should be the regular price
        price: productObj.price || 0,
        variants: productVariants,
        hasVariants: productVariants.length > 0,
        // ✅ For frontend convenience
        displayPrice: productObj.discountPrice || productObj.price || 0,
        isOnSale: !!(
          productObj.discountPrice &&
          productObj.discountPrice < productObj.price
        ),
      };
    });

    // =====================
    // GET CATEGORY COUNTS
    // =====================
    const categoryCounts = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryData",
        },
      },
      { $unwind: "$categoryData" },
      {
        $group: {
          _id: "$categoryData.name",
          count: { $sum: 1 },
        },
      },
    ]);

    const countsMap = {};
    categoryCounts.forEach((item) => {
      countsMap[item._id] = item.count;
    });

    const allCategories = await Category.find({ isActive: true });
    const categoryOptions = [
      { equipment: "All", count: total || 0 },
      ...allCategories.map((cat) => ({
        equipment: cat.name,
        count: countsMap[cat.name] || 0,
      })),
    ];

    return successResponse(res, "Products fetched", {
      products: productsWithVariants,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
      categoryCounts: categoryOptions,
    });
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    console.error("❌ Error stack:", error.stack);
    return errorResponse(res, error.message);
  }
};

// GET /api/products/:slug
export const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({
      slug: req.params.slug,
      isActive: true,
    })
      .populate("category", "name slug")
      .populate("brand", "name logo");

    if (!product) return errorResponse(res, "Product not found", 404);

    const variants = await ProductVariant.find({
      product: product._id,
      isActive: true,
    });

    const reviews = await Review.find({ product: product._id })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 })
      .limit(10);

    // ✅ Also include discount info in single product response
    const productObj = product.toObject();
    const productWithDiscount = {
      ...productObj,
      discountPrice: productObj.discountPrice || null,
      originalPrice: productObj.originalPrice || null,
      displayPrice: productObj.discountPrice || productObj.price || 0,
      isOnSale: !!(
        productObj.discountPrice && productObj.discountPrice < productObj.price
      ),
    };

    return successResponse(res, "Product fetched", {
      product: productWithDiscount,
      variants,
      reviews,
    });
  } catch (error) {
    console.error("❌ Error fetching product by slug:", error);
    return errorResponse(res, error.message);
  }
};

// ... rest of your functions (getSearchSuggestions, getRelatedProducts, getFeaturedProducts)

// GET /api/products/search/suggestions?q=
export const getSearchSuggestions = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return successResponse(res, "Suggestions fetched", { suggestions: [] });
    }

    const searchRegex = new RegExp(q.trim(), "i");
    const products = await Product.find({
      isActive: true,
      $or: [
        { name: { $regex: searchRegex } },
        { tags: { $in: [searchRegex] } },
      ],
    })
      .select("name slug images price")
      .limit(8);

    return successResponse(res, "Suggestions fetched", {
      suggestions: products,
    });
  } catch (error) {
    console.error("❌ Error fetching suggestions:", error);
    return errorResponse(res, error.message);
  }
};

// GET /api/products/:id/related
export const getRelatedProducts = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return errorResponse(res, "Product not found", 404);

    const related = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      isActive: true,
    })
      .populate("brand", "name")
      .limit(6);

    return successResponse(res, "Related products fetched", { related });
  } catch (error) {
    console.error("❌ Error fetching related products:", error);
    return errorResponse(res, error.message);
  }
};

// GET /api/products/featured
export const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ isFeatured: true, isActive: true })
      .populate("category", "name slug")
      .populate("brand", "name logo")
      .limit(8);

    return successResponse(res, "Featured products fetched", { products });
  } catch (error) {
    console.error("❌ Error fetching featured products:", error);
    return errorResponse(res, error.message);
  }
};

// controllers/product.controller.js
export const getCategoryCounts = async (req, res) => {
  try {
    // Get all categories
    const categories = await Category.find({ isActive: true });

    // Get product counts per category
    const counts = {};

    for (const category of categories) {
      const count = await Product.countDocuments({
        category: category._id,
        isActive: true,
      });
      counts[category._id] = count;
      counts[category.name] = count;
    }

    return successResponse(res, "Category counts fetched", { data: counts });
  } catch (error) {
    console.error("Error fetching category counts:", error);
    return errorResponse(res, error.message);
  }
};
