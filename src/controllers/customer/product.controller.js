import Product from "../../models/Product.js";
import ProductVariant from "../../models/ProductVariant.js";
import Review from "../../models/Review.js";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";

// GET /api/products
// supports: ?category=&brand=&minPrice=&maxPrice=&sport=&goal=&material=
//           &sort=price_asc|price_desc|newest|rating&page=&limit=&search=
export const getProducts = async (req, res) => {
  try {
    const {
      category,
      brand,
      minPrice,
      maxPrice,
      sport,
      goal,
      material,
      sort,
      page = 1,
      limit = 12,
      search,
    } = req.query;

    const filter = { isActive: true };

    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    if (material) filter.material = new RegExp(material, "i");

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (sport) filter.sportsType = { $in: [sport] };
    if (goal) filter.fitnessGoals = { $in: [goal] };

    // full-text search using the index defined on the Product model
    if (search) {
      filter.$text = { $search: search };
    }

    const sortOptions = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      newest: { createdAt: -1 },
      rating: { averageRating: -1 },
    };

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug")
        .populate("brand", "name logo")
        .sort(sortOptions[sort] || { createdAt: -1 })
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
        limit: Number(limit),
      },
    });
  } catch (error) {
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

    // fetch variants separately
    const variants = await ProductVariant.find({
      product: product._id,
      isActive: true,
    });

    // fetch latest 10 reviews
    const reviews = await Review.find({ product: product._id })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 })
      .limit(10);

    return successResponse(res, "Product fetched", {
      product,
      variants,
      reviews,
    });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// GET /api/products/search/suggestions?q=
// for the live search dropdown as user types
export const getSearchSuggestions = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return successResponse(res, "Suggestions fetched", { suggestions: [] });
    }

    const products = await Product.find({
      isActive: true,
      $or: [
        { name: { $regex: q, $options: "i" } },
        { tags: { $in: [new RegExp(q, "i")] } },
      ],
    })
      .select("name slug images price") // only what the dropdown needs
      .limit(8);

    return successResponse(res, "Suggestions fetched", { suggestions: products });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// GET /api/products/:id/related
// products in the same category, excluding the current one
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
    return errorResponse(res, error.message);
  }
};
