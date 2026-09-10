import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  throw new Error("RESEND_API_KEY is not configured");
}

export const resend = new Resend(resendApiKey);

export const resendFromEmail =
  process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";