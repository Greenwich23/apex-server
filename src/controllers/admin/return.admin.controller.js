// controllers/admin/return.controller.js
import ReturnRequest from "../../models/ReturnRequest.js";
import Payment from "../../models/Payment.js";
import Product from "../../models/Product.js"; // ✅ Add this import
import Order from "../../models/Order.js"; // ✅ Add this import
import DeliveryAgent from "../../models/DeliveryAgent.js";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";
import {
  notifyNewReturn,
  notifyReturnPickupUpdate,
} from "../../services/notificationService.js";
import {
  sendReturnPickupVerificationEmail,
  sendPickupAssignmentEmail,
} from "../../services/emailService.js";

// GET /api/admin/returns
export const getAllReturnRequests = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [returns, total] = await Promise.all([
      ReturnRequest.find(filter)
        .populate("user", "name email")
        .populate({
          path: "order",
          populate: {
            path: "items.product",
            select: "name images price sku",
          },
        })
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
      },
    });
  } catch (error) {
    console.error("❌ Error fetching return requests:", error);
    return errorResponse(res, error.message);
  }
};

// PUT /api/admin/returns/:id/status
export const updateReturnStatus = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const returnRequest = await ReturnRequest.findById(req.params.id);

    if (!returnRequest) {
      return errorResponse(res, "Return request not found", 404);
    }

    returnRequest.status = status;
    if (adminNote) returnRequest.adminNote = adminNote;

    if (status === "resolved") {
      returnRequest.resolvedAt = new Date();
    }

    await returnRequest.save();

    return successResponse(res, "Return status updated", { returnRequest });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// PUT /api/admin/returns/:id/resolve
export const resolveReturnRequest = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const returnRequest = await ReturnRequest.findById(req.params.id).populate({
      path: "order",
      populate: {
        path: "items.product",
        select: "name images price sku",
      },
    });

    if (!returnRequest) {
      return errorResponse(res, "Return request not found", 404);
    }

    returnRequest.status = status;
    returnRequest.adminNote = adminNote;
    if (["refunded", "completed"].includes(status)) {
      returnRequest.resolvedAt = new Date();
    }

    await returnRequest.save();

    if (status === "refunded") {
      await Payment.findOneAndUpdate(
        { order: returnRequest.order._id },
        { status: "refunded", refundedAt: new Date() },
      );
    }

    return successResponse(res, "Return request updated", { returnRequest });
  } catch (error) {
    console.error("❌ Error resolving return:", error);
    return errorResponse(res, error.message);
  }
};

// GET single return request by ID (with full details)
export const getReturnRequestById = async (req, res) => {
  try {
    const { returnRequestId } = req.params;

    const returnRequest = await ReturnRequest.findById(returnRequestId)
      .populate("user", "name email phone")
      .populate({
        path: "order",
        populate: {
          path: "items.product",
          select: "name images price sku",
        },
      })
      .populate("pickupAgent", "name phone photo");

    if (!returnRequest) {
      return errorResponse(res, "Return request not found", 404);
    }

    return successResponse(res, "Return request fetched", { returnRequest });
  } catch (error) {
    console.error("❌ Error fetching return request:", error);
    return errorResponse(res, error.message);
  }
};

// ─── GET /api/delivery/pickup/:returnRequestId ──────────────────────────────
// Public route for driver to view pickup details (no auth required)

export const getReturnRequestByIdPublic = async (req, res) => {
  try {
    const { returnRequestId } = req.params;

    console.log(
      "🔍 [getReturnRequestByIdPublic] Fetching return:",
      returnRequestId,
    );

    // ✅ First, get the return request with populated fields
    const returnRequest = await ReturnRequest.findById(returnRequestId)
      .populate("user", "name email phone")
      .populate("pickupAgent", "name phone");

    if (!returnRequest) {
      console.log("❌ [getReturnRequestByIdPublic] Return not found");
      return errorResponse(res, "Return request not found", 404);
    }

    // ✅ Check if return is in a valid state for pickup
    if (returnRequest.status !== "pickup_assigned") {
      return errorResponse(
        res,
        `Return is not ready for pickup. Current status: ${returnRequest.status}`,
        400,
      );
    }

    // ✅ Populate the order with product details
    if (returnRequest.order) {
      await returnRequest.populate({
        path: "order",
        populate: {
          path: "items.product",
          select: "name images price sku description",
        },
      });
    }

    // ✅ IMPORTANT: Populate the product details in the return items
    // The return items only have product IDs, we need to populate them
    if (returnRequest.items && returnRequest.items.length > 0) {
      // Populate the product for each return item
      await ReturnRequest.populate(returnRequest, {
        path: "items.product",
        select: "name images price sku description",
      });
    }

    console.log(
      "✅ [getReturnRequestByIdPublic] Return found:",
      returnRequest._id,
    );
    console.log(
      "📦 [getReturnRequestByIdPublic] Items with products:",
      returnRequest.items?.length,
    );

    return successResponse(res, "Return pickup details fetched", {
      returnRequest,
    });
  } catch (error) {
    console.error("❌ [getReturnRequestByIdPublic] Error:", error);
    return errorResponse(res, error.message);
  }
};

