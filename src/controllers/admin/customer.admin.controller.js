import User from "../../models/User.js";
import Order from "../../models/Order.js";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";

// GET /api/admin/customers
export const getAllCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, isActive } = req.query;
    const filter = { role: "customer" };

    if (isActive !== undefined) filter.isActive = isActive === "true";

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [customers, total] = await Promise.all([
      User.find(filter)
        .select("name email phone avatar isActive loyaltyPoints createdAt lastLogin")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    return successResponse(res, "Customers fetched", {
      customers,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// GET /api/admin/customers/:id
export const getCustomerById = async (req, res) => {
  try {
    const customer = await User.findOne({
      _id: req.params.id,
      role: "customer",
    }).select("-password -otp -passwordResetToken -passwordResetExpires");

    if (!customer) return errorResponse(res, "Customer not found", 404);

    // get their order history summary
    const orders = await Order.find({ user: customer._id })
      .select("orderStatus total createdAt")
      .sort({ createdAt: -1 })
      .limit(10);

    const totalSpent = await Order.aggregate([
      { $match: { user: customer._id, paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);

    return successResponse(res, "Customer fetched", {
      customer,
      orders,
      totalSpent: totalSpent[0]?.total || 0,
    });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// PATCH /api/admin/customers/:id/toggle-status
export const toggleCustomerStatus = async (req, res) => {
  try {
    const customer = await User.findOne({ _id: req.params.id, role: "customer" });
    if (!customer) return errorResponse(res, "Customer not found", 404);

    customer.isActive = !customer.isActive;
    await customer.save();

    return successResponse(
      res,
      `Customer ${customer.isActive ? "activated" : "deactivated"}`,
      { isActive: customer.isActive }
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
