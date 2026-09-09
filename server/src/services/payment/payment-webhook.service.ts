import mongoose from "mongoose";

import Invoice from "../../models/Invoice.js";
import Payment from "../../models/Payment.js";
import WebhookEvent from "../../models/WebhookEvent.js";
import type {
  PaymentWebhookEvent,
} from "./payment-provider.interface.js";

type PaymentProviderName =
  | "MOCK"
  | "STRIPE";

const getPaymentProviderName =
  (): PaymentProviderName => {
    const provider =
      (
        process.env.PAYMENT_PROVIDER ??
        "mock"
      ).toUpperCase();

    if (
      provider !== "MOCK" &&
      provider !== "STRIPE"
    ) {
      throw new Error(
        `Unsupported payment provider: ${provider}`,
      );
    }

    return provider;
  };

export const processPaymentWebhook =
  async (
    event: PaymentWebhookEvent,
  ): Promise<void> => {
    // --------------------------------------------------
    // 1. Check whether this webhook was already
    //    processed
    // --------------------------------------------------

    const existingEvent =
      await WebhookEvent.findOne({
        providerEventId:
          event.eventId,
      });

    if (existingEvent) {
      console.log(
        `Webhook ${event.eventId} already processed`,
      );

      return;
    }

    // --------------------------------------------------
    // 2. Validate invoice ID
    // --------------------------------------------------

    if (
      !mongoose.isValidObjectId(
        event.invoiceId,
      )
    ) {
      throw new Error(
        "Invalid invoice ID in webhook",
      );
    }

    // --------------------------------------------------
    // 3. Validate client ID
    // --------------------------------------------------

    if (
      !mongoose.isValidObjectId(
        event.clientId,
      )
    ) {
      throw new Error(
        "Invalid client ID in webhook",
      );
    }

    // --------------------------------------------------
    // 4. Find invoice
    // --------------------------------------------------

    const invoice =
      await Invoice.findById(
        event.invoiceId,
      );

    if (!invoice) {
      throw new Error(
        "Invoice referenced by webhook not found",
      );
    }

    // --------------------------------------------------
    // 5. Verify invoice ownership
    // --------------------------------------------------

    if (
      invoice.clientId.toString() !==
      event.clientId
    ) {
      throw new Error(
        "Webhook client does not own invoice",
      );
    }

    // --------------------------------------------------
    // 6. Only successful payments can mark an
    //    invoice as PAID
    // --------------------------------------------------

    if (event.status !== "SUCCEEDED") {
      console.log(
        `Payment event ${event.eventId} status: ${event.status}`,
      );

      await WebhookEvent.create({
        providerEventId:
          event.eventId,

        eventType:
          event.eventType,

        processed: true,

        processedAt:
          new Date(),
      });

      return;
    }

    // --------------------------------------------------
    // 7. Check whether payment already exists
    // --------------------------------------------------

    const existingPayment =
    await Payment.findOne({
      $or: [
        {
          providerPaymentId:
            event.paymentId,
        },
        {
          providerCheckoutSessionId:
            event.checkoutSessionId,
        },
      ],
    });

    if (existingPayment) {
      console.log(
        `Payment ${event.paymentId} already exists`,
      );

      await WebhookEvent.create({
        providerEventId:
          event.eventId,

        eventType:
          event.eventType,

        processed: true,

        processedAt:
          new Date(),
      });

      return;
    }

    // --------------------------------------------------
    // 8. Determine configured provider
    // --------------------------------------------------

    const provider =
      getPaymentProviderName();

    // --------------------------------------------------
    // 9. Create payment record
    // --------------------------------------------------

    if (
      event.amount !== invoice.amount ||
      event.currency.toLowerCase() !==
        invoice.currency.toLowerCase()
    ) {
      throw new Error(
        "Webhook payment amount or currency does not match invoice",
      );
    }

    await Payment.create({
      invoiceId:
        event.invoiceId,

      clientId:
        event.clientId,

      provider,

      providerPaymentId:
        event.paymentId,

      providerCheckoutSessionId:
        event.checkoutSessionId,

      amount:
        event.amount,

      currency:
        event.currency,

      status: "SUCCEEDED",

      paidAt:
        event.paidAt ??
        new Date(),
    });

    // --------------------------------------------------
    // 10. Mark invoice as PAID
    //
    // The verified webhook is the source of truth.
    // --------------------------------------------------

    invoice.status = "PAID";

    invoice.providerPaymentId =
      event.paymentId;

    invoice.providerCheckoutSessionId =
      event.checkoutSessionId;

    invoice.paidAt =
      event.paidAt ??
      new Date();

    await invoice.save();

    // --------------------------------------------------
    // 11. Record webhook as processed
    // --------------------------------------------------

    await WebhookEvent.create({
      providerEventId:
        event.eventId,

      eventType:
        event.eventType,

      processed: true,

      processedAt:
        new Date(),
    });

    console.log(
      `Payment confirmed for invoice ${invoice.invoiceNumber}`,
    );
  };