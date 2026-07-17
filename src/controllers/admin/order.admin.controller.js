import Order from "../../models/Order.js";
import ShipmentTracking from "../../models/ShipmentTracking.js";
import User from "../../models/User.js";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";
import {
  notifyOrderConfirmed,
  notifyOrderShipped,
  notifyOrderDelivered,
  notifyAdminOrderCancelled,
} from "../../utils/notificationHelper.js";

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

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Search functionality
    if (search && typeof search === "string") {
      const searchTerm = search.trim();

      // Check if it's a number (digits only) - could be an order number without ORD- prefix
      if (/^\d{6,}$/.test(searchTerm)) {
        // Search for order number with ORD- prefix
        filter.orderNumber = `ORD-${searchTerm}`;
      }
      // Check if it's an order number with ORD- prefix
      else if (/^ORD-\d{6}$/.test(searchTerm)) {
        filter.orderNumber = searchTerm;
      }
      // Check if it's a valid ObjectId
      else if (/^[0-9a-fA-F]{24}$/.test(searchTerm)) {
        filter._id = searchTerm;
      } else {
        const searchRegex = { $regex: searchTerm, $options: "i" };

        // Find users matching the search term
        const users = await User.find({
          $or: [
            { name: searchRegex },
            { email: searchRegex },
            { phone: searchRegex },
          ],
        }).select("_id");

        const userIds = users.map((user) => user._id);

        // Build $or query
        const orConditions = [];

        if (userIds.length > 0) {
          orConditions.push({ user: { $in: userIds } });
        }

        orConditions.push(
          { "shippingAddress.fullName": searchRegex },
          { "shippingAddress.phone": searchRegex },
          { "shippingAddress.email": searchRegex },
          { trackingNumber: searchRegex },
          { courierProvider: searchRegex },
          { orderNumber: searchRegex },
        );

        filter.$or = orConditions;
      }
    } else {
      // Only apply status filters if no search term
      if (status) filter.orderStatus = status;
      if (paymentStatus) filter.paymentStatus = paymentStatus;
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
    console.error("❌ Error in getAllOrders:", error);
    return errorResponse(res, error.message);
  }
};

