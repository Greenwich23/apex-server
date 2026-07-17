// src/services/emailService.js
import nodemailer from "nodemailer";
import logger from "../utils/logger.js";

// Create transporter
let transporter;

const createTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false, // for development only
      },
    });

    // Verify connection
    transporter.verify((error, success) => {
      if (error) {
        console.error("❌ Email transporter error:", error);
        logger.error("Email transporter error:", error);
      } else {
        console.log("✅ Email transporter ready to send emails!");
        logger.info("Email transporter ready");
      }
    });
  }
  return transporter;
};

/**
 * Send OTP email using Nodemailer
 */
export const sendOtpEmail = async (email, otp, userName = "User") => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Apex Store" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🔐 Your OTP Code for Apex Store",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td align="center" style="padding-bottom: 20px;">
                      <h1 style="color: #1a1a2e; font-size: 28px; margin: 0;">APEX<span style="color: #ff6b00;">.</span></h1>
                      <p style="color: #666; font-size: 14px; margin: 5px 0 0;">Your Fitness Destination</p>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding: 20px 0;">
                      <h2 style="color: #333; font-size: 22px; margin: 0 0 10px;">Verify Your Email</h2>
                      <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 5px;">Hello ${userName},</p>
                      <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Use the following One-Time Password (OTP) to verify your email address:</p>
                    </td>
                  </tr>
                  
                  <!-- OTP Code -->
                  <tr>
                    <td align="center" style="padding: 10px 0 20px;">
                      <div style="background: #f8f9fa; padding: 20px 40px; border-radius: 10px; border: 2px dashed #ff6b00; display: inline-block;">
                        <h1 style="color: #ff6b00; font-size: 48px; letter-spacing: 10px; margin: 0; font-weight: 700;">${otp}</h1>
                      </div>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding: 10px 0 20px;">
                      <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0 0 5px;">
                        ⏰ This OTP will expire in <strong style="color: #ff6b00;">10 minutes</strong>
                      </p>
                      <p style="color: #999; font-size: 13px; line-height: 1.6; margin: 0;">
                        If you didn't request this, please ignore this email.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding-top: 30px; border-top: 1px solid #eee;">
                      <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                        © ${new Date().getFullYear()} Apex Store. All rights reserved.
                      </p>
                      <p style="color: #999; font-size: 12px; text-align: center; margin: 5px 0 0;">
                        Need help? Contact us at support@apexstore.com
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`✅ OTP email sent to ${email}`);
    console.log("📧 Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Failed to send OTP email:", error);
    logger.error(`Failed to send OTP email to ${email}:`, error.message);
    throw new Error("Failed to send OTP email. Please try again.");
  }
};

/**
 * Send welcome email
 */
export const sendWelcomeEmail = async (email, userName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Apex Store" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🎉 Welcome to Apex Store!",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                  <tr>
                    <td align="center" style="padding-bottom: 20px;">
                      <h1 style="color: #1a1a2e; font-size: 28px; margin: 0;">APEX<span style="color: #ff6b00;">.</span></h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 0;">
                      <h2 style="color: #333; font-size: 22px; margin: 0 0 10px;">Welcome to Apex Store!</h2>
                      <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Hello ${userName},</p>
                      <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Thank you for joining us! We're excited to have you on board.</p>
                      <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Start exploring our premium fitness products and enjoy exclusive deals!</p>
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/products" style="background: #ff6b00; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Start Shopping</a>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top: 30px; border-top: 1px solid #eee;">
                      <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                        © ${new Date().getFullYear()} Apex Store. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`✅ Welcome email sent to ${email}`);
    return info;
  } catch (error) {
    console.error("❌ Failed to send welcome email:", error);
    logger.error(`Failed to send welcome email to ${email}:`, error.message);
    throw new Error("Failed to send welcome email. Please try again.");
  }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (
  email,
  resetLink,
  userName = "User",
) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Apex Store" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🔑 Reset Your Password - Apex Store",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                  <tr>
                    <td align="center" style="padding-bottom: 20px;">
                      <h1 style="color: #1a1a2e; font-size: 28px; margin: 0;">APEX<span style="color: #ff6b00;">.</span></h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 0;">
                      <h2 style="color: #333; font-size: 22px; margin: 0 0 10px;">Reset Your Password</h2>
                      <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Hello ${userName},</p>
                      <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">We received a request to reset your password. Click the button below to create a new password:</p>
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" style="background: #ff6b00; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Reset Password</a>
                      </div>
                      <p style="color: #999; font-size: 13px; line-height: 1.6; margin: 0;">
                        ⏰ This link will expire in <strong>1 hour</strong>
                      </p>
                      <p style="color: #999; font-size: 13px; line-height: 1.6; margin: 10px 0 0;">
                        If you didn't request this, please ignore this email.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top: 30px; border-top: 1px solid #eee;">
                      <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                        © ${new Date().getFullYear()} Apex Store. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`✅ Password reset email sent to ${email}`);
    return info;
  } catch (error) {
    console.error("❌ Failed to send password reset email:", error);
    logger.error(
      `Failed to send password reset email to ${email}:`,
      error.message,
    );
    throw new Error("Failed to send password reset email. Please try again.");
  }
};

