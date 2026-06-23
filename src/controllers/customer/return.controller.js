import ReturnRequest from "../../models/ReturnRequest.js";
import Order from "../../models/Order.js";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";

// POST /api/returns
export const createReturnRequest = async (req, res) => {
  try {
    const { orderId, items, type, reason } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      user: req.user.id,
    });

    if (!order) return errorResponse(res, "Order not found", 404);

    // can only return delivered orders
    if (order.orderStatus !== "delivered") {
      return errorResponse(
        res,
        "Only delivered orders can be returned",
        400
      );
    }

    // check if return already requested for this order
    const existing = await ReturnRequest.findOne({ order: orderId, user: req.user.id });
    if (existing) {
      return errorResponse(res, "A return request already exists for this order", 400);
    }

    // images of damaged item from customer (optional)
    const images = req.files ? req.files.map((f) => f.path) : [];

    const returnRequest = await ReturnRequest.create({
      order: orderId,
      user: req.user.id,
      items,
      type,
      reason,
      images,
    });

    // update order status so admin can see it's under return review
    order.orderStatus = "returned";
    await order.save();

    return successResponse(res, "Return request submitted", { returnRequest }, 201);
  } catch (error) {
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

    if (!returnRequest) return errorResponse(res, "Return request not found", 404);

    return successResponse(res, "Return request fetched", { returnRequest });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
