import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT);
const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASSWORD;

if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
  throw new Error("SMTP environment variables are not configured");
}

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: true,

  auth: {
    user: smtpUser,
    pass: smtpPassword,
  },
});



export default transporter;