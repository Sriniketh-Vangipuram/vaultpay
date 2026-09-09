import {
  MockPaymentProvider,
} from "./mock-payment-provider";

import {
  getPaymentProvider,
} from "../payment-provider.factory.js";

import {
  processPaymentWebhook,
} from "../payment-webhook.service.js";

export const completeMockPayment =
  async (
    sessionId: string,
  ): Promise<void> => {
    const provider =
      getPaymentProvider();

    if (
      !(provider instanceof MockPaymentProvider)
    ) {
      throw new Error(
        "Mock payment completion is only available with the mock provider",
      );
    }

    const webhook =
      provider.generateSuccessfulPaymentWebhook(
        sessionId,
      );

    // Verify the signature exactly as
    // an incoming webhook would be verified.
    const event =
      provider.constructWebhookEvent(
        webhook.payload,
        webhook.signature,
      );

    await processPaymentWebhook(
      event,
    );
  };