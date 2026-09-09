import {
  Request,
  Response,
} from "express";

import {
  createCheckoutSessionSchema,
} from "../validators/payment.validator.js";

import {
  createCheckoutSession,
} from "../services/payment/payment.service.js";


import {
  completeMockPayment,
} from "../services/payment/mock/mock-payment.service.js";

export const createPaymentCheckout =
  async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      // ----------------------------------------------
      // Authentication should already be handled by
      // authenticate middleware.
      // ----------------------------------------------

      if (!req.user) {
        res.status(401).json({
          success: false,
          message:
            "Authentication required",
        });

        return;
      }

      // ----------------------------------------------
      // Idempotency key
      // ----------------------------------------------

      const idempotencyKey =
        req.headers["idempotency-key"];

      if (
        typeof idempotencyKey !==
        "string"
      ) {
        res.status(400).json({
          success: false,
          message:
            "Idempotency-Key header is required",
        });

        return;
      }

      // ----------------------------------------------
      // Validate request body
      // ----------------------------------------------

      const result =
        createCheckoutSessionSchema.safeParse(
          req.body,
        );

      if (!result.success) {
        res.status(400).json({
          success: false,
          message:
            "Validation failed",
          errors:
            result.error.flatten()
              .fieldErrors,
        });

        return;
      }

      // ----------------------------------------------
      // Create checkout session
      // ----------------------------------------------

      const session =
        await createCheckoutSession({
          clientId: req.user.id,
          invoiceId:
            result.data.invoiceId,
          idempotencyKey,
        });

      // ----------------------------------------------
      // Success
      // ----------------------------------------------

      res.status(200).json({
        success: true,
        message:
          "Checkout session created",
        data: {
          sessionId:
            session.sessionId,
          checkoutUrl:
            session.checkoutUrl,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Payment request failed";

      // ----------------------------------------------
      // Client attempted to access another client's
      // invoice.
      // ----------------------------------------------

      if (
        message ===
        "Invoice access forbidden"
      ) {
        res.status(403).json({
          success: false,
          message: "Forbidden",
        });

        return;
      }

      // ----------------------------------------------
      // Validation / missing resources
      // ----------------------------------------------

      if (
        message ===
        "Invalid client ID" ||
        message ===
        "Invalid invoice ID" ||
        message ===
        "Idempotency key is required" ||
        message ===
        "Client not found" ||
        message ===
        "Invoice not found"
      ) {
        res.status(400).json({
          success: false,
          message,
        });

        return;
      }

      // ----------------------------------------------
      // Invoice payment state
      // ----------------------------------------------

      if (
        message ===
          "Invoice has already been paid" ||
        message ===
          "Cancelled invoices cannot be paid" ||
        message ===
          "Invoice is not available for payment"
      ) {
        res.status(409).json({
          success: false,
          message,
        });

        return;
      }

      // ----------------------------------------------
      // Idempotency conflict
      // ----------------------------------------------

      if (
        message.includes(
          "Idempotency key",
        ) ||
        message.includes(
          "checkout request with this idempotency key",
        )
      ) {
        res.status(409).json({
          success: false,
          message,
        });

        return;
      }

      // ----------------------------------------------
      // Unexpected server error
      // ----------------------------------------------

      console.error(
        "Create checkout error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Internal server error",
      });
    }
  };

  export const completeMockPaymentController =
  async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message:
            "Authentication required",
        });

        return;
      }

      const {
        sessionId,
      } = req.body as {
        sessionId?: string;
      };

      if (
        !sessionId ||
        typeof sessionId !== "string"
      ) {
        res.status(400).json({
          success: false,
          message:
            "sessionId is required",
        });

        return;
      }

      await completeMockPayment(
        sessionId,
      );

      res.status(200).json({
        success: true,
        message:
          "Mock payment completed",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Mock payment failed";

      if (
        message ===
        "Mock checkout session not found"
      ) {
        res.status(404).json({
          success: false,
          message,
        });

        return;
      }

      console.error(
        "Mock payment completion error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Mock payment failed",
      });
    }
  };