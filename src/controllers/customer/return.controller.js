import ReturnRequest from "../../models/ReturnRequest.js";
import Order from "../../models/Order.js";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";
import mongoose from "mongoose";
import { notifyNewReturn } from "../../services/notificationService.js";

// POST /api/returns
export const createReturnRequest = async (req, res) => {
  try {
    const { orderId, items, type, reason } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      user: req.user.id,
    });

    if (!order) return errorResponse(res, "Order not found", 404);

    if (order.orderStatus !== "delivered") {
      return errorResponse(res, "Only delivered orders can be returned", 400);
    }

    const existing = await ReturnRequest.findOne({
      order: orderId,
      user: req.user.id,
    });
    if (existing) {
      return errorResponse(
        res,
        "A return request already exists for this order",
        400,
      );
    }

    const images = req.files ? req.files.map((f) => f.path) : [];

    const returnRequest = await ReturnRequest.create({
      order: orderId,
      user: req.user.id,
      items,
      type,
      reason,
      images,
    });

    await returnRequest.populate("user", "name email");

    await notifyNewReturn(returnRequest);
    console.log("📢 New return request notification sent");

    return successResponse(
      res,
      "Return request submitted",
      { returnRequest },
      201,
    );
  } catch (error) {
    console.error("❌ Error creating return request:", error);
    return errorResponse(res, error.message);
  }
};

// GET /api/returns
export const getMyReturnRequests = async (req, res) => {
  try {
    const returns = await ReturnRequest.find({ user: req.user.id })
      .populate("order", "createdAt total orderStatus")
      .sort({ createdAt: -1 });

    return successResponse(res, "Return requests fetched", { returns });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// GET /api/returns/:id
export const getReturnRequestById = async (req, res) => {
  try {
    const returnRequest = await ReturnRequest.findOne({
      _id: req.params.id,
      user: req.user.id,
    }).populate("order", "items total createdAt");

    if (!returnRequest)
      return errorResponse(res, "Return request not found", 404);

    return successResponse(res, "Return request fetched", { returnRequest });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// controllers/customer/return.controller.js
// controllers/customer/return.controller.js

// controllers/customer/return.controller.js

export const getReturnByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log(
      `🔍 [getReturnByOrderId] Looking for return with orderId: ${orderId}`,
    );
    console.log(`🔍 [getReturnByOrderId] User ID: ${req.user.id}`);

    // ✅ Convert to ObjectId using mongoose
    const orderObjectId = new mongoose.Types.ObjectId(orderId);

    const returnRequest = await ReturnRequest.findOne({
      order: orderObjectId,
      user: req.user.id,
      isActive: true,
    }).populate("order", "orderId total");

    console.log(`🔍 [getReturnByOrderId] Found return:`, returnRequest);

    if (!returnRequest) {
      console.log(
        `❌ [getReturnByOrderId] No return request found for order ${orderId}`,
      );
      return errorResponse(res, "No return request found for this order", 404);
    }

    console.log(`✅ [getReturnByOrderId] Return found: ${returnRequest._id}`);
    return successResponse(res, "Return request fetched", { returnRequest });
  } catch (error) {
    console.error("❌ [getReturnByOrderId] Error:", error);
    return errorResponse(res, error.message);
  }
};