/**
 * 🆕 Send Order Confirmation Email
 */
// services/emailService.js

/**
 * 🆕 Send Order Confirmation Email
 */
export const sendOrderConfirmationEmail = async (order, user) => {
  try {
    const transporter = createTransporter();

    // ✅ Convert ObjectId to string before using slice
    const orderId = order._id.toString().slice(-8).toUpperCase();

    const orderDate = new Date(order.createdAt).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const orderTime = new Date(order.createdAt).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Generate items HTML
    const itemsHTML = order.items
      .map(
        (item) => `
          <tr>
            <td style="padding: 12px 8px; border-bottom: 1px solid #E5E7EB;">
              <div style="display: flex; align-items: center; gap: 12px;">
                ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;" />` : ""}
                <div>
                  <p style="margin: 0; font-weight: 600; color: #0A2540;">${item.name}</p>
                  <p style="margin: 0; font-size: 13px; color: #6B7280;">Qty: ${item.quantity}</p>
                </div>
              </div>
            </td>
            <td style="padding: 12px 8px; border-bottom: 1px solid #E5E7EB; text-align: right; font-weight: 600; color: #0A2540;">
              ₦${(item.price * item.quantity).toLocaleString()}
            </td>
          </tr>
        `,
      )
      .join("");

    const mailOptions = {
      from: `"Apex Store" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `🎯 Order Confirmed! #${orderId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #F8FAFC; margin: 0; padding: 40px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; padding: 40px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);">
            <!-- Header -->
            <tr>
              <td style="text-align: center; padding-bottom: 32px;">
                <h1 style="font-size: 28px; font-weight: 800; color: #0A2540; margin: 0; letter-spacing: -1px;">
                  APEX<span style="color: #FF6B00;">.</span>
                </h1>
                <div style="font-size: 56px; margin: 8px 0;">✅</div>
                <h1 style="font-size: 24px; font-weight: 700; color: #0A2540; margin: 0 0 4px 0;">Order Confirmed!</h1>
                <p style="color: #6B7280; font-size: 16px; margin: 0;">Thank you for your order, ${user.name || "Athlete"}!</p>
              </td>
            </tr>

            <!-- Order Info -->
            <tr>
              <td style="background: #F8FAFC; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 6px 0;"><span style="color: #6B7280; font-size: 14px;">Order Number</span></td>
                    <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #0A2540; font-size: 14px;">#${orderId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0;"><span style="color: #6B7280; font-size: 14px;">Date Placed</span></td>
                    <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #0A2540; font-size: 14px;">${orderDate} at ${orderTime}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0;"><span style="color: #6B7280; font-size: 14px;">Payment Method</span></td>
                    <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #0A2540; font-size: 14px;">${order.paymentMethod.toUpperCase()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0;"><span style="color: #6B7280; font-size: 14px;">Delivery</span></td>
                    <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #0A2540; font-size: 14px;">${order.deliveryPreference === "express" ? "🚀 Express" : "📦 Standard"}</td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Order Items -->
            <tr>
              <td>
                <h2 style="font-size: 16px; font-weight: 700; color: #0A2540; margin: 24px 0 12px 0;">Order Items</h2>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <thead>
                    <tr>
                      <th style="text-align: left; padding: 8px; font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #F0F4FA;">Product</th>
                      <th style="text-align: right; padding: 8px; font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #F0F4FA;">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHTML}
                  </tbody>
                </table>
              </td>
            </tr>

            <!-- Totals -->
            <tr>
              <td>
                <div style="margin-top: 16px;">
                  <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 15px;">
                    <span>Subtotal</span>
                    <span>₦${order.subtotal.toLocaleString()}</span>
                  </div>
                  ${
                    order.discount > 0
                      ? `
                  <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 15px; color: #22C55E;">
                    <span>Discount</span>
                    <span>-₦${order.discount.toLocaleString()}</span>
                  </div>`
                      : ""
                  }
                  ${
                    order.loyaltyPointsUsed > 0
                      ? `
                  <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 15px; color: #22C55E;">
                    <span>Loyalty Points</span>
                    <span>-₦${order.loyaltyPointsUsed.toLocaleString()}</span>
                  </div>`
                      : ""
                  }
                  <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 15px;">
                    <span>Shipping</span>
                    <span>₦${order.shippingFee.toLocaleString()}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; padding: 12px 0 6px; font-weight: 700; font-size: 18px; border-top: 2px solid #0A2540; margin-top: 8px;">
                    <span>Total</span>
                    <span>₦${order.total.toLocaleString()}</span>
                  </div>
                </div>
              </td>
            </tr>

            <!-- Shipping Address -->
            <tr>
              <td>
                <h2 style="font-size: 16px; font-weight: 700; color: #0A2540; margin: 24px 0 12px 0;">Shipping Address</h2>
                <div style="background: #F8FAFC; border-radius: 12px; padding: 16px 20px; margin-top: 16px;">
                  <p style="font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; margin: 0 0 8px 0;">Delivering to:</p>
                  <p style="margin: 4px 0; color: #0A2540; font-size: 15px; font-weight: 600;">${order.shippingAddress.fullName}</p>
                  <p style="margin: 4px 0; color: #0A2540; font-size: 15px;">${order.shippingAddress.street}</p>
                  <p style="margin: 4px 0; color: #0A2540; font-size: 15px;">${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}</p>
                  <p style="margin: 4px 0; color: #0A2540; font-size: 15px;">${order.shippingAddress.country}</p>
                  <p style="margin: 4px 0; color: #0A2540; font-size: 15px;">📞 ${order.shippingAddress.phone}</p>
                </div>
              </td>
            </tr>

            <!-- Tracking Info -->
            <tr>
              <td>
                <div style="background: #F0F6FF; border-radius: 8px; padding: 12px 16px; margin-top: 16px; border-left: 4px solid #0A2540;">
                  <p style="margin: 4px 0; color: #0A2540; font-size: 14px;">📦 <strong>Order Status:</strong> ${order.orderStatus || "Confirmed"}</p>
                  <p style="margin: 4px 0; font-size: 13px; color: #6B7280;">We'll notify you when your order ships.</p>
                </div>
              </td>
            </tr>

            <!-- Button -->
            <tr>
              <td style="text-align: center; padding-top: 24px;">
                <a href="${process.env.CUSTOMER_URL || "http://localhost:5173"}/orders/${order._id}" style="display: inline-block; padding: 12px 32px; background: #0A2540; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">View Order Details</a>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 2px solid #F0F4FA;">
                <p style="color: #9CA3AF; font-size: 14px; margin: 4px 0;">Questions? Email us at <a href="mailto:support@apexstore.com" style="color: #0A2540; text-decoration: none; font-weight: 600;">support@apexstore.com</a></p>
                <p style="color: #9CA3AF; font-size: 14px; margin: 4px 0;">© ${new Date().getFullYear()} APEX. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(
      `✅ Order confirmation email sent to ${user.email} for order #${orderId}`,
    );
    console.log(`📧 Order confirmation email sent to ${user.email}`);
    return info;
  } catch (error) {
    console.error("❌ Failed to send order confirmation email:", error);
    logger.error(
      `Failed to send order confirmation email to ${user?.email}:`,
      error.message,
    );
    // Don't throw - we don't want to fail the order if email fails
    return null;
  }
};

