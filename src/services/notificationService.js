// services/notification.service.js
import Notification from "../models/Notification.js";
import logger from "../utils/logger.js";

const notificationConfigs = {
  order: {
    icon: "🛒",
    color: "#3B82F6",
  },
  customer: {
    icon: "👤",
    color: "#10B981",
  },
  payment: {
    icon: "💰",
    color: "#F59E0B",
  },
  return: {
    icon: "📦",
    color: "#8B5CF6",
  },
  delivery: {
    icon: "🚚",
    color: "#06B6D4",
  },
  review: {
    icon: "⭐",
    color: "#F59E0B",
  },
  support: {
    icon: "🎫",
    color: "#EF4444",
  },
  refund: {
    icon: "↩️",
    color: "#10B981",
  },
  system: {
    icon: "🔔",
    color: "#6B7280",
  },
};

export const createNotification = async (data) => {
  try {
    const { type, title, message, link, data: extraData, expiresIn } = data;
    const config = notificationConfigs[type] || notificationConfigs.system;

    const notification = await Notification.create({
      type,
      title,
      message,
      link: link || null,
      icon: config.icon,
      color: config.color,
      data: extraData || {},
      expiresAt: expiresIn ? new Date(Date.now() + expiresIn) : null,
    });

    logger.info(`📢 Notification created: ${title} (${type})`);
    return notification;
  } catch (error) {
    logger.error("Error creating notification:", error);
    return null;
  }
};

// ─── Helper functions for specific notifications ────────────────────────────

export const notifyNewOrder = async (order, user) => {
  return createNotification({
    type: "order",
    title: "New Order Received",
    message: `Order #${order.orderNumber} from ${user?.name || "Customer"}`,
    link: `/orders/${order._id}`,
    data: { orderId: order._id, customerId: user?._id },
  });
};

export const notifyNewCustomer = async (user) => {
  console.log("New customer registered");
  return createNotification({
    type: "customer",
    title: "New Customer Registered",
    message: `${user.name} (${user.email}) just created an account`,
    link: `/customers/${user._id}`,
    data: { customerId: user._id },
  });
};

export const notifyNewPayment = async (payment, order) => {
  return createNotification({
    type: "payment",
    title: "Payment Received",
    message: `Payment of ${payment.amount} received for order #${order.orderId || order._id.slice(-8).toUpperCase()}`,
    link: `/orders/${order._id}`,
    data: { paymentId: payment._id, orderId: order._id },
  });
};

// services/notificationService.js

export const notifyNewReturn = async (returnRequest) => {
  const returnId = returnRequest._id.toString();

  return createNotification({
    type: "return",
    title: "New Return Request",
    message: `Return request #${returnId.slice(-8).toUpperCase()} from ${returnRequest.user?.name || "Customer"}`,
    link: `/returns/${returnRequest._id}`,
    data: { returnId: returnRequest._id },
  });
};

export const notifyDeliveryUpdate = async (order, status) => {
  const orderId = order._id.toString();

  return createNotification({
    type: "delivery",
    title: "Delivery Status Updated",
    message: `Order #${orderId.slice(-8).toUpperCase()} is now ${status}`,
    link: `/orders/${order._id}`,
    data: { orderId: order._id, deliveryStatus: status },
  });
};

export const notifyNewReview = async (review, product) => {
  return createNotification({
    type: "review",
    title: "New Product Review",
    message: `${review.user?.name || "Customer"} reviewed ${product?.name || "a product"}`,
    link: `/products/${product?._id}`,
    data: { reviewId: review._id, productId: product?._id },
  });
};

export const notifyNewSupportTicket = async (ticket) => {
  const ticketId = ticket._id.toString();

  return createNotification({
    type: "support",
    title: "New Support Ticket",
    message: `Ticket #${ticketId.slice(-8).toUpperCase()}: ${ticket.subject}`,
    link: `/support/${ticket._id}`,
    data: { ticketId: ticket._id },
  });
};

export const notifyRefundProcessed = async (returnRequest) => {
  return createNotification({
    type: "refund",
    title: "Refund Processed",
    message: `Refund of ${returnRequest.refundAmount} processed for return #${returnRequest._id.slice(-8).toUpperCase()}`,
    link: `/returns/${returnRequest._id}`,
    data: { returnId: returnRequest._id },
  });
};

// services/notificationService.js

// ─── Notify Admin of Return Pickup Update ──────────────────────────────────

export const notifyReturnPickupUpdate = async (returnRequest, status) => {
  try {
    const returnId = returnRequest._id.toString();
    const shortId = returnId.slice(-8).toUpperCase();
    const customerName = returnRequest.user?.name || "Customer";
    const agentName = returnRequest.pickupAgent?.name || "Driver";

    let title = "";
    let message = "";
    let type = "return";

    switch (status) {
      case "picked_up":
        title = "📦 Return Picked Up";
        message = `${agentName} has picked up return #${shortId} from ${customerName}`;
        break;
      case "received":
        title = "✅ Return Received";
        message = `Return #${shortId} has been received and verified by admin`;
        break;
      case "rejected":
        title = "❌ Return Pickup Rejected";
        message = `Return #${shortId} pickup was rejected. Please re-assign.`;
        break;
      default:
        title = "🔄 Return Pickup Updated";
        message = `Return #${shortId} status updated to ${status}`;
    }

    return createNotification({
      type: type,
      title: title,
      message: message,
      link: `/returns/${returnRequest._id}`,
      data: {
        returnId: returnRequest._id,
        status: status,
        customerId: returnRequest.user?._id,
        agentId: returnRequest.pickupAgent?._id,
      },
    });
  } catch (error) {
    console.error("❌ [notifyReturnPickupUpdate] Error:", error);
    return null;
  }
};
