import crypto from "node:crypto";

import mongoose from "mongoose";

import Invoice from "../../models/Invoice.js";
import PaymentIdempotency from "../../models/PaymentIdempotency.js";
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

type PaymentProviderName =
  | "MOCK"
  | "STRIPE";

/**
 * Creates a deterministic hash representing
 * the logical checkout request.
 *
 * The same idempotency key cannot safely be
 * reused for another client, invoice, or provider.
 */
const createRequestHash = (
  clientId: string,
  invoiceId: string,
  provider: PaymentProviderName,
): string => {
  return crypto
    .createHash("sha256")
    .update(
      `${clientId}:${invoiceId}:${provider}`,
    )
    .digest("hex");
};

export const createCheckoutSession = async (
  input: CreateCheckoutSessionInput,
): Promise<CheckoutSessionResult> => {
  const {
    clientId,
    invoiceId,
    idempotencyKey,
  } = input;

  // --------------------------------------------------
  // 1. Validate MongoDB IDs
  // --------------------------------------------------

  if (!mongoose.isValidObjectId(clientId)) {
    throw new Error("Invalid client ID");
  }

  if (!mongoose.isValidObjectId(invoiceId)) {
    throw new Error("Invalid invoice ID");
  }

  // --------------------------------------------------
  // 2. Validate idempotency key
  // --------------------------------------------------

  if (!idempotencyKey.trim()) {
    throw new Error(
      "Idempotency key is required",
    );
  }

  // --------------------------------------------------
  // 3. Find authenticated client
  // --------------------------------------------------

  const client = await User.findOne({
    _id: clientId,
    role: "CLIENT",
    isActive: true,
  }).lean();

  if (!client) {
    throw new Error("Client not found");
  }

  // --------------------------------------------------
  // 4. Find invoice
  // --------------------------------------------------

  const invoice = await Invoice.findById(
    invoiceId,
  ).lean();

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  // --------------------------------------------------
  // 5. IDOR PROTECTION
  //
  // The invoice must belong to the authenticated
  // client.
  // --------------------------------------------------

  if (
    invoice.clientId.toString() !==
    clientId
  ) {
    throw new Error(
      "Invoice access forbidden",
    );
  }

  // --------------------------------------------------
  // 6. Validate invoice payment state
  // --------------------------------------------------

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

  // --------------------------------------------------
  // 7. Get payment provider
  // --------------------------------------------------

  const provider = getPaymentProvider();

  const providerName =
    (
      process.env.PAYMENT_PROVIDER ??
      "mock"
    ).toUpperCase() as PaymentProviderName;

  // --------------------------------------------------
  // 8. Generate request hash
  //
  // This binds the idempotency key to:
  //
  // client + invoice + provider
  // --------------------------------------------------

  const requestHash =
    createRequestHash(
      clientId,
      invoiceId,
      providerName,
    );

  // --------------------------------------------------
  // 9. Claim the idempotency key
  //
  // PaymentIdempotency.key has a UNIQUE index.
  //
  // Only one concurrent request can successfully
  // create the record.
  // --------------------------------------------------

  let idempotencyRecord;

  try {
    idempotencyRecord =
      await PaymentIdempotency.create({
        key: idempotencyKey,

        clientId,

        invoiceId,

        provider: providerName,

        requestHash,

        status: "PENDING",
      });
  } catch (error) {
    // ------------------------------------------------
    // MongoDB duplicate-key error
    // ------------------------------------------------

    if (
      error instanceof mongoose.Error &&
      "code" in error &&
      error.code === 11000
    ) {
      const existingRequest =
        await PaymentIdempotency.findOne({
          key: idempotencyKey,
        });

      if (!existingRequest) {
        throw new Error(
          "Unable to resolve idempotency request",
        );
      }

      const existingStatus =
        existingRequest.status;

      // ----------------------------------------------
      // Same key but different request
      // ----------------------------------------------

      if (
        existingRequest.requestHash !==
        requestHash
      ) {
        throw new Error(
          "Idempotency key has already been used for a different request",
        );
      }

      // ----------------------------------------------
      // Request already completed
      //
      // Return the original checkout session.
      // ----------------------------------------------

      if (
        existingStatus ===
          "COMPLETED" &&
        existingRequest.sessionId &&
        existingRequest.checkoutUrl
      ) {
        return {
          sessionId:
            existingRequest.sessionId,

          checkoutUrl:
            existingRequest.checkoutUrl,
        };
      }

      // ----------------------------------------------
      // Another request is currently processing
      // ----------------------------------------------

      if (
        existingStatus === "PENDING"
      ) {
        throw new Error(
          "A checkout request with this idempotency key is already being processed",
        );
      }

      // ----------------------------------------------
      // Previous attempt failed.
      //
      // Delete the failed record so the current
      // request can claim the idempotency key again.
      // ----------------------------------------------

      if (
        existingStatus === "FAILED"
      ) {
        await PaymentIdempotency.deleteOne({
          _id: existingRequest._id,
        });

        try {
          idempotencyRecord =
            await PaymentIdempotency.create({
              key: idempotencyKey,

              clientId,

              invoiceId,

              provider: providerName,

              requestHash,

              status: "PENDING",
            });
        } catch (retryError) {
          if (
            retryError instanceof
              mongoose.Error &&
            "code" in retryError &&
            retryError.code === 11000
          ) {
            throw new Error(
              "A checkout request with this idempotency key is already being processed",
            );
          }

          throw retryError;
        }
      }
    } else {
      throw error;
    }
  }

  // --------------------------------------------------
  // 10. Safety check
  // --------------------------------------------------

  if (!idempotencyRecord) {
    throw new Error(
      "Failed to create idempotency record",
    );
  }

  // --------------------------------------------------
  // 11. Create checkout session
  //
  // IMPORTANT:
  //
  // The frontend does NOT control:
  //
  // amount
  // currency
  // description
  //
  // These values come directly from our database.
  // --------------------------------------------------

  try {
    const session =
      await provider.createCheckoutSession({
        invoiceId:
          invoice._id.toString(),

        clientId:
          client._id.toString(),

        amount:
          invoice.amount,

        currency:
          invoice.currency,

        description:
          invoice.description,

        customerEmail:
          client.email,

        successUrl:
          `${process.env.CLIENT_URL}/payment/success`,

        cancelUrl:
          `${process.env.CLIENT_URL}/payment/cancelled`,

        idempotencyKey,
      });

    // ------------------------------------------------
    // 12. Persist checkout session
    // ------------------------------------------------

    await PaymentIdempotency.findByIdAndUpdate(
      idempotencyRecord._id,
      {
        $set: {
          sessionId:
            session.sessionId,

          checkoutUrl:
            session.checkoutUrl,

          status: "COMPLETED",
        },
      },
    );

    // ------------------------------------------------
    // 13. Return checkout session
    // ------------------------------------------------

    return session;
  } catch (error) {
    // ------------------------------------------------
    // 14. Provider failure
    //
    // Mark the idempotency request as FAILED so
    // the same key can be retried later.
    // ------------------------------------------------

    await PaymentIdempotency.findByIdAndUpdate(
      idempotencyRecord._id,
      {
        $set: {
          status: "FAILED",
        },
      },
    );

    throw error;
  }
};