/**
 * Send Order Status Update Email
 */
export const sendOrderStatusUpdateEmail = async (
  order,
  user,
  status,
  message = null,
) => {
  try {
    const transporter = createTransporter();

    const statusEmojis = {
      confirmed: "✅",
      processing: "⚙️",
      shipped: "🚚",
      delivered: "📦",
      cancelled: "❌",
    };

    const statusMessages = {
      confirmed: "Your order has been confirmed and is being prepared.",
      processing: "We're getting your order ready for shipment.",
      shipped: "Your order is on its way! Track your shipment below.",
      delivered: "Your order has been delivered. Enjoy!",
      cancelled: "Your order has been cancelled.",
    };

    const mailOptions = {
      from: `"Apex Store" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `📦 Order #${order._id.slice(-8).toUpperCase()} ${status}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Update</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #F8FAFC; margin: 0; padding: 40px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; padding: 40px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);">
            <tr>
              <td style="text-align: center;">
                <h1 style="font-size: 24px; font-weight: 800; color: #0A2540; margin: 0;">APEX<span style="color: #FF6B00;">.</span></h1>
                <div style="font-size: 48px; margin: 16px 0;">${statusEmojis[status] || "📦"}</div>
                <h2 style="font-size: 22px; font-weight: 700; color: #0A2540; margin: 0 0 8px 0;">Order ${status.charAt(0).toUpperCase() + status.slice(1)}</h2>
                <p style="color: #4A6A8A; font-size: 16px; margin: 0 0 16px 0;">${message || statusMessages[status] || `Your order has been ${status}.`}</p>
                <div style="background: #F8FAFC; border-radius: 8px; padding: 16px; margin: 16px 0;">
                  <p style="margin: 4px 0;"><strong>Order #</strong> ${order._id.slice(-8).toUpperCase()}</p>
                  <p style="margin: 4px 0;"><strong>Status</strong> ${status.toUpperCase()}</p>
                </div>
                <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/orders/${order._id}" style="display: block; padding: 12px; background: #0A2540; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; text-align: center; margin-top: 16px;">View Order Details</a>
                <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #F0F4FA; color: #9CA3AF; font-size: 14px;">
                  <p style="margin: 4px 0;">Questions? Contact us at support@apexstore.com</p>
                </div>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`✅ Order status update email sent to ${user.email}`);
    return info;
  } catch (error) {
    console.error("❌ Failed to send order status update email:", error);
    logger.error(
      `Failed to send order status update email to ${user?.email}:`,
      error.message,
    );
    return null;
  }
};

