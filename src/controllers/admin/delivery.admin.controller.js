// controllers/admin/delivery.admin.controller.js
import Order from "../../models/Order.js";
import DeliveryAgent from "../../models/DeliveryAgent.js";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";
import {
  generateDeliveryToken,
  generateDeliveryLink,
} from "../../utils/generateDeliveryToken.js";
import {
  sendDeliveryAssignmentEmail,
  sendDeliveryConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendDeliveryVerificationResultEmail,
} from "../../services/emailService.js";
import logger from "../../utils/logger.js";
import { notifyDeliveryUpdate } from "../../services/notificationService.js";

// ==================== Delivery Agent CRUD ====================

// GET all delivery agents
export const getAllDeliveryAgents = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, vehicleType } = req.query;

    const filter = {};

    // Search by name, email, or phone
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by status
    if (status) {
      filter.status = status;
    }

    // Filter by vehicle type
    if (vehicleType) {
      filter.vehicleType = vehicleType;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [agents, total] = await Promise.all([
      DeliveryAgent.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      DeliveryAgent.countDocuments(filter),
    ]);

    return successResponse(res, "Delivery agents fetched successfully", {
      agents,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (error) {
    logger.error("Error fetching delivery agents:", error);
    return errorResponse(res, error.message);
  }
};

// GET single delivery agent by ID
export const getDeliveryAgentById = async (req, res) => {
  try {
    const { id } = req.params;

    const agent = await DeliveryAgent.findById(id);
    if (!agent) {
      return errorResponse(res, "Delivery agent not found", 404);
    }

    // Get agent's assigned and completed orders
    const orders = await Order.find({
      $or: [{ deliveryAgent: id }, { assignedOrders: { $in: [id] } }],
    })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    return successResponse(res, "Delivery agent fetched successfully", {
      agent,
      orders,
    });
  } catch (error) {
    logger.error("Error fetching delivery agent:", error);
    return errorResponse(res, error.message);
  }
};

// POST create new delivery agent
export const createDeliveryAgent = async (req, res) => {
  try {
    const { name, email, phone, vehicleType, vehicleNumber, status } = req.body;

    // Check if agent already exists
    const existingAgent = await DeliveryAgent.findOne({ email });
    if (existingAgent) {
      return errorResponse(
        res,
        "Delivery agent with this email already exists",
        400,
      );
    }

    // Check if phone already exists
    const existingPhone = await DeliveryAgent.findOne({ phone });
    if (existingPhone) {
      return errorResponse(
        res,
        "Delivery agent with this phone number already exists",
        400,
      );
    }

    // Create new agent
    const agentData = {
      name,
      email,
      phone,
      vehicleType,
      vehicleNumber: vehicleNumber || "",
      status: status || "active",
    };

    // Add photo if uploaded
    if (req.file) {
      agentData.photo = req.file.path || req.file.location;
    }

    const agent = await DeliveryAgent.create(agentData);

    logger.info(`New delivery agent created: ${agent.email}`);
    return successResponse(
      res,
      "Delivery agent created successfully",
      { agent },
      201,
    );
  } catch (error) {
    logger.error("Error creating delivery agent:", error);
    return errorResponse(res, error.message);
  }
};

// PUT update delivery agent
export const updateDeliveryAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, vehicleType, vehicleNumber, status } = req.body;

    const agent = await DeliveryAgent.findById(id);
    if (!agent) {
      return errorResponse(res, "Delivery agent not found", 404);
    }

    // Check if email is being changed and is unique
    if (email && email !== agent.email) {
      const existingAgent = await DeliveryAgent.findOne({ email });
      if (existingAgent) {
        return errorResponse(res, "Email already in use", 400);
      }
    }

    // Update fields
    if (name) agent.name = name;
    if (email) agent.email = email;
    if (phone) agent.phone = phone;
    if (vehicleType) agent.vehicleType = vehicleType;
    if (vehicleNumber !== undefined) agent.vehicleNumber = vehicleNumber;
    if (status) agent.status = status;

    // Update photo if uploaded
    if (req.file) {
      agent.photo = req.file.path || req.file.location;
    }

    await agent.save();

    logger.info(`Delivery agent updated: ${agent.email}`);
    return successResponse(res, "Delivery agent updated successfully", {
      agent,
    });
  } catch (error) {
    logger.error("Error updating delivery agent:", error);
    return errorResponse(res, error.message);
  }
};

