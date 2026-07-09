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
export const sendOrderConfirmationEmail = async (order, user) => {
  try {
    const transporter = createTransporter();

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
      subject: `🎯 Order Confirmed! #${order._id.slice(-8).toUpperCase()}`,
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
                    <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #0A2540; font-size: 14px;">#${order._id.slice(-8).toUpperCase()}</td>
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
                <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/orders/${order._id}" style="display: inline-block; padding: 12px 32px; background: #0A2540; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">View Order Details</a>
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
      `✅ Order confirmation email sent to ${user.email} for order #${order._id}`,
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

export default {
  sendOtpEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendContactEmail,
};
