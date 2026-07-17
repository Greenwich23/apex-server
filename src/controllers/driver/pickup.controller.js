// controllers/driver/pickup.controller.js
import ReturnRequest from "../../models/ReturnRequest.js";
import DeliveryAgent from "../../models/DeliveryAgent.js";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";

export const getPickupDetails = async (req, res) => {
  try {
    const { token } = req.params;

    console.log("🔍 [getPickupDetails] Looking for pickup with token:", token);

    const returnRequest = await ReturnRequest.findOne({
      pickupToken: token,
      status: "pickup_assigned",
    })
      .populate("user", "name email phone")
      .populate("order", "orderId total shippingAddress")
      .populate("pickupAgent", "name phone");

    if (!returnRequest) {
      console.log("❌ [getPickupDetails] No pickup found for token:", token);
      return errorResponse(res, "Invalid or expired pickup link", 404);
    }

    console.log("✅ [getPickupDetails] Pickup found:", returnRequest._id);

    return successResponse(res, "Pickup details fetched", {
      returnRequest,
    });
  } catch (error) {
    console.error("❌ [getPickupDetails] Error:", error);
    return errorResponse(res, error.message);
  }
};

// ─── PUT /api/delivery/pickup/:token ────────────────────────────────────────
// Driver updates pickup status

export const updatePickupStatus = async (req, res) => {
  try {
    const { token } = req.params;
    const { status, notes } = req.body;

    console.log("🔍 [updatePickupStatus] Updating pickup with token:", token);
    console.log("📋 [updatePickupStatus] Status:", status);
    console.log("📋 [updatePickupStatus] Notes:", notes);

    // Validate status
    const validStatuses = ["picked_up", "failed"];
    if (!validStatuses.includes(status)) {
      return errorResponse(
        res,
        "Invalid status. Use 'picked_up' or 'failed'",
        400,
      );
    }

    const returnRequest = await ReturnRequest.findOne({
      pickupToken: token,
      status: "pickup_assigned",
    });

    if (!returnRequest) {
      console.log("❌ [updatePickupStatus] No pickup found for token:", token);
      return errorResponse(res, "Invalid or expired pickup link", 404);
    }

    console.log("✅ [updatePickupStatus] Pickup found:", returnRequest._id);

    // Update status
    if (status === "picked_up") {
      returnRequest.status = "picked_up";
      returnRequest.pickedUpAt = new Date();
      if (notes) returnRequest.adminNote = notes;
    } else if (status === "failed") {
      returnRequest.status = "pickup_failed";
      returnRequest.adminNote = notes || "Pickup failed";
    }

    await returnRequest.save();

    console.log("✅ [updatePickupStatus] Status updated to:", status);

    return successResponse(res, "Pickup status updated successfully", {
      returnRequest,
    });
  } catch (error) {
    console.error("❌ [updatePickupStatus] Error:", error);
    return errorResponse(res, error.message);
  }
};