// services/emailService.js - Add this function

/**
 * Send Contact Form Email
 */
export const sendContactEmail = async ({ name, email, subject, message }) => {
  try {
    const transporter = createTransporter();

    // Email to admin/support
    const adminMailOptions = {
      from: `"${name}" <${email}>`,
      to: process.env.EMAIL_USER, // Your support email
      subject: `📩 Contact Form: ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Contact Message</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 40px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <!-- Header -->
            <tr>
              <td style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #f0f0f0;">
                <h1 style="color: #1a1a2e; font-size: 28px; margin: 0;">APEX<span style="color: #ff6b00;">.</span></h1>
                <p style="color: #666; font-size: 14px; margin: 5px 0 0;">New Contact Form Submission</p>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 20px 0;">
                <h2 style="color: #333; font-size: 20px; margin: 0 0 16px;">You have a new message</h2>
                
                <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                  <p style="margin: 4px 0;"><strong style="color: #333;">From:</strong> ${name}</p>
                  <p style="margin: 4px 0;"><strong style="color: #333;">Email:</strong> <a href="mailto:${email}" style="color: #ff6b00; text-decoration: none;">${email}</a></p>
                  <p style="margin: 4px 0;"><strong style="color: #333;">Subject:</strong> ${subject}</p>
                </div>

                <div style="background: #f8f9fa; border-radius: 8px; padding: 16px;">
                  <p style="margin: 0 0 8px;"><strong style="color: #333;">Message:</strong></p>
                  <p style="margin: 0; color: #555; line-height: 1.6; white-space: pre-wrap;">${message}</p>
                </div>

                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
                  <p style="color: #999; font-size: 13px; margin: 0;">
                    📅 Sent at: ${new Date().toLocaleString()}
                  </p>
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding-top: 30px; border-top: 1px solid #eee; text-align: center;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                  This message was sent from your website's contact form.
                </p>
                <p style="color: #999; font-size: 12px; margin: 5px 0 0;">
                  © ${new Date().getFullYear()} Apex Store. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    // Auto-reply to user
    const userMailOptions = {
      from: `"APEX Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `📩 We received your message: ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Thank You for Contacting Us</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 40px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <tr>
              <td style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #f0f0f0;">
                <h1 style="color: #1a1a2e; font-size: 28px; margin: 0;">APEX<span style="color: #ff6b00;">.</span></h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px 0;">
                <div style="text-align: center; font-size: 48px; margin-bottom: 12px;">📧</div>
                <h2 style="color: #333; font-size: 22px; margin: 0 0 8px; text-align: center;">Thank You for Contacting Us!</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6; text-align: center;">Hello ${name},</p>
                <p style="color: #666; font-size: 16px; line-height: 1.6;">We have received your message and our team will get back to you as soon as possible.</p>
                <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 16px 0;">
                  <p style="margin: 4px 0;"><strong>Your Message:</strong></p>
                  <p style="margin: 4px 0; color: #555; font-style: italic;">"${message.substring(0, 150)}${message.length > 150 ? "..." : ""}"</p>
                </div>
                <p style="color: #999; font-size: 14px; text-align: center;">We typically respond within 24 hours.</p>
              </td>
            </tr>
            <tr>
              <td style="padding-top: 30px; border-top: 1px solid #eee; text-align: center;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                  © ${new Date().getFullYear()} Apex Store. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    // Send both emails
    await transporter.sendMail(adminMailOptions);
    await transporter.sendMail(userMailOptions);

    console.log(`📧 Contact form emails sent from ${email}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to send contact email:", error);
    return { success: false, error: error.message };
  }
};

// src/services/emailService.js
// Add this function after your existing functions

/**
 * 🚚 Send Delivery Assignment Email to Delivery Agent
 */
export const sendDeliveryAssignmentEmail = async (
  agentEmail,
  agentName,
  data,
) => {
  try {
    const transporter = createTransporter();

    const {
      orderId,
      customerName,
      deliveryAddress,
      deliveryLink,
      orderTotal,
      items,
      customerPhone,
      specialInstructions,
    } = data;

    // Generate items HTML
    const itemsHTML =
      items && items.length > 0
        ? items
            .map(
              (item) => `
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #E5E7EB;">
              ${item.name || item.product?.name || "Item"}
            </td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #E5E7EB; text-align: center;">
              ${item.quantity || 1}
            </td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #E5E7EB; text-align: right;">
              ₦${((item.price || 0) * (item.quantity || 1)).toLocaleString()}
            </td>
          </tr>
        `,
            )
            .join("")
        : "";

    const mailOptions = {
      from: `"Apex Store" <${process.env.EMAIL_USER}>`,
      to: agentEmail,
      subject: `🚚 New Delivery Assignment - Order #${orderId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Delivery Assignment</title>
          <style>
            @media only screen and (max-width: 600px) {
              .container { padding: 20px !important; }
              .btn { display: block !important; width: 100% !important; }
            }
          </style>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #F8FAFC; margin: 0; padding: 40px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; padding: 40px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);">
            <!-- Header -->
            <tr>
              <td style="text-align: center; padding-bottom: 24px; border-bottom: 2px solid #F0F4FA;">
                <h1 style="font-size: 28px; font-weight: 800; color: #0A2540; margin: 0;">APEX<span style="color: #FF6B00;">.</span></h1>
                <p style="color: #6B7280; font-size: 14px; margin: 4px 0 0;">Delivery Management</p>
              </td>
            </tr>

            <!-- Greeting -->
            <tr>
              <td style="padding: 24px 0 16px;">
                <p style="font-size: 18px; font-weight: 600; color: #0A2540; margin: 0 0 4px;">Hello ${agentName || "Agent"},</p>
                <p style="color: #4A6A8A; font-size: 16px; margin: 0;">You have been assigned a new delivery. Please review the details below.</p>
              </td>
            </tr>

            <!-- Quick Actions -->
            <tr>
              <td style="padding: 16px 0;">
                <div style="background: #F0F6FF; border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #D6E4FF;">
                  <p style="margin: 0 0 12px; font-weight: 600; color: #0A2540;">📱 Update Delivery Status</p>
                  <a href="${deliveryLink}" style="display: inline-block; padding: 14px 32px; background: #0A2540; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Click to Update Status →
                  </a>
                  <p style="margin: 8px 0 0; font-size: 12px; color: #6B7280;">This link is unique to this delivery</p>
                </div>
              </td>
            </tr>

            <!-- Order Details -->
            <tr>
              <td>
                <h2 style="font-size: 16px; font-weight: 700; color: #0A2540; margin: 16px 0 12px;">📋 Order Details</h2>
                <div style="background: #F8FAFC; border-radius: 12px; padding: 16px 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding: 4px 0; color: #6B7280; font-size: 14px;">Order Number</td>
                      <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #0A2540; font-size: 14px;">#${orderId}</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0; color: #6B7280; font-size: 14px;">Customer</td>
                      <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #0A2540; font-size: 14px;">${customerName || "N/A"}</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0; color: #6B7280; font-size: 14px;">Phone</td>
                      <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #0A2540; font-size: 14px;">${customerPhone || "N/A"}</td>
                    </tr>
                    ${
                      orderTotal
                        ? `
                    <tr>
                      <td style="padding: 4px 0; color: #6B7280; font-size: 14px;">Order Total</td>
                      <td style="padding: 4px 0; text-align: right; font-weight: 700; color: #FF6B00; font-size: 16px;">₦${orderTotal.toLocaleString()}</td>
                    </tr>
                    `
                        : ""
                    }
                  </table>
                </div>
              </td>
            </tr>

            <!-- Delivery Address -->
            <tr>
              <td>
                <h2 style="font-size: 16px; font-weight: 700; color: #0A2540; margin: 16px 0 12px;">📍 Delivery Address</h2>
                <div style="background: #F8FAFC; border-radius: 12px; padding: 16px 20px;">
                  <p style="margin: 2px 0; color: #0A2540; font-size: 15px; font-weight: 500;">${deliveryAddress?.fullName || "N/A"}</p>
                  <p style="margin: 2px 0; color: #4A6A8A; font-size: 14px;">${deliveryAddress?.street || deliveryAddress?.address || "N/A"}</p>
                  <p style="margin: 2px 0; color: #4A6A8A; font-size: 14px;">${deliveryAddress?.city || ""} ${deliveryAddress?.state || ""} ${deliveryAddress?.zipCode || deliveryAddress?.postalCode || ""}</p>
                  <p style="margin: 2px 0; color: #4A6A8A; font-size: 14px;">${deliveryAddress?.country || "Nigeria"}</p>
                  ${deliveryAddress?.phone ? `<p style="margin: 4px 0 0; color: #0A2540; font-size: 14px;">📞 ${deliveryAddress.phone}</p>` : ""}
                  ${specialInstructions ? `<p style="margin: 8px 0 0; color: #6B7280; font-size: 13px; font-style: italic;">📝 ${specialInstructions}</p>` : ""}
                </div>
              </td>
            </tr>

            <!-- Order Items -->
            ${
              items && items.length > 0
                ? `
            <tr>
              <td>
                <h2 style="font-size: 16px; font-weight: 700; color: #0A2540; margin: 16px 0 12px;">📦 Items to Deliver</h2>
                <div style="background: #F8FAFC; border-radius: 12px; overflow: hidden;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <thead>
                      <tr style="background: #E8EDF5;">
                        <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #4A6A8A; text-transform: uppercase; letter-spacing: 0.5px;">Item</th>
                        <th style="padding: 10px 12px; text-align: center; font-size: 12px; color: #4A6A8A; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
                        <th style="padding: 10px 12px; text-align: right; font-size: 12px; color: #4A6A8A; text-transform: uppercase; letter-spacing: 0.5px;">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHTML}
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
            `
                : ""
            }

            <!-- Important Notes -->
            <tr>
              <td>
                <div style="background: #FFF8E6; border-radius: 12px; padding: 16px 20px; margin: 20px 0; border-left: 4px solid #FFB800;">
                  <p style="margin: 0; font-size: 14px; color: #7A6A00;">
                    <strong>📌 Important:</strong>
                  </p>
                  <ul style="margin: 4px 0; padding-left: 20px; color: #7A6A00; font-size: 13px;">
                    <li>Use the link above to update delivery status</li>
                    <li>Take a photo as proof of delivery when delivered</li>
                    <li>Contact customer if you have any issues</li>
                  </ul>
                </div>
              </td>
            </tr>

            <!-- Action Buttons -->
            <tr>
              <td style="text-align: center; padding-top: 12px;">
                <a href="${deliveryLink}" style="display: inline-block; padding: 14px 40px; background: #FF6B00; color: white; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; transition: all 0.2s;">
                  🚚 Update Delivery Status
                </a>
                <p style="color: #9CA3AF; font-size: 12px; margin: 8px 0 0;">
                  Click the button above to update the delivery status in real-time
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 2px solid #F0F4FA;">
                <p style="color: #9CA3AF; font-size: 13px; margin: 4px 0;">
                  Questions? Contact support at 
                  <a href="mailto:support@apexstore.com" style="color: #0A2540; text-decoration: none; font-weight: 600;">support@apexstore.com</a>
                </p>
                <p style="color: #9CA3AF; font-size: 12px; margin: 4px 0;">
                  © ${new Date().getFullYear()} APEX Store. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(
      `✅ Delivery assignment email sent to ${agentEmail} for order #${orderId}`,
    );
    console.log(`📧 Delivery assignment email sent to ${agentEmail}`);
    return info;
  } catch (error) {
    console.error("❌ Failed to send delivery assignment email:", error);
    logger.error(
      `Failed to send delivery assignment email to ${agentEmail}:`,
      error.message,
    );
    throw new Error(
      "Failed to send delivery assignment email. Please try again.",
    );
  }
};

// services/emailService.js - Add these functions

// ─── Send Return Approved Email ─────────────────────────────────────────────

export const sendReturnApprovedEmail = async (email, data) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Apex Store" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `✅ Return Request Approved - Order #${data.orderId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Return Approved</title>
        </head>
        <body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: #10b981;">✅ Return Request Approved</h2>
            <p style="color: #666;">Your return request for order #${data.orderId} has been approved.</p>
            <p style="color: #666;">A delivery agent will be assigned to pick up your item shortly.</p>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Return ID:</strong> #${data.returnRequestId}</p>
              <p><strong>Status:</strong> Approved - Awaiting Pickup</p>
            </div>
            <p style="color: #999; font-size: 12px; text-align: center;">
              You will receive another notification when the pickup is scheduled.
            </p>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`✅ Return approved email sent to ${email}`);
  } catch (error) {
    logger.error("Failed to send return approved email:", error);
  }
};

