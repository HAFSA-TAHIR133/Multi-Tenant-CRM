import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true", // false for port 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async ({ to, subject, html, text }) => {
  if (!to) {
    console.error("❌ Email send skipped: 'to' address is missing.");
    return;
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error(
      "❌ SMTP credentials missing! Ensure SMTP_USER and SMTP_PASS are set in your environment variables."
    );
    throw new Error("Email service is not configured properly.");
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Support" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log("✅ Email sent successfully to %s | Message ID: %s", to, info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error sending email via SMTP:", error);
    throw error;
  }
};