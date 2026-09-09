import { z } from "zod";

export const createCheckoutSessionSchema =
  z.object({
    invoiceId: z
      .string()
      .regex(
        /^[a-f\d]{24}$/i,
        "Invalid invoice ID",
      ),
  });

export type CreateCheckoutSessionInput =
  z.infer<
    typeof createCheckoutSessionSchema
  >;