// ─── Send Refund Notification Email ─────────────────────────────────────────

export const sendRefundNotificationEmail = async (email, data) => {
  try {
    const transporter = createTransporter();

    const { orderId, amount, refundStatus, reason, items } = data;

    const itemsList = items
      .map((item) => `<li>Item x ${item.quantity}</li>`)
      .join("");

    const isSuccess = refundStatus === "completed";

    const mailOptions = {
      from: `"Apex Store" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `${isSuccess ? "💰" : "⏳"} Refund ${isSuccess ? "Completed" : "Processing"} - Order #${orderId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Refund ${isSuccess ? "Completed" : "Processing"}</title>
        </head>
        <body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: ${isSuccess ? "#10b981" : "#f59e0b"};">
              ${isSuccess ? "💰 Refund Completed!" : "⏳ Refund Processing"}
            </h2>
            <p style="color: #666;">Your refund for order #${orderId} is ${isSuccess ? "now complete" : "being processed"}.</p>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Refund Amount:</strong> ₦${amount.toLocaleString()}</p>
              <p><strong>Status:</strong> ${refundStatus.toUpperCase()}</p>
              <p><strong>Reason:</strong> ${reason}</p>
              ${itemsList ? `<p><strong>Items Returned:</strong></p><ul>${itemsList}</ul>` : ""}
            </div>

            ${
              isSuccess
                ? `
              <div style="background: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #065f46; margin: 0;">
                  ✅ The refund amount of ₦${amount.toLocaleString()} has been credited back to your original payment method.
                </p>
                <p style="color: #065f46; font-size: 14px; margin: 8px 0 0;">
                  ⏰ Please allow 5-10 business days for the refund to appear in your account.
                </p>
              </div>
            `
                : `
              <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #92400e; margin: 0;">
                  ⏳ Your refund is being processed. You will receive a confirmation email once completed.
                </p>
              </div>
            `
            }
            
            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
              Questions? Contact us at support@apexstore.com
            </p>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`✅ Refund notification email sent to ${email}`);
  } catch (error) {
    logger.error("Failed to send refund notification email:", error);
  }
};

