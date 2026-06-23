import Order from "../../models/Order.js";
import ShipmentTracking from "../../models/ShipmentTracking.js";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";

// GET /api/admin/orders
export const getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      paymentStatus,
      startDate,
      endDate,
      search,
    } = req.query;

    const filter = {};
    if (status) filter.orderStatus = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("user", "name email phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(filter),
    ]);

    return successResponse(res, "Orders fetched", {
      orders,
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

// GET /api/admin/orders/:id
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email phone")
      .populate("items.product", "name images sku");

    if (!order) return errorResponse(res, "Order not found", 404);

    const tracking = await ShipmentTracking.findOne({ order: order._id });

    return successResponse(res, "Order fetched", { order, tracking });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// PUT /api/admin/orders/:id/status
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return errorResponse(res, "Order not found", 404);

    order.orderStatus = orderStatus;
    if (orderStatus === "delivered") {
      order.deliveredAt = new Date();
      order.paymentStatus = "paid"; // mark paid on delivery confirmation for COD
    }

    await order.save();

    // push the new status to the tracking events log
    await ShipmentTracking.findOneAndUpdate(
      { order: order._id },
      {
        currentStatus: orderStatus,
        $push: {
          events: {
            status: orderStatus,
            description: `Order status updated to ${orderStatus}`,
            timestamp: new Date(),
          },
        },
        ...(orderStatus === "delivered" && { deliveredAt: new Date() }),
      }
    );

    return successResponse(res, "Order status updated", { order });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// PUT /api/admin/orders/:id/tracking
// admin enters the tracking number they got from the courier company
export const assignTrackingInfo = async (req, res) => {
  try {
    const { trackingNumber, courierProvider, courierTrackingUrl, estimatedDelivery } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return errorResponse(res, "Order not found", 404);

    order.trackingNumber = trackingNumber;
    order.courierProvider = courierProvider;
    order.estimatedDelivery = estimatedDelivery;
    order.orderStatus = "shipped";
    await order.save();

    await ShipmentTracking.findOneAndUpdate(
      { order: order._id },
      {
        trackingNumber,
        courierProvider,
        courierTrackingUrl,
        estimatedDelivery,
        currentStatus: "handed_to_courier",
        $push: {
          events: {
            status: "handed_to_courier",
            description: `Handed to ${courierProvider}. Tracking: ${trackingNumber}`,
            timestamp: new Date(),
          },
        },
      }
    );

    return successResponse(res, "Tracking info assigned", { order });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// GET /api/admin/orders/stats
// dashboard summary numbers
export const getOrderStats = async (req, res) => {
  try {
    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      deliveredOrders,
      cancelledOrders,
      revenueResult,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: "pending" }),
      Order.countDocuments({ orderStatus: { $in: ["confirmed", "processing", "shipped"] } }),
      Order.countDocuments({ orderStatus: "delivered" }),
      Order.countDocuments({ orderStatus: "cancelled" }),
      Order.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
    ]);

    return successResponse(res, "Stats fetched", {
      totalOrders,
      pendingOrders,
      processingOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue: revenueResult[0]?.total || 0,
    });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