// GET /api/admin/orders/:id
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    let filter = {};

    // Check if it's an order number with ORD- prefix
    if (/^ORD-\d{6}$/.test(id)) {
      filter.orderNumber = id;
    }
    // Check if it's just numbers (order number without ORD-)
    else if (/^\d{6}$/.test(id)) {
      filter.orderNumber = `ORD-${id}`;
    }
    // Otherwise treat as ObjectId
    else {
      filter._id = id;
    }

    const order = await Order.findOne(filter)
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
    console.log("🔔 [ADMIN] updateOrderStatus called");
    console.log("🔔 [ADMIN] Order ID:", req.params.id);
    console.log("🔔 [ADMIN] New status:", req.body.orderStatus);

    const { orderStatus } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      console.log("❌ [ADMIN] Order not found");
      return errorResponse(res, "Order not found", 404);
    }

    console.log("🔔 [ADMIN] Order found:", {
      orderNumber: order.orderNumber,
      currentStatus: order.orderStatus,
      userId: order.user,
    });

    const previousStatus = order.orderStatus;

    order.orderStatus = orderStatus;
    if (orderStatus === "delivered") {
      order.deliveredAt = new Date();
      order.paymentStatus = "paid";
    }

    await order.save();
    console.log("✅ [ADMIN] Order saved with new status:", orderStatus);

    // Send notification based on status change
    console.log("🔔 [ADMIN] Looking up user for notification...");
    const user = await User.findById(order.user);
    console.log("🔔 [ADMIN] User found:", user ? user.email : "NO USER FOUND");

    if (user && previousStatus !== orderStatus) {
      console.log(
        `🔔 [ADMIN] Status changed from ${previousStatus} to ${orderStatus}`,
      );
      console.log(`🔔 [ADMIN] Sending notification for: ${orderStatus}`);

      switch (orderStatus) {
        case "confirmed":
          console.log("🔔 [ADMIN] Calling notifyOrderConfirmed...");
          try {
            const result = await notifyOrderConfirmed(order, user);
            console.log("✅ [ADMIN] notifyOrderConfirmed result:", result);
          } catch (err) {
            console.error("❌ [ADMIN] notifyOrderConfirmed error:", err);
          }
          break;
        case "shipped":
          console.log("🔔 [ADMIN] Calling notifyOrderShipped...");
          try {
            const result = await notifyOrderShipped(order, user);
            console.log("✅ [ADMIN] notifyOrderShipped result:", result);
          } catch (err) {
            console.error("❌ [ADMIN] notifyOrderShipped error:", err);
          }
          break;
        case "delivered":
          console.log("🔔 [ADMIN] Calling notifyOrderDelivered...");
          try {
            const result = await notifyOrderDelivered(order, user);
            console.log("✅ [ADMIN] notifyOrderDelivered result:", result);
          } catch (err) {
            console.error("❌ [ADMIN] notifyOrderDelivered error:", err);
          }
          break;
        default:
          console.log(
            `🔔 [ADMIN] No notification configured for status: ${orderStatus}`,
          );
      }
    } else {
      console.log("🔔 [ADMIN] Skipping notification:");
      if (!user) console.log("  - No user found");
      if (previousStatus === orderStatus)
        console.log("  - Status didn't change");
    }

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
      },
    );

    console.log("✅ [ADMIN] Order status update complete");
    return successResponse(res, "Order status updated", { order });
  } catch (error) {
    console.error("❌ [ADMIN] Error in updateOrderStatus:", error);
    return errorResponse(res, error.message);
  }
};

// PUT /api/admin/orders/:id/tracking
export const assignTrackingInfo = async (req, res) => {
  try {
    console.log("🔔 [ADMIN] assignTrackingInfo called");
    console.log("🔔 [ADMIN] Order ID:", req.params.id);
    console.log("🔔 [ADMIN] Tracking data:", req.body);

    const {
      trackingNumber,
      courierProvider,
      courierTrackingUrl,
      estimatedDelivery,
    } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      console.log("❌ [ADMIN] Order not found");
      return errorResponse(res, "Order not found", 404);
    }

    console.log("🔔 [ADMIN] Order found:", {
      orderNumber: order.orderNumber,
      userId: order.user,
    });

    order.trackingNumber = trackingNumber;
    order.courierProvider = courierProvider;
    order.estimatedDelivery = estimatedDelivery;
    order.orderStatus = "shipped";
    await order.save();
    console.log("✅ [ADMIN] Order saved with tracking info");

    // Send shipping notification when tracking is assigned
    console.log("🔔 [ADMIN] Looking up user for shipping notification...");
    const user = await User.findById(order.user);
    console.log("🔔 [ADMIN] User found:", user ? user.email : "NO USER FOUND");

    if (user) {
      console.log("🔔 [ADMIN] Calling notifyOrderShipped...");
      try {
        const result = await notifyOrderShipped(order, user);
        console.log("✅ [ADMIN] notifyOrderShipped result:", result);
      } catch (err) {
        console.error("❌ [ADMIN] notifyOrderShipped error:", err);
      }
    } else {
      console.log("❌ [ADMIN] No user found for notification");
    }

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
      },
    );

    console.log("✅ [ADMIN] Tracking assignment complete");
    return successResponse(res, "Tracking info assigned", { order });
  } catch (error) {
    console.error("❌ [ADMIN] Error in assignTrackingInfo:", error);
    return errorResponse(res, error.message);
  }
};

// GET /api/admin/orders/stats
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
      Order.countDocuments({
        orderStatus: { $in: ["confirmed", "processing", "shipped"] },
      }),
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
