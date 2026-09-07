import {z} from "zod";

export const createInvoiceSchema=z.object({
    clientId:z
        .string()
        .regex(/^[a-f\d]{24}$/i,"Invalid client ID"),

    description:z
        .string()
        .trim()
        .min(1,"Description is required")
        .max(500,"Description is too long"),
    
    amount:z
        .number()
        .positive("Amount must be greater than zero")
        .finite("Amount must be a valid number"),

    currency:z
        .string()
        .trim()
        .toLowerCase()
        .regex(
            /^[a-z]{3}$/,
            "Currency must be a valid 3-letter currency code",
        )
        .default("usd"),

    dueDate:z
        .string()
        .datetime({
            offset:true,
        })
        .transform((value)=> new Date(value)),
});


export const updateInvoiceSchema = z
  .object({
    description: z
      .string()
      .trim()
      .min(1, "Description is required")
      .max(500, "Description is too long")
      .optional(),

    amount: z
      .number()
      .positive("Amount must be greater than zero")
      .finite("Amount must be a valid number")
      .optional(),

    currency: z
      .string()
      .trim()
      .toLowerCase()
      .regex(
        /^[a-z]{3}$/,
        "Currency must be a valid 3-letter currency code",
      )
      .optional(),

    dueDate: z
      .string()
      .datetime({
        offset: true,
      })
      .transform((value) => new Date(value))
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "At least one field must be provided",
    },
  );

export type UpdateInvoiceInput = z.infer< typeof updateInvoiceSchema >;


export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;