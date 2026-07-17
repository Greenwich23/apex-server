// utils/notificationHelper.js
import Notification from "../models/Notification.js";

/**
 * Create a notification for a user (fire and forget)
 */
export const createNotification = async ({
  userId,
  type,
  title,
  message,
  data = {},
  priority = "medium",
  actionUrl = null,
}) => {
  try {
    console.log("🔔 [NOTIFICATION] Creating notification for user:", userId);
    console.log("🔔 [NOTIFICATION] Title:", title);

    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      data,
      priority,
      actionUrl,
    });

    console.log("✅ [NOTIFICATION] Created successfully:", {
      id: notification._id,
      userId: notification.user,
      title: notification.title,
      isRead: notification.isRead,
    });

    return notification;
  } catch (error) {
    console.error("❌ [NOTIFICATION] Error creating notification:", error);
    return null;
  }
};

// ✅ ADMIN NOTIFICATIONS - When users place orders
export const notifyAdminOrderPlaced = async (order, adminUser) => {
  console.log("🔔 [ADMIN NOTIFICATION] New order placed by customer");
  console.log("🔔 [ADMIN NOTIFICATION] Order:", order.orderNumber);
  console.log("🔔 [ADMIN NOTIFICATION] Admin:", adminUser.email);

  return createNotification({
    userId: adminUser._id,
    type: "order_placed",
    title: "🛒 New Order Placed",
    message: `Order #${order.orderNumber} has been placed by a customer. Total: ₦${order.total.toLocaleString()}`,
    data: {
      orderId: order._id,
      orderNumber: order.orderNumber,
      total: order.total,
      customerName: order.shippingAddress?.fullName || "Customer",
    },
    priority: "high",
    actionUrl: `/admin/orders/${order._id}`,
  });
};

// ✅ ADMIN NOTIFICATION - Payment received
export const notifyAdminPaymentReceived = async (order, adminUser) => {
  return createNotification({
    userId: adminUser._id,
    type: "payment_success",
    title: "💰 Payment Received",
    message: `Payment of ₦${order.total.toLocaleString()} received for order #${order.orderNumber}`,
    data: {
      orderId: order._id,
      orderNumber: order.orderNumber,
      amount: order.total,
      paymentMethod: order.paymentMethod,
    },
    priority: "high",
    actionUrl: `/admin/orders/${order._id}`,
  });
};

// ✅ ADMIN NOTIFICATION - Order cancelled by customer
export const notifyAdminOrderCancelled = async (order, adminUser) => {
  return createNotification({
    userId: adminUser._id,
    type: "order_cancelled",
    title: "❌ Order Cancelled by Customer",
    message: `Order #${order.orderNumber} has been cancelled by the customer.`,
    data: {
      orderId: order._id,
      orderNumber: order.orderNumber,
    },
    priority: "medium",
    actionUrl: `/admin/orders/${order._id}`,
  });
};

// ✅ ADMIN NOTIFICATION - Low stock alert
export const notifyAdminLowStock = async (product, adminUser) => {
  return createNotification({
    userId: adminUser._id,
    type: "inventory_low",
    title: "⚠️ Low Stock Alert",
    message: `Product "${product.name}" has only ${product.stock} units left in stock.`,
    data: {
      productId: product._id,
      productName: product.name,
      stock: product.stock,
    },
    priority: "high",
    actionUrl: `/admin/products/${product._id}`,
  });
};

// ✅ USER NOTIFICATIONS (Keep existing ones for customers)
export const notifyOrderPlaced = async (order, user) => {
  return createNotification({
    userId: user._id,
    type: "order_placed",
    title: "✅ Order Placed Successfully",
    message: `Your order #${order.orderNumber} has been placed successfully. Total: ₦${order.total.toLocaleString()}`,
    data: {
      orderId: order._id,
      orderNumber: order.orderNumber,
      total: order.total,
    },
    priority: "high",
    actionUrl: `/account/orders/${order._id}`,
  });
};

export const notifyOrderConfirmed = async (order, user) => {
  return createNotification({
    userId: user._id,
    type: "order_confirmed",
    title: "✅ Order Confirmed",
    message: `Your order #${order.orderNumber} has been confirmed and is being processed.`,
    data: {
      orderId: order._id,
      orderNumber: order.orderNumber,
    },
    priority: "high",
    actionUrl: `/account/orders/${order._id}`,
  });
};

export const notifyOrderShipped = async (order, user) => {
  return createNotification({
    userId: user._id,
    type: "order_shipped",
    title: "🚚 Order Shipped",
    message: `Your order #${order.orderNumber} has been shipped. Tracking: ${order.trackingNumber || "N/A"}`,
    data: {
      orderId: order._id,
      orderNumber: order.orderNumber,
      trackingNumber: order.trackingNumber,
      courierProvider: order.courierProvider,
    },
    priority: "high",
    actionUrl: `/account/orders/${order._id}`,
  });
};

export const notifyOrderDelivered = async (order, user) => {
  return createNotification({
    userId: user._id,
    type: "order_delivered",
    title: "📦 Order Delivered",
    message: `Your order #${order.orderNumber} has been delivered. Thank you for shopping with us!`,
    data: {
      orderId: order._id,
      orderNumber: order.orderNumber,
      deliveredAt: order.deliveredAt,
    },
    priority: "high",
    actionUrl: `/account/orders/${order._id}`,
  });
};

export const notifyOrderCancelled = async (order, user) => {
  return createNotification({
    userId: user._id,
    type: "order_cancelled",
    title: "❌ Order Cancelled",
    message: `Your order #${order.orderNumber} has been cancelled.`,
    data: {
      orderId: order._id,
      orderNumber: order.orderNumber,
    },
    priority: "medium",
    actionUrl: `/account/orders/${order._id}`,
  });
};

export const notifyPaymentSuccess = async (order, user) => {
  return createNotification({
    userId: user._id,
    type: "payment_success",
    title: "💰 Payment Successful",
    message: `Payment of ₦${order.total.toLocaleString()} for order #${order.orderNumber} was successful.`,
    data: {
      orderId: order._id,
      orderNumber: order.orderNumber,
      amount: order.total,
      paymentMethod: order.paymentMethod,
    },
    priority: "high",
    actionUrl: `/account/orders/${order._id}`,
  });
};

export const notifyPaymentFailed = async (order, user, reason = "") => {
  return createNotification({
    userId: user._id,
    type: "payment_failed",
    title: "⚠️ Payment Failed",
    message: `Payment for order #${order.orderNumber} failed. ${reason ? `Reason: ${reason}` : "Please try again."}`,
    data: {
      orderId: order._id,
      orderNumber: order.orderNumber,
      reason: reason,
    },
    priority: "high",
    actionUrl: `/account/orders/${order._id}`,
  });
};