// ─── PUT /api/delivery/pickup/:returnRequestId/mark-picked-up ──────────────
// Public route for driver to mark pickup as completed (no auth required)

export const markReturnPickedUpPublic = async (req, res) => {
  try {
    const { returnRequestId } = req.params;
    const { notes } = req.body;

    console.log(
      "🔍 [markReturnPickedUpPublic] Marking return as picked up:",
      returnRequestId,
    );

    const returnRequest = await ReturnRequest.findById(returnRequestId)
      .populate("user", "name email")
      .populate("pickupAgent", "name email");

    if (!returnRequest) {
      return errorResponse(res, "Return request not found", 404);
    }

    if (returnRequest.status !== "pickup_assigned") {
      return errorResponse(
        res,
        `Return is not ready for pickup. Current status: ${returnRequest.status}`,
        400,
      );
    }

    // ✅ Update status to picked_up
    returnRequest.status = "picked_up";
    returnRequest.pickedUpAt = new Date();
    if (notes) returnRequest.adminNote = notes;

    await returnRequest.save();

    // ✅ Send notification to admin
    await notifyReturnPickupUpdate(returnRequest, "picked_up");
    console.log(
      `📢 Notification: Return ${returnRequestId} marked as picked up`,
    );

    return successResponse(res, "Return marked as picked up successfully", {
      returnRequest,
    });
  } catch (error) {
    console.error("❌ [markReturnPickedUpPublic] Error:", error);
    return errorResponse(res, error.message);
  }
};

// ─── Admin: Assign Pickup Agent ─────────────────────────────────────────────

export const assignPickupAgent = async (req, res) => {
  try {
    const { returnRequestId } = req.params;
    const { agentId } = req.body;

    console.log("🚀 [assignPickupAgent] Starting...");
    console.log("📋 [assignPickupAgent] Return ID:", returnRequestId);
    console.log("📋 [assignPickupAgent] Agent ID:", agentId);

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

    // ✅ Update the return request with pickup agent
    returnRequest.pickupAgent = agentId;
    returnRequest.pickupAssignedAt = new Date();
    returnRequest.status = "pickup_assigned";
    await returnRequest.save();

    // Add to agent's assigned orders
    if (!agent.assignedOrders.includes(returnRequestId)) {
      agent.assignedOrders.push(returnRequestId);
      await agent.save();
    }

    // ✅ Build the pickup link
    const baseUrl = process.env.CUSTOMER_URL || "http://localhost:5173";
    const pickupLink = `${baseUrl}/delivery/pickup/${returnRequestId}`;

    // ✅ Send email with the pickup link
    try {
      await sendPickupAssignmentEmail(agent.email, agent.name, {
        returnRequestId: returnRequest._id.toString(),
        orderId:
          returnRequest.order?.orderId ||
          returnRequest.order?._id.toString().slice(-8).toUpperCase(),
        customerName: returnRequest.user?.name || "Customer",
        address: returnRequest.order?.shippingAddress,
        pickupLink: pickupLink,
      });
      console.log("📧 [assignPickupAgent] Email sent to:", agent.email);
    } catch (emailError) {
      console.error("❌ [assignPickupAgent] Failed to send email:", emailError);
    }

    return successResponse(res, "Pickup agent assigned successfully", {
      returnRequest,
      pickupLink,
    });
  } catch (error) {
    console.error("❌ [assignPickupAgent] Error:", error);
    return errorResponse(res, error.message);
  }
};

// ─── Admin: Mark Return as Picked Up ──────────────────────────────────────

