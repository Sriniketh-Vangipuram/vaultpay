import {
  createHmac,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";

import type {
  CheckoutSessionResult,
  CreateCheckoutSessionInput,
  PaymentProvider,
  PaymentWebhookEvent,
} from "../payment-provider.interface.js";

interface MockCheckoutSession {
  sessionId: string;
  invoiceId: string;
  clientId: string;
  amount: number;
  currency: string;
  description: string;
  customerEmail: string;
  idempotencyKey: string;
}

export class MockPaymentProvider
  implements PaymentProvider
{
  private readonly sessions = new Map<
    string,
    MockCheckoutSession
  >();

  private readonly idempotencyKeys = new Map<
    string,
    CheckoutSessionResult
  >();

  private readonly webhookSecret =
    process.env.MOCK_WEBHOOK_SECRET ??
    "vaultpay-mock-webhook-secret";

  async createCheckoutSession(
    input: CreateCheckoutSessionInput,
  ): Promise<CheckoutSessionResult> {
    const existingSession =
      this.idempotencyKeys.get(input.idempotencyKey);

    if (existingSession) {
      return existingSession;
    }

    const sessionId = `mock_cs_${randomUUID()}`;
    
    const checkoutUrl =
      `${input.successUrl}?mockSessionId=${sessionId}`;

    const result: CheckoutSessionResult = {
      sessionId,
      checkoutUrl,
    };

    this.sessions.set(sessionId, {
      sessionId,
      invoiceId: input.invoiceId,
      clientId: input.clientId,
      amount: input.amount,
      currency: input.currency,
      description: input.description,
      customerEmail: input.customerEmail,
      idempotencyKey: input.idempotencyKey,
    });

    this.idempotencyKeys.set(
      input.idempotencyKey,
      result,
    );

    return result;
  }

  constructWebhookEvent(
    rawBody: Buffer,
    signature: string,
  ): PaymentWebhookEvent {
    const expectedSignature = createHmac(
      "sha256",
      this.webhookSecret,
    )
      .update(rawBody)
      .digest("hex");

    const providedBuffer = Buffer.from(
      signature,
      "utf8",
    );

    const expectedBuffer = Buffer.from(
      expectedSignature,
      "utf8",
    );

    if (
      providedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(
        providedBuffer,
        expectedBuffer,
      )
    ) {
      throw new Error(
        "Invalid mock webhook signature",
      );
    }

    const payload = JSON.parse(
      rawBody.toString("utf8"),
    ) as PaymentWebhookEvent;

    return payload;
  }

  getSession(
    sessionId: string,
  ): MockCheckoutSession | undefined {
    return this.sessions.get(sessionId);
  }

  generateWebhookSignature(
    payload: Buffer,
  ): string {
    return createHmac(
      "sha256",
      this.webhookSecret,
    )
      .update(payload)
      .digest("hex");
  }
}