// ─── Send Pickup Assignment Email ───────────────────────────────────────────

// services/emailService.js - Updated sendPickupAssignmentEmail

export const sendPickupAssignmentEmail = async (email, agentName, data) => {
  try {
    const transporter = createTransporter();

    const { returnRequestId, orderId, customerName, address } = data;

    // ✅ Build the correct pickup link using the returnRequestId
    const baseUrl = process.env.CUSTOMER_URL || "http://localhost:5173";
    const pickupLink = `${baseUrl}/delivery/return/${returnRequestId}`;

    const mailOptions = {
      from: `"Apex Store" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `📦 New Pickup Assignment - Return #${returnRequestId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Pickup Assignment</title>
        </head>
        <body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: #0a2540;">📦 New Pickup Assignment</h2>
            <p style="color: #666;">Hello ${agentName},</p>
            <p style="color: #666;">You have been assigned to pick up a return from a customer.</p>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Return ID:</strong> #${returnRequestId}</p>
              <p><strong>Order #:</strong> ${orderId}</p>
              <p><strong>Customer:</strong> ${customerName}</p>
              <p><strong>Address:</strong> ${address?.address || address?.street || "N/A"}</p>
              <p><strong>City:</strong> ${address?.city || "N/A"}</p>
              <p><strong>State:</strong> ${address?.state || "N/A"}</p>
              <p><strong>Phone:</strong> ${address?.phone || "N/A"}</p>
            </div>

            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                <strong>📌 Instructions:</strong>
              </p>
              <ul style="color: #92400e; font-size: 13px; margin: 4px 0; padding-left: 20px;">
                <li>Contact the customer to schedule the pickup</li>
                <li>Inspect the item(s) before picking up</li>
                <li>Mark the pickup as completed once done</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 20px 0;">
              <a href="${pickupLink}" style="display: inline-block; padding: 14px 40px; background: #0a2540; color: white; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px;">
                📦 View & Update Pickup
              </a>
              <p style="color: #9CA3AF; font-size: 12px; margin: 8px 0 0;">
                Click the button above to update pickup status
              </p>
            </div>

            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
              Questions? Contact support at support@apexstore.com
            </p>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`✅ Pickup assignment email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to send pickup assignment email:", error);
    logger.error(
      `Failed to send pickup assignment email to ${email}:`,
      error.message,
    );
    return { success: false, error: error.message };
  }
};

// services/emailService.js - Add this function after sendDeliveryAssignmentEmail

// ─── Send Delivery Confirmation Email (for admin verification) ─────────────

export const sendDeliveryConfirmationEmail = async (agentEmail, data) => {
  try {
    const transporter = createTransporter();

    const { orderId, status, notes } = data;
    const isApproved = status === "approved";

    const mailOptions = {
      from: `"Apex Store" <${process.env.EMAIL_USER}>`,
      to: agentEmail,
      subject: `${isApproved ? "✅" : "❌"} Delivery ${isApproved ? "Verified" : "Rejected"} - Order #${orderId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Delivery ${isApproved ? "Verified" : "Rejected"}</title>
        </head>
        <body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: ${isApproved ? "#10b981" : "#ef4444"};">
              ${isApproved ? "✅ Delivery Verified!" : "❌ Delivery Rejected"}
            </h2>
            <p style="color: #666;">Your delivery for order #${orderId} has been ${isApproved ? "verified and approved" : "rejected by admin"}.</p>
            
            ${
              notes
                ? `<div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Admin Note:</strong> ${notes}</p>
            </div>`
                : ""
            }

            ${
              !isApproved
                ? `
              <div style="background: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 20px 0;">
                <p style="color: #dc2626; margin: 0;">
                  Please re-deliver the order or contact support for more information.
                </p>
              </div>
            `
                : ""
            }
            
            // <div style="text-align: center; margin: 20px 0;">
            //   <a href="${process.env.CUSTOMER_URL || "http://localhost:5173"}/orders/${orderId}" style="display: inline-block; padding: 12px 30px; background: #0a2540; color: white; text-decoration: none; border-radius: 6px;">
            //     View Order
            //   </a>
            // </div>
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              Thank you for your delivery service!
            </p>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`✅ Delivery confirmation email sent to ${agentEmail}`);
    return { success: true };
  } catch (error) {
    logger.error("Failed to send delivery confirmation email:", error);
    return { success: false, error: error.message };
  }
};