// PATCH toggle agent status (active/inactive)
export const toggleDeliveryAgentStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const agent = await DeliveryAgent.findById(id);
    if (!agent) {
      return errorResponse(res, "Delivery agent not found", 404);
    }

    // Toggle status: active -> inactive, inactive -> active
    agent.status = agent.status === "active" ? "inactive" : "active";
    await agent.save();

    logger.info(
      `Delivery agent ${agent.email} status toggled to ${agent.status}`,
    );
    return successResponse(
      res,
      `Agent ${agent.status === "active" ? "activated" : "deactivated"} successfully`,
      {
        agent,
      },
    );
  } catch (error) {
    logger.error("Error toggling agent status:", error);
    return errorResponse(res, error.message);
  }
};

// DELETE delivery agent
export const deleteDeliveryAgent = async (req, res) => {
  try {
    const { id } = req.params;

    const agent = await DeliveryAgent.findById(id);
    if (!agent) {
      return errorResponse(res, "Delivery agent not found", 404);
    }

    // Check if agent has active deliveries
    const activeOrders = await Order.findOne({
      deliveryAgent: id,
      deliveryStatus: { $nin: ["delivered", "failed"] },
    });

    if (activeOrders) {
      return errorResponse(
        res,
        "Cannot delete agent with active deliveries",
        400,
      );
    }

    await agent.deleteOne();

    logger.info(`Delivery agent deleted: ${agent.email}`);
    return successResponse(res, "Delivery agent deleted successfully");
  } catch (error) {
    logger.error("Error deleting delivery agent:", error);
    return errorResponse(res, error.message);
  }
};

// ==================== Order Assignment ====================

// POST assign delivery agent to order
// controllers/admin/delivery.admin.controller.js - Updated assignDeliveryAgent

export const assignDeliveryAgent = async (req, res) => {
  try {
    const { orderId, agentId } = req.body;

    console.log("🚀 [assignDeliveryAgent] Starting...");
    console.log("📋 [assignDeliveryAgent] Order ID:", orderId);
    console.log("📋 [assignDeliveryAgent] Agent ID:", agentId);

    if (!orderId || !agentId) {
      return errorResponse(res, "Order ID and Agent ID are required", 400);
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return errorResponse(res, "Order not found", 404);
    }

    console.log("📋 [assignDeliveryAgent] Order found:", order._id);
    console.log(
      "📋 [assignDeliveryAgent] Order deliveryAgent:",
      order.deliveryAgent,
    );

    // Check if order is already assigned
    if (order.deliveryAgent) {
      return errorResponse(
        res,
        "Order already assigned to a delivery agent",
        400,
      );
    }

    const agent = await DeliveryAgent.findById(agentId);
    if (!agent) {
      return errorResponse(res, "Delivery agent not found", 404);
    }

    // Check if agent is active
    if (agent.status !== "active") {
      return errorResponse(res, "Delivery agent is not active", 400);
    }

    // Generate unique token for this delivery
    const token = generateDeliveryToken();
    const deliveryLink = generateDeliveryLink(orderId, token);

    console.log("🔑 [assignDeliveryAgent] Generated token:", token);
    console.log("🔗 [assignDeliveryAgent] Delivery link:", deliveryLink);

    // Update order
    order.deliveryAgent = agentId;
    order.deliveryToken = token;
    order.deliveryStatus = "assigned";
    order.assignedAt = new Date();

    console.log("📋 [assignDeliveryAgent] Order before save:", {
      deliveryAgent: order.deliveryAgent,
      deliveryToken: order.deliveryToken,
      deliveryStatus: order.deliveryStatus,
    });

    await order.save();

    console.log("✅ [assignDeliveryAgent] Order saved successfully");

    // Add order to agent's assigned list
    if (!agent.assignedOrders.includes(orderId)) {
      agent.assignedOrders.push(orderId);
      await agent.save();
    }

    // Send email to delivery agent
    try {
      await sendDeliveryAssignmentEmail(agent.email, agent.name, {
        orderId: order.orderId || order._id.toString().slice(-8).toUpperCase(),
        customerName: order.shippingAddress?.fullName || "Customer",
        deliveryAddress: order.shippingAddress,
        deliveryLink,
        orderTotal: order.total,
        items: order.items,
        customerPhone: order.shippingAddress?.phone,
        specialInstructions: order.deliveryNotes || order.specialInstructions,
      });
      console.log("📧 [assignDeliveryAgent] Email sent to:", agent.email);
    } catch (emailError) {
      logger.error("Failed to send delivery assignment email:", emailError);
      // Don't fail the assignment if email fails
    }

    return successResponse(res, "Delivery agent assigned successfully", {
      order,
      deliveryLink,
    });
  } catch (error) {
    logger.error("Error assigning delivery agent:", error);
    return errorResponse(res, error.message);
  }
};