export const markReturnPickedUp = async (req, res) => {
  try {
    const { returnRequestId } = req.params;
    const { notes } = req.body;

    console.log(
      "🔍 [markReturnPickedUp] Marking return as picked up:",
      returnRequestId,
    );

    const returnRequest = await ReturnRequest.findById(returnRequestId)
      .populate("user", "name email")
      .populate("pickupAgent", "name email");

    if (!returnRequest) {
      return errorResponse(res, "Return request not found", 404);
    }

    if (returnRequest.status !== "pickup_assigned") {
      return errorResponse(
        res,
        `Return is not ready for pickup. Current status: ${returnRequest.status}`,
        400,
      );
    }

    returnRequest.status = "picked_up";
    returnRequest.pickedUpAt = new Date();
    if (notes) returnRequest.adminNote = notes;

    await returnRequest.save();

    await notifyReturnPickupUpdate(returnRequest, "picked_up");
    console.log(
      `📢 Notification: Return ${returnRequestId} marked as picked up`,
    );

    return successResponse(res, "Return marked as picked up successfully", {
      returnRequest,
    });
  } catch (error) {
    console.error("❌ [markReturnPickedUp] Error:", error);
    return errorResponse(res, error.message);
  }
};

// GET /api/admin/returns/pending-pickups
export const getPendingReturnPickups = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    console.log(
      "🔍 [getPendingReturnPickups] Fetching pending return pickups...",
    );

    const filter = {
      status: "picked_up",
    };

    const [returns, total] = await Promise.all([
      ReturnRequest.find(filter)
        .populate("user", "name email phone")
        .populate("pickupAgent", "name phone")
        .populate({
          path: "order",
          populate: {
            path: "items.product",
            select: "name images price sku",
          },
        })
        .sort({ pickedUpAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ReturnRequest.countDocuments(filter),
    ]);

    console.log(
      `✅ [getPendingReturnPickups] Found ${returns.length} pending pickups`,
    );

    return successResponse(res, "Pending return pickups fetched", {
      returns,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error("❌ [getPendingReturnPickups] Error:", error);
    return errorResponse(res, error.message);
  }
};

// PUT /api/admin/returns/:returnId/verify-pickup
export const verifyReturnPickup = async (req, res) => {
  try {
    const { returnId } = req.params;
    const { action, adminNote } = req.body;

    console.log(
      `🔍 [verifyReturnPickup] Verifying pickup for return: ${returnId}`,
    );
    console.log(`🔍 [verifyReturnPickup] Action: ${action}`);

    if (!action || !["received", "reject"].includes(action)) {
      return errorResponse(res, "Action must be 'received' or 'reject'", 400);
    }

    const returnRequest = await ReturnRequest.findById(returnId)
      .populate("user", "name email")
      .populate("pickupAgent", "name email");

    if (!returnRequest) {
      return errorResponse(res, "Return request not found", 404);
    }

    if (returnRequest.status !== "picked_up") {
      return errorResponse(
        res,
        `Return is not in picked_up state. Current status: ${returnRequest.status}`,
        400,
      );
    }

    if (action === "received") {
      returnRequest.status = "received";
      returnRequest.receivedAt = new Date();
      if (adminNote) returnRequest.adminNote = adminNote;

      await returnRequest.save();

      await sendReturnPickupVerificationEmail(
        returnRequest.pickupAgent?.email,
        {
          returnId: returnRequest._id.toString().slice(-8).toUpperCase(),
          status: "approved",
          adminNote: adminNote || "Return pickup verified by admin",
          customerName: returnRequest.user?.name || "Customer",
        },
      );

      await notifyReturnPickupUpdate(returnRequest, "received");

      return successResponse(res, "Return received successfully", {
        returnRequest,
      });
    } else if (action === "reject") {
      returnRequest.status = "pickup_failed";
      returnRequest.adminNote = adminNote || "Pickup verification failed";

      await returnRequest.save();

      await sendReturnPickupVerificationEmail(
        returnRequest.pickupAgent?.email,
        {
          returnId: returnRequest._id.toString().slice(-8).toUpperCase(),
          status: "rejected",
          adminNote:
            adminNote ||
            "Return pickup was not approved. Please contact support.",
          customerName: returnRequest.user?.name || "Customer",
        },
      );

      await notifyReturnPickupUpdate(returnRequest, "rejected");

      return successResponse(res, "Return pickup rejected. Driver notified.", {
        returnRequest,
      });
    }

    return errorResponse(
      res,
      "Invalid action. Use 'received' or 'reject'",
      400,
    );
  } catch (error) {
    console.error("❌ [verifyReturnPickup] Error:", error);
    return errorResponse(res, error.message);
  }
};
