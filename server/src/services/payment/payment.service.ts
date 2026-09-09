import mongoose from "mongoose";

import Invoice from "../../models/Invoice.js";
import User from "../../models/User.js";
import { getPaymentProvider } from "./payment-provider.factory.js";
import type {
  CheckoutSessionResult,
} from "./payment-provider.interface.js";

interface CreateCheckoutSessionInput {
  clientId: string;
  invoiceId: string;
  idempotencyKey: string;
}

export const createCheckoutSession = async (
  input: CreateCheckoutSessionInput,
): Promise<CheckoutSessionResult> => {
  const {
    clientId,
    invoiceId,
    idempotencyKey,
  } = input;

  // 1. Validate MongoDB IDs
  if (!mongoose.isValidObjectId(clientId)) {
    throw new Error("Invalid client ID");
  }

  if (!mongoose.isValidObjectId(invoiceId)) {
    throw new Error("Invalid invoice ID");
  }

  // 2. Validate idempotency key
  if (!idempotencyKey.trim()) {
    throw new Error("Idempotency key is required");
  }

  // 3. Find the authenticated client
  const client = await User.findOne({
    _id: clientId,
    role: "CLIENT",
    isActive: true,
  }).lean();

  if (!client) {
    throw new Error("Client not found");
  }

  // 4. Find invoice
  const invoice = await Invoice.findById(
    invoiceId,
  ).lean();

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  // 5. CRITICAL: IDOR protection
  if (
    invoice.clientId.toString() !== clientId
  ) {
    throw new Error("Invoice access forbidden");
  }

  // 6. Only pending invoices can be paid
  if (invoice.status === "PAID") {
    throw new Error(
      "Invoice has already been paid",
    );
  }

  if (invoice.status === "CANCELLED") {
    throw new Error(
      "Cancelled invoices cannot be paid",
    );
  }

  if (invoice.status !== "PENDING") {
    throw new Error(
      "Invoice is not available for payment",
    );
  }

  // 7. Get payment provider
  const provider = getPaymentProvider();

  // 8. IMPORTANT:
  // Amount, currency and description come from
  // our database, NOT from the client request.
  const session =
    await provider.createCheckoutSession({
      invoiceId: invoice._id.toString(),
      clientId: client._id.toString(),

      amount: invoice.amount,
      currency: invoice.currency,

      description: invoice.description,
      customerEmail: client.email,

      successUrl:
        `${process.env.CLIENT_URL}/payment/success`,

      cancelUrl:
        `${process.env.CLIENT_URL}/payment/cancelled`,

      idempotencyKey,
    });

  return session;
};