// POST unassign delivery agent from order
export const unassignDeliveryAgent = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return errorResponse(res, "Order not found", 404);
    }

    // Check if order has a delivery agent assigned
    if (!order.deliveryAgent) {
      return errorResponse(
        res,
        "No delivery agent assigned to this order",
        400,
      );
    }

    // Get the agent to remove the order from their assigned list
    const agent = await DeliveryAgent.findById(order.deliveryAgent);
    if (agent) {
      // Remove order from agent's assigned orders
      agent.assignedOrders = agent.assignedOrders.filter(
        (id) => id.toString() !== orderId.toString(),
      );
      await agent.save();
    }

    // Remove delivery agent from order
    order.deliveryAgent = null;
    order.deliveryToken = null;
    order.deliveryStatus = "pending";
    order.assignedAt = null;

    await order.save();

    logger.info(`Delivery agent unassigned from order ${orderId}`);
    return successResponse(res, "Delivery agent unassigned successfully", {
      order,
    });
  } catch (error) {
    logger.error("Error unassigning delivery agent:", error);
    return errorResponse(res, error.message);
  }
};

// ==================== Delivery Status Updates ====================

// GET delivery update page (public - uses token)
export const getDeliveryUpdatePage = async (req, res) => {
  try {
    const { orderId, token } = req.params;

    console.log("🔍 [getDeliveryUpdatePage] Order ID:", orderId);
    console.log("🔍 [getDeliveryUpdatePage] Token:", token);

    const order = await Order.findOne({
      _id: orderId,
      deliveryToken: token,
    }).populate("deliveryAgent", "name");

    if (!order) {
      console.log(
        "❌ [getDeliveryUpdatePage] Order not found or token mismatch",
      );

      // ✅ Check if the request expects JSON (from your frontend app)
      const acceptsJson = req.headers.accept?.includes("application/json");

      if (acceptsJson) {
        return res.status(404).json({
          success: false,
          message: "Invalid or expired delivery link",
        });
      }

      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
          <head><title>Invalid Link</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2>❌ Invalid or Expired Link</h2>
            <p>This delivery link is not valid. Please contact support.</p>
          </body>
        </html>
      `);
    }

    console.log("✅ [getDeliveryUpdatePage] Order found:", order._id);

    // ✅ Check if the request expects JSON
    const acceptsJson = req.headers.accept?.includes("application/json");

    if (acceptsJson) {
      // ✅ Return JSON for your React app
      return res.status(200).json({
        success: true,
        data: { order },
      });
    }

    // ✅ Return HTML for legacy delivery page (if accessed directly)
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Update Delivery Status - Order #${order.orderId || order._id}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #f5f5f5;
              padding: 20px;
            }
            .container {
              max-width: 500px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              padding: 30px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h2 { margin-bottom: 10px; color: #333; }
            .order-info { 
              background: #f8f9fa;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .order-info p { margin: 5px 0; color: #555; }
            .status-badge {
              display: inline-block;
              padding: 6px 12px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: 600;
              margin: 10px 0;
            }
            .status-pending { background: #fff3cd; color: #856404; }
            .status-picked_up { background: #cce5ff; color: #004085; }
            .status-in_transit { background: #d4edda; color: #155724; }
            .status-delivered { background: #28a745; color: white; }
            .status-failed { background: #f8d7da; color: #721c24; }
            
            .btn-group {
              display: flex;
              flex-direction: column;
              gap: 10px;
              margin: 20px 0;
            }
            .btn {
              padding: 12px 20px;
              border: none;
              border-radius: 8px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s;
            }
            .btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
            .btn-primary { background: #007bff; color: white; }
            .btn-success { background: #28a745; color: white; }
            .btn-warning { background: #ffc107; color: #333; }
            .btn-danger { background: #dc3545; color: white; }
            .btn-secondary { background: #6c757d; color: white; }
            
            .note-input {
              width: 100%;
              padding: 10px;
              border: 1px solid #ddd;
              border-radius: 8px;
              margin: 10px 0;
              font-size: 14px;
              resize: vertical;
            }
            .proof-upload {
              margin: 10px 0;
            }
            .proof-upload input {
              display: block;
              width: 100%;
              padding: 10px;
              border: 1px dashed #ddd;
              border-radius: 8px;
            }
            .loading { display: none; }
            .message {
              padding: 15px;
              border-radius: 8px;
              margin: 10px 0;
              display: none;
            }
            .message.success { background: #d4edda; color: #155724; display: block; }
            .message.error { background: #f8d7da; color: #721c24; display: block; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>🚚 Delivery Update</h2>
            <p style="color: #666; margin-bottom: 20px;">Order #${order.orderId || order._id}</p>
            
            <div class="order-info">
              <p><strong>Customer:</strong> ${order.shippingAddress?.fullName || "N/A"}</p>
              <p><strong>Address:</strong> ${order.shippingAddress?.address || "N/A"}</p>
              <p><strong>Phone:</strong> ${order.shippingAddress?.phone || "N/A"}</p>
            </div>

            <div style="text-align: center;">
              <span class="status-badge status-${order.deliveryStatus}">
                Current Status: ${order.deliveryStatus?.replace("_", " ").toUpperCase() || "PENDING"}
              </span>
            </div>

            <div id="messageContainer"></div>

            <div id="statusForm">
              <div class="btn-group">
                <button class="btn btn-warning" onclick="updateStatus('picked_up')">
                  📦 Picked Up
                </button>
                <button class="btn btn-primary" onclick="updateStatus('in_transit')">
                  🚚 In Transit
                </button>
                <button class="btn btn-success" onclick="updateStatus('delivered')">
                  ✅ Delivered
                </button>
                <button class="btn btn-danger" onclick="updateStatus('failed')">
                  ❌ Delivery Failed
                </button>
              </div>

              <textarea 
                id="notes" 
                class="note-input" 
                placeholder="Add delivery notes (optional)"
                rows="3"
              ></textarea>

              <div class="proof-upload">
                <input 
                  type="text" 
                  id="proofImage" 
                  placeholder="Paste delivery proof image URL (optional)"
                />
              </div>
            </div>

            <div id="loading" style="text-align: center; display: none;">
              <p>Updating status...</p>
            </div>
          </div>

          <script>
            async function updateStatus(status) {
              const notes = document.getElementById('notes').value;
              const proofImage = document.getElementById('proofImage').value;
              const form = document.getElementById('statusForm');
              const loading = document.getElementById('loading');
              const messageContainer = document.getElementById('messageContainer');

              form.style.display = 'none';
              loading.style.display = 'block';
              messageContainer.innerHTML = '';

              try {
                const response = await fetch('/api/delivery/update/${orderId}/${token}', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status, notes, proofImage })
                });

                const data = await response.json();

                if (data.success) {
                  messageContainer.innerHTML = \`
                    <div class="message success">
                      ✅ Delivery status updated to: \${status.replace('_', ' ').toUpperCase()}
                      <br>
                      <small>Page will refresh in 2 seconds...</small>
                    </div>
                  \`;
                  
                  setTimeout(() => {
                    window.location.reload();
                  }, 2000);
                } else {
                  throw new Error(data.message || 'Failed to update status');
                }
              } catch (error) {
                messageContainer.innerHTML = \`
                  <div class="message error">
                    ❌ Error: \${error.message}
                  </div>
                \`;
                form.style.display = 'block';
                loading.style.display = 'none';
              }
            }
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("❌ [getDeliveryUpdatePage] Error:", error);

    const acceptsJson = req.headers.accept?.includes("application/json");

    if (acceptsJson) {
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }

    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Error</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2>❌ Server Error</h2>
          <p>Something went wrong. Please try again later.</p>
        </body>
      </html>
    `);
  }
};

