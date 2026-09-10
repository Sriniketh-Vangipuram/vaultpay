import mongoose from "mongoose";

import Invoice, { type IInvoice,} from "../../models/Invoice.js";
import Payment from "../../models/Payment.js";
import User from "../../models/User.js";
import WebhookEvent from "../../models/WebhookEvent.js";

import { generateReceiptPdf } from "../pdf/receipt-pdf.service.js";
import { uploadReceiptPdf } from "../pdf/receipt-storage.service.js";
import { sendReceiptEmail } from "../email/receipt-email.service.js";

import type { PaymentWebhookEvent } from "./payment-provider.interface.js";

type PaymentProviderName = "MOCK" | "STRIPE";

const getPaymentProviderName = (): PaymentProviderName => {
  const provider = (process.env.PAYMENT_PROVIDER ?? "mock").toUpperCase();

  if (provider !== "MOCK" && provider !== "STRIPE") {
    throw new Error(`Unsupported payment provider: ${provider}`);
  }

  return provider;
};

const generateAndDeliverReceipt = async (
  invoice: mongoose.HydratedDocument<IInvoice>,
  client: {
    name: string;
    email: string;
    companyName?: string;
  },
): Promise<string> => {
  const receiptPdf = await generateReceiptPdf({
    invoiceNumber: invoice.invoiceNumber,
    clientName: client.name,
    companyName: client.companyName,
    clientEmail: client.email,
    description: invoice.description,
    amount: invoice.amount,
    currency: invoice.currency,
    paidAt: invoice.paidAt ?? new Date(),
  });

  console.log(`Receipt PDF generated: ${receiptPdf.length} bytes`);

  const receiptUrl = await uploadReceiptPdf(
    receiptPdf,
    invoice.invoiceNumber,
  );

  console.log(`Receipt uploaded: ${receiptUrl}`);

  await sendReceiptEmail({
  invoice,
  client,
  receiptPdf,
});

  console.log(`Receipt email sent to ${client.email}`);

  return receiptUrl;
};

export const processPaymentWebhook = async (
  event: PaymentWebhookEvent,
): Promise<void> => {
  const existingEvent = await WebhookEvent.findOne({
    providerEventId: event.eventId,
  });

  if (existingEvent) {
    console.log(`Webhook ${event.eventId} already processed`);
    return;
  }

  if (!mongoose.isValidObjectId(event.invoiceId)) {
    throw new Error("Invalid invoice ID in webhook");
  }

  if (!mongoose.isValidObjectId(event.clientId)) {
    throw new Error("Invalid client ID in webhook");
  }

  const invoice = await Invoice.findById(event.invoiceId);

  if (!invoice) {
    throw new Error("Invoice referenced by webhook not found");
  }

  if (invoice.clientId.toString() !== event.clientId) {
    throw new Error("Webhook client does not own invoice");
  }

  if (event.status !== "SUCCEEDED") {
    console.log(
      `Payment event ${event.eventId} status: ${event.status}`,
    );

    await WebhookEvent.create({
      providerEventId: event.eventId,
      eventType: event.eventType,
      processed: true,
      processedAt: new Date(),
    });

    return;
  }

  if (
    event.amount !== invoice.amount ||
    event.currency.toLowerCase() !== invoice.currency.toLowerCase()
  ) {
    throw new Error(
      "Webhook payment amount or currency does not match invoice",
    );
  }

  const client = await User.findOne({
    _id: event.clientId,
    role: "CLIENT",
    isActive: true,
  }).lean();

  if (!client) {
    throw new Error(
      "Client referenced by payment does not exist",
    );
  }

  /*
   * Check whether this payment already exists.
   *
   * This protects against duplicate webhook deliveries
   * and also lets us recover from failures that happened
   * after the payment was recorded.
   */
  const existingPayment = await Payment.findOne({
    $or: [
      { providerPaymentId: event.paymentId },
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

    /*
     * Payment is already confirmed and receipt delivery
     * completed successfully.
     */
    if (invoice.receiptUrl) {
      await WebhookEvent.create({
        providerEventId: event.eventId,
        eventType: event.eventType,
        processed: true,
        processedAt: new Date(),
      });

      return;
    }

    /*
     * Payment exists but receipt delivery failed earlier.
     * Retry the receipt generation/upload/email process.
     */
    console.log(
      `Receipt missing for ${invoice.invoiceNumber}. Retrying receipt delivery...`,
    );

    const receiptUrl = await generateAndDeliverReceipt(
      invoice,
      client,
    );

    invoice.receiptUrl = receiptUrl;

    await invoice.save();

    await WebhookEvent.create({
      providerEventId: event.eventId,
      eventType: event.eventType,
      processed: true,
      processedAt: new Date(),
    });

    console.log(
      `Receipt successfully recovered for ${invoice.invoiceNumber}`,
    );

    return;
  }

  const provider = getPaymentProviderName();

  /*
   * Create the payment record only after all webhook
   * authenticity and invoice validation checks succeed.
   */
  await Payment.create({
    invoiceId: event.invoiceId,
    clientId: event.clientId,
    provider,
    providerPaymentId: event.paymentId,
    providerCheckoutSessionId: event.checkoutSessionId,
    amount: event.amount,
    currency: event.currency,
    status: "SUCCEEDED",
    paidAt: event.paidAt ?? new Date(),
  });

  invoice.status = "PAID";
  invoice.providerPaymentId = event.paymentId;
  invoice.providerCheckoutSessionId =
    event.checkoutSessionId;
  invoice.paidAt = event.paidAt ?? new Date();

  await invoice.save();

  const receiptUrl = await generateAndDeliverReceipt(
    invoice,
    client,
  );

  invoice.receiptUrl = receiptUrl;

  await invoice.save();

  await WebhookEvent.create({
    providerEventId: event.eventId,
    eventType: event.eventType,
    processed: true,
    processedAt: new Date(),
  });

  console.log(
    `Payment confirmed for invoice ${invoice.invoiceNumber}`,
  );
};