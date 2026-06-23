import nodemailer from "nodemailer";
import twilio from "twilio";
import logger from "./logger.js";

// ─── EMAIL TRANSPORTER ────────────────────────────────────────────────────────

const createEmailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,         // e.g. smtp.gmail.com
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_PORT === "465", // true for 465, false for 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,       // for Gmail use an App Password
    },
  });
};

// ─── SEND OTP VIA EMAIL ───────────────────────────────────────────────────────

/**
 * Send a 6-digit OTP to a user's email address
 * @param {string} email - recipient email
 * @param {string} otp - the generated OTP code
 * @param {string} purpose - "verification" | "login" | "password-reset"
 */
export const sendOtpEmail = async (email, otp, purpose = "verification") => {
  const subjects = {
    verification: "Verify your Apex account",
    login: "Your Apex login OTP",
    "password-reset": "Reset your Apex password",
  };

  const headings = {
    verification: "Email Verification",
    login: "Login OTP",
    "password-reset": "Password Reset OTP",
  };

  const transporter = createEmailTransporter();

  const mailOptions = {
    from: `"Apex Store" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subjects[purpose] || "Your Apex OTP",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a1a1a;">${headings[purpose] || "Your OTP"}</h2>
        <p style="color: #555; font-size: 15px;">
          Use the code below to complete your request. It expires in <strong>10 minutes</strong>.
        </p>

        <div style="
          background: #f5f5f5;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin: 24px 0;
        ">
          <span style="
            font-size: 36px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #1a1a1a;
          ">${otp}</span>
        </div>

        <p style="color: #888; font-size: 13px;">
          If you didn't request this, you can safely ignore this email.
          Never share this code with anyone.
        </p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #bbb; font-size: 12px; text-align: center;">
          &copy; ${new Date().getFullYear()} Apex Store. All rights reserved.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`OTP email sent to ${email} for purpose: ${purpose}`);
  } catch (error) {
    logger.error(`Failed to send OTP email to ${email}`, error);
    throw new Error("Failed to send OTP email. Please try again.");
  }
};

// ─── SEND OTP VIA SMS (TWILIO) ────────────────────────────────────────────────

/**
 * Send a 6-digit OTP to a user's phone via SMS
 * @param {string} phone - recipient phone number in E.164 format e.g. "+2348012345678"
 * @param {string} otp - the generated OTP code
 */
export const sendOtpSms = async (phone, otp) => {
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  try {
    await client.messages.create({
      body: `Your Apex verification code is: ${otp}. It expires in 10 minutes. Do not share it with anyone.`,
      from: process.env.TWILIO_PHONE_NUMBER, // your Twilio number e.g. "+12015551234"
      to: phone,
    });
    logger.info(`OTP SMS sent to ${phone}`);
  } catch (error) {
    logger.error(`Failed to send OTP SMS to ${phone}`, error);
    throw new Error("Failed to send OTP via SMS. Please try again.");
  }
};

// ─── SEND GENERAL EMAIL ───────────────────────────────────────────────────────

/**
 * Generic email sender — use for order confirmations, shipping updates, etc.
 * @param {string} to - recipient email
 * @param {string} subject - email subject
 * @param {string} html - HTML body
 */
export const sendEmail = async (to, subject, html) => {
  const transporter = createEmailTransporter();

  try {
    await transporter.sendMail({
      from: `"Apex Store" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    logger.info(`Email sent to ${to} — subject: ${subject}`);
  } catch (error) {
    logger.error(`Failed to send email to ${to}`, error);
    throw new Error("Failed to send email. Please try again.");
  }
};

// ─── SEND PASSWORD RESET EMAIL ────────────────────────────────────────────────

/**
 * Send a password reset link email
 * @param {string} email - recipient email
 * @param {string} resetUrl - the full reset URL including the token
 */
export const sendPasswordResetEmail = async (email, resetUrl) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1a1a1a;">Reset Your Password</h2>
      <p style="color: #555; font-size: 15px;">
        You requested a password reset. Click the button below to set a new password.
        This link expires in <strong>30 minutes</strong>.
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" style="
          background-color: #1a1a1a;
          color: #fff;
          padding: 14px 28px;
          border-radius: 6px;
          text-decoration: none;
          font-size: 15px;
          font-weight: bold;
        ">Reset Password</a>
      </div>

      <p style="color: #888; font-size: 13px;">
        If you didn't request a password reset, ignore this email — your password won't change.
      </p>

      <p style="color: #bbb; font-size: 12px;">
        If the button above doesn't work, copy and paste this link into your browser:<br/>
        <a href="${resetUrl}" style="color: #555;">${resetUrl}</a>
      </p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #bbb; font-size: 12px; text-align: center;">
        &copy; ${new Date().getFullYear()} Apex Store. All rights reserved.
      </p>
    </div>
  `;

  await sendEmail(email, "Reset your Apex password", html);
};
