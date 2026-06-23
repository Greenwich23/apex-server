import Order from "../../models/Order.js";
import User from "../../models/User.js";
import Product from "../../models/Product.js";
import ReturnRequest from "../../models/ReturnRequest.js";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";

// GET /api/admin/dashboard
export const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalCustomers,
      newCustomersThisMonth,
      totalProducts,
      lowStockProducts,
      pendingOrders,
      pendingReturns,
      revenueThisMonth,
      revenueLastMonth,
      recentOrders,
      monthlySales,
    ] = await Promise.all([

      User.countDocuments({ role: "customer" }),

      User.countDocuments({
        role: "customer",
        createdAt: { $gte: startOfMonth },
      }),

      Product.countDocuments({ isActive: true }),

      // products with stock below 10 — admin should restock
      Product.countDocuments({ stock: { $lt: 10 }, isActive: true }),

      Order.countDocuments({ orderStatus: "pending" }),

      ReturnRequest.countDocuments({ status: "pending" }),

      // revenue this month
      Order.aggregate([
        {
          $match: {
            paymentStatus: "paid",
            createdAt: { $gte: startOfMonth },
          },
        },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),

      // revenue last month (for comparison)
      Order.aggregate([
        {
          $match: {
            paymentStatus: "paid",
            createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
          },
        },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),

      // last 5 orders for the dashboard feed
      Order.find()
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .limit(5)
        .select("user total orderStatus createdAt"),

      // monthly revenue for the last 6 months — used for the sales chart
      Order.aggregate([
        {
          $match: {
            paymentStatus: "paid",
            createdAt: {
              $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1),
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            revenue: { $sum: "$total" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
    ]);

    const thisMonthRevenue = revenueThisMonth[0]?.total || 0;
    const lastMonthRevenue = revenueLastMonth[0]?.total || 0;

    // calculate revenue growth percentage
    const revenueGrowth =
      lastMonthRevenue === 0
        ? 100
        : (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1);

    return successResponse(res, "Dashboard stats fetched", {
      stats: {
        totalCustomers,
        newCustomersThisMonth,
        totalProducts,
        lowStockProducts,
        pendingOrders,
        pendingReturns,
        revenueThisMonth,
        revenueGrowth: Number(revenueGrowth),
      },
      recentOrders,
      monthlySales,
    });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// GET /api/admin/dashboard/low-stock
// dedicated endpoint for inventory alerts
export const getLowStockProducts = async (req, res) => {
  try {
    const { threshold = 10 } = req.query;

    const products = await Product.find({
      stock: { $lt: Number(threshold) },
      isActive: true,
    })
      .populate("category", "name")
      .select("name stock sku images category")
      .sort({ stock: 1 }); // most critical first

    return successResponse(res, "Low stock products fetched", { products });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