// services/emailService.js

// ─── Send Delivery Verification Result Email to Driver ─────────────────────

export const sendDeliveryVerificationResultEmail = async (
  driverEmail,
  data,
) => {
  try {
    const transporter = createTransporter();

    const { orderId, status, adminNote, customerName } = data;
    const isApproved = status === "approved";

    const mailOptions = {
      from: `"Apex Store" <${process.env.EMAIL_USER}>`,
      to: driverEmail,
      subject: `${isApproved ? "✅" : "❌"} Delivery ${isApproved ? "Verified" : "Rejected"} - Order #${orderId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Delivery ${isApproved ? "Verified" : "Rejected"}</title>
        </head>
        <body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: ${isApproved ? "#10b981" : "#ef4444"};">
              ${isApproved ? "✅ Delivery Verified!" : "❌ Delivery Rejected"}
            </h2>
            <p style="color: #666;">
              Your delivery for order #${orderId} has been ${isApproved ? "verified and approved" : "rejected by admin"}.
            </p>
            <p style="color: #666;">
              <strong>Customer:</strong> ${customerName || "N/A"}
            </p>
            
            ${
              adminNote
                ? `
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Admin Note:</strong> ${adminNote}</p>
              </div>
            `
                : ""
            }

            ${
              !isApproved
                ? `
              <div style="background: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 20px 0;">
                <p style="color: #dc2626; margin: 0;">
                  Please re-deliver the order or contact support for more information.
                </p>
              </div>
            `
                : `
              <div style="background: #d1fae5; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
                <p style="color: #065f46; margin: 0;">
                  ✅ Delivery confirmed! Thank you for your service.
                </p>
              </div>
            `
            }
  
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              Thank you for your delivery service!
            </p>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`✅ Delivery verification result email sent to ${driverEmail}`);
    return { success: true };
  } catch (error) {
    console.error(
      "❌ Failed to send delivery verification result email:",
      error,
    );
    return { success: false, error: error.message };
  }
};

// ─── Send Return Pickup Verification Result Email to Driver ────────────────

export const sendReturnPickupVerificationEmail = async (driverEmail, data) => {
  try {
    const transporter = createTransporter();

    const { returnId, status, adminNote, customerName } = data;
    const isApproved = status === "approved";

    const mailOptions = {
      from: `"Apex Store" <${process.env.EMAIL_USER}>`,
      to: driverEmail,
      subject: `${isApproved ? "✅" : "❌"} Return Pickup ${isApproved ? "Verified" : "Rejected"} - Return #${returnId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Return Pickup ${isApproved ? "Verified" : "Rejected"}</title>
        </head>
        <body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: ${isApproved ? "#10b981" : "#ef4444"};">
              ${isApproved ? "✅ Return Pickup Verified!" : "❌ Return Pickup Rejected"}
            </h2>
            <p style="color: #666;">
              Your return pickup for return #${returnId} has been ${isApproved ? "verified and approved" : "rejected by admin"}.
            </p>
            <p style="color: #666;">
              <strong>Customer:</strong> ${customerName || "N/A"}
            </p>
            
            ${
              adminNote
                ? `
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Admin Note:</strong> ${adminNote}</p>
              </div>
            `
                : ""
            }

            ${
              !isApproved
                ? `
              <div style="background: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 20px 0;">
                <p style="color: #dc2626; margin: 0;">
                  Please contact support for more information about this return pickup.
                </p>
              </div>
            `
                : `
              <div style="background: #d1fae5; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
                <p style="color: #065f46; margin: 0;">
                  ✅ Return pickup confirmed! Thank you for your service.
                </p>
              </div>
            `
            }            
            <p style="color: #999; font-size: 12px; text-align: center;">
              Thank you for your pickup service!
            </p>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`✅ Return pickup verification email sent to ${driverEmail}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to send return pickup verification email:", error);
    return { success: false, error: error.message };
  }
};

export default {
  sendOtpEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendContactEmail,
  sendDeliveryAssignmentEmail,
  sendPickupAssignmentEmail,
  sendRefundNotificationEmail,
  sendReturnApprovedEmail,
  sendDeliveryConfirmationEmail,
  sendDeliveryVerificationResultEmail,
  sendReturnPickupVerificationEmail,
};