export const updateDeliveryStatus = async (req, res) => {
  try {
    const { orderId, token } = req.params;
    const { status, notes, proofImage } = req.body;

    console.log("🔍 [updateDeliveryStatus] Driver updating status:", status);

    // Validate status - Driver can only set these statuses
    const validStatuses = ["picked_up", "in_transit", "delivered", "failed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery status",
      });
    }

    // Find order by ID and token
    const order = await Order.findOne({
      _id: orderId,
      deliveryToken: token,
    }).populate("deliveryAgent");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Invalid delivery link or order not found",
      });
    }

    // ✅ Update based on status
    switch (status) {
      case "picked_up":
        order.deliveryStatus = "picked_up";
        order.pickedUpAt = new Date();
        break;
      case "in_transit":
        order.deliveryStatus = "in_transit";
        break;
      case "delivered":
        // ✅ Driver marks as delivered → goes to pending_verification
        order.deliveryStatus = "pending_verification";
        order.deliveredAt = new Date();
        if (proofImage) order.deliveryProof = proofImage;
        if (notes) order.deliveryNotes = notes;
        break;
      case "failed":
        order.deliveryStatus = "failed";
        break;
    }

    if (notes && status !== "delivered") order.deliveryNotes = notes;
    if (proofImage && status !== "delivered") {
      order.deliveryProof = proofImage;
    }

    await order.save();

    // ✅ If driver marked as delivered, create notification for admin
    if (status === "delivered") {
      console.log(
        `📧 [updateDeliveryStatus] Notification: Delivery pending verification for order ${orderId}`,
      );

      // ✅ CREATE NOTIFICATION - Delivery pending verification
      await notifyDeliveryUpdate(order, "pending_verification");
      console.log(
        `📢 Notification: Delivery pending verification for order ${orderId}`,
      );
    }

    // ✅ If driver picked up, create notification
    if (status === "picked_up") {
      await notifyDeliveryUpdate(order, "picked_up");
      console.log(`📢 Notification: Order picked up for delivery ${orderId}`);
    }

    // ✅ If driver in transit, create notification
    if (status === "in_transit") {
      await notifyDeliveryUpdate(order, "in_transit");
      console.log(`📢 Notification: Order in transit ${orderId}`);
    }

    // ✅ If delivery failed, create notification
    if (status === "failed") {
      await notifyDeliveryUpdate(order, "failed");
      console.log(`📢 Notification: Delivery failed for order ${orderId}`);
    }

    return res.status(200).json({
      success: true,
      message:
        status === "delivered"
          ? "Delivery submitted for admin verification"
          : `Delivery status updated to ${status}`,
      data: { order },
    });
  } catch (error) {
    console.error("❌ [updateDeliveryStatus] Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

export const getDeliveryProof = async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log(`🔍 [getDeliveryProof] Fetching proof for order:`, orderId);

    const order = await Order.findById(orderId)
      .select("deliveryProof deliveryNotes deliveryStatus deliveredAt")
      .populate("deliveryAgent", "name phone");

    if (!order) {
      return errorResponse(res, "Order not found", 404);
    }

    return successResponse(res, "Delivery proof fetched", {
      proof: order.deliveryProof,
      notes: order.deliveryNotes,
      status: order.deliveryStatus,
      deliveredAt: order.deliveredAt,
      agent: order.deliveryAgent,
    });
  } catch (error) {
    console.error("❌ [getDeliveryProof] Error:", error);
    return errorResponse(res, error.message);
  }
};

