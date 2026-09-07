import { Request, Response } from "express";

import { createInvoiceSchema } from "../validators/invoice.validator.js";
import * as invoiceService from "../services/invoice/invoice.service.js";

export const createInvoice = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const result = createInvoiceSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });

      return;
    }

    const invoice = await invoiceService.createInvoice(
      result.data,
    );

    res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      data: {
        id: invoice._id.toString(),
        invoiceNumber: invoice.invoiceNumber,
        clientId: invoice.clientId.toString(),
        description: invoice.description,
        amount: invoice.amount,
        currency: invoice.currency,
        dueDate: invoice.dueDate,
        status: invoice.status,
        createdAt: invoice.createdAt,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create invoice";

    if (
      message === "Invalid client ID" ||
      message === "Active client not found"
    ) {
      res.status(400).json({
        success: false,
        message,
      });

      return;
    }

    console.error("Create invoice error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};