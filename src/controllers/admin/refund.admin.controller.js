// controllers/admin/refund.controller.js
import Order from "../../models/Order.js";
import Payment from "../../models/Payment.js";
import ReturnRequest from "../../models/ReturnRequest.js";
import DeliveryAgent from "../../models/DeliveryAgent.js";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";
import {
  sendRefundNotificationEmail,
  sendPickupAssignmentEmail,
} from "../../services/emailService.js";
import logger from "../../utils/logger.js";

// ─── Admin: Assign Pickup Agent for Return ──────────────────────────────────

export const assignPickupAgent = async (req, res) => {
  try {
    const { returnRequestId } = req.params;
    const { agentId } = req.body;

    const returnRequest = await ReturnRequest.findById(returnRequestId)
      .populate("order")
      .populate("user");

    if (!returnRequest) {
      return errorResponse(res, "Return request not found", 404);
    }

    if (returnRequest.status !== "approved") {
      return errorResponse(res, "Return request must be approved first", 400);
    }

    const agent = await DeliveryAgent.findById(agentId);
    if (!agent) {
      return errorResponse(res, "Delivery agent not found", 404);
    }

    if (agent.status !== "active") {
      return errorResponse(res, "Delivery agent is not active", 400);
    }

    // Update return request with pickup agent
    returnRequest.pickupAgent = agentId;
    returnRequest.pickupAssignedAt = new Date();
    returnRequest.status = "pickup_assigned";
    await returnRequest.save();

    // Add to agent's assigned orders
    if (!agent.assignedOrders.includes(returnRequest._id)) {
      agent.assignedOrders.push(returnRequest._id);
      await agent.save();
    }

    // Send notification to agent
    await sendPickupAssignmentEmail(agent.email, agent.name, {
      returnRequestId: returnRequest._id,
      orderId: returnRequest.order.orderId || returnRequest.order._id,
      customerName: returnRequest.user.name,
      address: returnRequest.order.shippingAddress,
    });

    return successResponse(res, "Pickup agent assigned successfully", {
      returnRequest,
    });
  } catch (error) {
    logger.error("Error assigning pickup agent:", error);
    return errorResponse(res, error.message);
  }
};

// ─── Driver: Mark Return as Picked Up ───────────────────────────────────────

export const markReturnPickedUp = async (req, res) => {
  try {
    const { returnRequestId } = req.params;
    const { notes } = req.body;

    const returnRequest = await ReturnRequest.findById(returnRequestId);

    if (!returnRequest) {
      return errorResponse(res, "Return request not found", 404);
    }

    if (returnRequest.status !== "pickup_assigned") {
      return errorResponse(res, "Return is not in pickup assigned state", 400);
    }

    returnRequest.status = "picked_up";
    returnRequest.pickedUpAt = new Date();
    if (notes) returnRequest.adminNote = notes;
    await returnRequest.save();

    return successResponse(res, "Return marked as picked up", {
      returnRequest,
    });
  } catch (error) {
    logger.error("Error marking return as picked up:", error);
    return errorResponse(res, error.message);
  }
};

// ─── Admin: Mark Return as Received ─────────────────────────────────────────

export const markReturnReceived = async (req, res) => {
  try {
    const { returnRequestId } = req.params;

    const returnRequest = await ReturnRequest.findById(returnRequestId)
      .populate("order")
      .populate("user");

    if (!returnRequest) {
      return errorResponse(res, "Return request not found", 404);
    }

    if (returnRequest.status !== "picked_up") {
      return errorResponse(res, "Return has not been picked up yet", 400);
    }

    returnRequest.status = "received";
    returnRequest.receivedAt = new Date();
    await returnRequest.save();

    // Notify admin that item is received and ready for refund
    return successResponse(res, "Return marked as received", {
      returnRequest,
    });
  } catch (error) {
    logger.error("Error marking return as received:", error);
    return errorResponse(res, error.message);
  }
};

// ─── Admin: Process Refund ──────────────────────────────────────────────────

