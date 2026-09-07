import type { PaymentProvider } from "./payment-provider.interface.js";
import { MockPaymentProvider } from "./mock/mock-payment-provider.js";

let paymentProvider: PaymentProvider | null = null;

export const getPaymentProvider =
  (): PaymentProvider => {
    if (paymentProvider) {
      return paymentProvider;
    }

    const provider =
      process.env.PAYMENT_PROVIDER ?? "mock";

    switch (provider) {
      case "mock":
        paymentProvider =
          new MockPaymentProvider();

        return paymentProvider;

      case "stripe":
        throw new Error(
          "Stripe payment provider is not implemented yet",
        );

      default:
        throw new Error(
          `Unsupported payment provider: ${provider}`,
        );
    }
  };