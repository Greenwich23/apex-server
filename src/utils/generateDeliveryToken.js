// utils/deliveryToken.js
import crypto from "crypto";

export const generateDeliveryToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

export const generateDeliveryLink = (orderId, token) => {
  const baseUrl = process.env.CUSTOMER_URL || "http://localhost:5173";
  return `${baseUrl}/delivery/update/${orderId}/${token}`;
};