export const getPendingDeliveries = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    console.log("🔍 [getPendingDeliveries] Fetching pending deliveries...");

    const filter = {
      deliveryStatus: "pending_verification",
    };

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("user", "name email phone")
        .populate("deliveryAgent", "name email phone photo")
        .sort({ deliveredAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(filter),
    ]);

    console.log(
      `✅ [getPendingDeliveries] Found ${orders.length} pending deliveries`,
    );

    return successResponse(res, "Pending deliveries fetched", {
      orders,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error("❌ [getPendingDeliveries] Error:", error);
    return errorResponse(res, error.message);
  }
};

// controllers/admin/delivery.admin.controller.js

// Add this function after your other functions

// ─── GET /api/admin/delivery/stats ──────────────────────────────────────────
// Get delivery statistics for admin dashboard

export const getDeliveryStats = async (req, res) => {
  try {
    console.log("🔍 [getDeliveryStats] Fetching delivery stats...");

    // Get counts for each delivery status
    const stats = await Order.aggregate([
      {
        $group: {
          _id: "$deliveryStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get total deliveries
    const totalDeliveries = await Order.countDocuments({
      deliveryStatus: { $ne: null, $exists: true },
    });

    // Format stats with default values
    const formattedStats = {
      total: totalDeliveries || 0,
      pending: 0,
      assigned: 0,
      picked_up: 0,
      in_transit: 0,
      pending_verification: 0,
      delivered: 0,
      failed: 0,
    };

    // Map aggregation results to formatted stats
    stats.forEach((stat) => {
      if (formattedStats[stat._id] !== undefined) {
        formattedStats[stat._id] = stat.count;
      }
    });

    // Calculate completion rate
    const completed = formattedStats.delivered || 0;
    const total = formattedStats.total || 1;
    const completionRate = Math.round((completed / total) * 100);

    console.log("✅ [getDeliveryStats] Stats:", formattedStats);

    return successResponse(res, "Delivery stats fetched", {
      stats: formattedStats,
      completionRate: completionRate,
    });
  } catch (error) {
    console.error("❌ [getDeliveryStats] Error:", error);
    return errorResponse(res, error.message);
  }
};

// controllers/admin/delivery.admin.controller.js

// ✅ Admin verifies delivery (approve or reject)
// controllers/admin/delivery.admin.controller.js

export const verifyDelivery = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { action, adminNote } = req.body;

    console.log(
      `🔍 [verifyDelivery] Admin ${action}ing delivery for order:`,
      orderId,
    );

    const order = await Order.findById(orderId)
      .populate("deliveryAgent", "name email")
      .populate("user", "name email");

    if (!order) {
      return errorResponse(res, "Order not found", 404);
    }

    if (order.deliveryStatus !== "pending_verification") {
      return errorResponse(
        res,
        `Order is not pending verification. Current status: ${order.deliveryStatus}`,
        400,
      );
    }

    if (action === "approve") {
      // ✅ Approve delivery
      order.deliveryStatus = "delivered";
      order.orderStatus = "delivered";
      order.deliveredAt = new Date();

      if (order.deliveryAgent) {
        const agent = await DeliveryAgent.findById(order.deliveryAgent._id);
        if (agent) {
          agent.totalDeliveries += 1;
          agent.completedOrders.push(order._id);
          agent.assignedOrders = agent.assignedOrders.filter(
            (id) => id.toString() !== order._id.toString(),
          );
          await agent.save();
        }
      }

      await order.save();

      // ✅ Send notification to customer (email)
      await sendOrderStatusUpdateEmail(
        order,
        order.user,
        "delivered",
        "Your order has been delivered! Thank you for shopping with us.",
      );

      // ✅ Send notification to delivery agent (email)
      await sendDeliveryVerificationResultEmail(order.deliveryAgent?.email, {
        orderId: order.orderId || order._id.toString().slice(-8).toUpperCase(),
        status: "approved",
        adminNote: adminNote || "Delivery verified by admin",
        customerName: order.user?.name || "Customer",
      });

      // ✅ CREATE NOTIFICATION FOR ADMIN
      await notifyDeliveryUpdate(order, "approved");

      return successResponse(res, "Delivery verified and approved", { order });
    } else if (action === "reject") {
      // ❌ Reject delivery
      order.deliveryStatus = "failed";
      order.deliveryNotes =
        adminNote || "Delivery verification failed - needs re-delivery";

      await order.save();

      // ✅ Send notification to delivery agent (email)
      await sendDeliveryVerificationResultEmail(order.deliveryAgent?.email, {
        orderId: order.orderId || order._id.toString().slice(-8).toUpperCase(),
        status: "rejected",
        adminNote: adminNote || "Delivery was not approved. Please re-deliver.",
        customerName: order.user?.name || "Customer",
      });

      // ✅ CREATE NOTIFICATION FOR ADMIN
      await notifyDeliveryUpdate(order, "rejected");

      return successResponse(res, "Delivery rejected. Agent notified.", {
        order,
      });
    }

    return errorResponse(res, "Invalid action. Use 'approve' or 'reject'", 400);
  } catch (error) {
    console.error("❌ [verifyDelivery] Error:", error);
    return errorResponse(res, error.message);
  }
};
