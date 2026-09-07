export interface CreateCheckoutSessionInput {
  invoiceId: string;
  clientId: string;

  amount: number;
  currency: string;

  description: string;
  customerEmail: string;

  successUrl: string;
  cancelUrl: string;

  idempotencyKey: string;
}

export interface CheckoutSessionResult {
  sessionId: string;
  checkoutUrl: string;
}

export interface PaymentWebhookEvent {
  eventId: string;
  eventType: string;

  invoiceId: string;
  clientId: string;

  checkoutSessionId: string;
  paymentIntentId: string;

  amount: number;
  currency: string;

  status: "SUCCEEDED" | "FAILED";

  paidAt?: Date;
}

export interface PaymentProvider {
  createCheckoutSession(
    input: CreateCheckoutSessionInput,
  ): Promise<CheckoutSessionResult>;

  constructWebhookEvent(
    rawBody: Buffer,
    signature: string,
  ): PaymentWebhookEvent;
}