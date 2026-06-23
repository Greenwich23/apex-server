import ReturnRequest from "../../models/ReturnRequest.js";
import Payment from "../../models/Payment.js";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";

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
        .populate("order", "total createdAt paymentMethod")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ReturnRequest.countDocuments(filter),
    ]);

    return successResponse(res, "Return requests fetched", {
      returns,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// PUT /api/admin/returns/:id/resolve
export const resolveReturnRequest = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    // status here is: "approved" | "rejected" | "refunded" | "completed"

    const returnRequest = await ReturnRequest.findById(req.params.id)
      .populate("order");

    if (!returnRequest) return errorResponse(res, "Return request not found", 404);

    returnRequest.status = status;
    returnRequest.adminNote = adminNote;
    if (["refunded", "completed"].includes(status)) {
      returnRequest.resolvedAt = new Date();
    }

    await returnRequest.save();

    // if marking as refunded, update the payment record too
    if (status === "refunded") {
      await Payment.findOneAndUpdate(
        { order: returnRequest.order._id },
        { status: "refunded", refundedAt: new Date() }
      );
    }

    return successResponse(res, "Return request updated", { returnRequest });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