export const processRefund = async (req, res) => {
  try {
    const { returnRequestId } = req.params;
    const { refundAmount, adminNote } = req.body;

    // 1. Get return request
    const returnRequest = await ReturnRequest.findById(returnRequestId)
      .populate("order")
      .populate("user");

    if (!returnRequest) {
      return errorResponse(res, "Return request not found", 404);
    }

    // ✅ Must be in "received" or "approved" status
    if (!["received", "approved"].includes(returnRequest.status)) {
      return errorResponse(
        res,
        `Return must be received or approved before refund. Current status: ${returnRequest.status}`,
        400,
      );
    }

    // 2. Get the order
    const order = returnRequest.order;
    if (!order) {
      return errorResponse(res, "Order not found", 404);
    }

    // 3. Get payment record
    const payment = await Payment.findOne({ order: order._id });
    if (!payment) {
      return errorResponse(res, "Payment record not found", 404);
    }

    // 4. Calculate refund amount
    const amount = refundAmount || calculateRefundAmount(returnRequest, order);

    // 5. Process refund (simulated for development)
    const refundResult = await processRefundByMethod(payment, amount);

    // 6. Update return request
    returnRequest.refundAmount = amount;
    returnRequest.refundStatus = refundResult.status;
    returnRequest.refundId = refundResult.id || null;
    returnRequest.refundDate = new Date();
    returnRequest.status =
      refundResult.status === "completed" ? "refunded" : returnRequest.status;
    returnRequest.adminNote = adminNote || returnRequest.adminNote;
    returnRequest.resolvedAt = new Date();
    await returnRequest.save();

    // 7. Update order status
    if (refundResult.status === "completed") {
      order.orderStatus = "refunded";
      order.paymentStatus = "refunded";
      await order.save();
    }

    // 8. Send refund notification email to customer
    await sendRefundNotificationEmail(returnRequest.user.email, {
      orderId: order.orderId || order._id,
      amount: amount,
      refundStatus: refundResult.status,
      reason: returnRequest.reason,
      items: returnRequest.items,
    });

    return successResponse(res, "Refund processed successfully", {
      returnRequest,
      refund: refundResult,
    });
  } catch (error) {
    console.error("❌ Refund error:", error);
    return errorResponse(res, error.message);
  }
};

// ─── Helper: Calculate Refund Amount ──────────────────────────────────────

const calculateRefundAmount = (returnRequest, order) => {
  let total = 0;
  returnRequest.items.forEach((item) => {
    const orderItem = order.items.find(
      (oi) => oi.product.toString() === item.product.toString(),
    );
    if (orderItem) {
      total += (orderItem.price || 0) * item.quantity;
    }
  });
  return total;
};

// ─── Helper: Process Refund by Payment Method ─────────────────────────────

const processRefundByMethod = async (payment, amount) => {
  // For development with "fake money", simulate the refund
  console.log(`💰 Processing refund of ${amount} for payment ${payment._id}`);
  console.log(`💰 Payment method: ${payment.provider}`);

  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // For all payment methods in development, return success
  return {
    id: `REF_${Date.now()}`,
    status: "completed",
    amount: amount,
    message: `Refund processed successfully via ${payment.provider}`,
  };
};

// ─── Admin: Get Return Requests ─────────────────────────────────────────────

export const getReturnRequests = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [returns, total] = await Promise.all([
      ReturnRequest.find(filter)
        .populate("user", "name email")
        .populate("order", "total orderId")
        .populate("pickupAgent", "name phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ReturnRequest.countDocuments(filter),
    ]);

    return successResponse(res, "Return requests fetched", {
      returns,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (error) {
    logger.error("Error fetching return requests:", error);
    return errorResponse(res, error.message);
  }
};

// ─── Admin: Get Single Return Request ──────────────────────────────────────

export const getReturnRequestById = async (req, res) => {
  try {
    const { returnRequestId } = req.params;

    const returnRequest = await ReturnRequest.findById(returnRequestId)
      .populate("user", "name email phone")
      .populate("order", "total orderId shippingAddress items")
      .populate("pickupAgent", "name phone photo");

    if (!returnRequest) {
      return errorResponse(res, "Return request not found", 404);
    }

    return successResponse(res, "Return request fetched", { returnRequest });
  } catch (error) {
    logger.error("Error fetching return request:", error);
    return errorResponse(res, error.message);
  }
};

// ─── Admin: Update Return Request Status ───────────────────────────────────

export const updateReturnStatus = async (req, res) => {
  try {
    const { returnRequestId } = req.params;
    const { status, adminNote } = req.body;

    const validStatuses = [
      "pending",
      "approved",
      "rejected",
      "refunded",
      "completed",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, "Invalid status", 400);
    }

    const returnRequest = await ReturnRequest.findById(returnRequestId);
    if (!returnRequest) {
      return errorResponse(res, "Return request not found", 404);
    }

    returnRequest.status = status;
    if (adminNote) returnRequest.adminNote = adminNote;
    if (["refunded", "completed", "rejected"].includes(status)) {
      returnRequest.resolvedAt = new Date();
    }

    await returnRequest.save();

    // If approved, notify user
    if (status === "approved") {
      await sendReturnApprovedEmail(returnRequest.user.email, {
        returnRequestId: returnRequest._id,
        orderId: returnRequest.order,
      });
    }

    return successResponse(res, "Return status updated", { returnRequest });
  } catch (error) {
    logger.error("Error updating return status:", error);
    return errorResponse(res, error.message);
  }
};
