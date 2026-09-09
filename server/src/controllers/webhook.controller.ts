import {
  Request,
  Response,
} from "express";

import { getPaymentProvider } from "../services/payment/payment-provider.factory.js";
import { processPaymentWebhook } from "../services/payment/payment-webhook.service.js";

export const handleMockWebhook = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // --------------------------------------------------
    // Webhooks are NOT authenticated using JWT.
    //
    // The payment provider signature is the
    // authentication mechanism.
    // --------------------------------------------------

    const signature =
      req.headers["x-mock-signature"];

    if (
      typeof signature !== "string"
    ) {
      res.status(400).json({
        success: false,
        message:
          "Webhook signature is required",
      });

      return;
    }

    // --------------------------------------------------
    // express.raw() gives us the original Buffer.
    // --------------------------------------------------

    if (!Buffer.isBuffer(req.body)) {
      res.status(400).json({
        success: false,
        message:
          "Invalid webhook body",
      });

      return;
    }

    const provider =
      getPaymentProvider();

    // --------------------------------------------------
    // Cryptographically verify the webhook.
    // --------------------------------------------------

    const event =
      provider.constructWebhookEvent(
        req.body,
        signature,
      );

    // --------------------------------------------------
    // Process only after signature verification.
    // --------------------------------------------------

    await processPaymentWebhook(
      event,
    );

    res.status(200).json({
      success: true,
      message:
        "Webhook processed successfully",
    });
  } catch (error) {
    console.error(
      "Mock webhook error:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Webhook processing failed";

    // Invalid signature
    if (
      message ===
      "Invalid mock webhook signature"
    ) {
      res.status(400).json({
        success: false,
        message:
          "Invalid webhook signature",
      });

      return;
    }

    res.status(500).json({
      success: false,
      message:
        "Webhook processing failed",
    });
  }
};