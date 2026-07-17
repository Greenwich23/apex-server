// controllers/admin/dashboard.controller.js
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
      totalOrders,
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

      Order.countDocuments(),

      User.countDocuments({
        role: "customer",
        createdAt: { $gte: startOfMonth },
      }),

      Product.countDocuments({ isActive: true }),

      Product.countDocuments({ stock: { $lt: 10 }, isActive: true }),

      Order.countDocuments({ orderStatus: "pending" }),

      ReturnRequest.countDocuments({ status: "pending" }),

      // ✅ Revenue this month - extract the total
      Order.aggregate([
        {
          $match: {
            paymentStatus: "paid",
            createdAt: { $gte: startOfMonth },
          },
        },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),

      // ✅ Revenue last month - extract the total
      Order.aggregate([
        {
          $match: {
            paymentStatus: "paid",
            createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
          },
        },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),

      Order.find()
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .limit(5)
        .select("user total orderStatus createdAt"),

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

    // ✅ Extract revenue values from aggregation results
    const thisMonthRevenue = revenueThisMonth[0]?.total || 0;
    const lastMonthRevenue = revenueLastMonth[0]?.total || 0;

    // ✅ Calculate revenue growth
    const revenueGrowth =
      lastMonthRevenue === 0
        ? 100
        : (
            ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) *
            100
          ).toFixed(1);

    // ✅ Format monthly sales for chart
    const formattedMonthlySales = monthlySales.map((item) => {
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const monthName = monthNames[item._id.month - 1];
      return {
        label: `${monthName} ${item._id.year}`,
        revenue: item.revenue,
        orders: item.orders,
        month: item._id.month,
        year: item._id.year,
      };
    });

    return successResponse(res, "Dashboard stats fetched", {
      stats: {
        totalCustomers,
        totalOrders,
        newCustomersThisMonth,
        totalProducts,
        lowStockProducts,
        pendingOrders,
        pendingReturns,
        revenueThisMonth: thisMonthRevenue, // ✅ Return the actual number, not the aggregation array
        revenueLastMonth: lastMonthRevenue, // ✅ For comparison
        revenueGrowth: Number(revenueGrowth),
      },
      recentOrders,
      monthlySales: formattedMonthlySales,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return errorResponse(res, error.message);
  }
};

// GET /api/admin/dashboard/low-stock
export const getLowStockProducts = async (req, res) => {
  try {
    const { threshold = 10 } = req.query;

    const products = await Product.find({
      stock: { $lt: Number(threshold) },
      isActive: true,
    })
      .populate("category", "name")
      .select("name stock sku images category")
      .sort({ stock: 1 });

    return successResponse(res, "Low stock products fetched", { products });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
