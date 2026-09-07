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

export const getClientInvoices = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });

      return;
    }

    const invoices = await invoiceService.getClientInvoices(
      req.user.id,
    );

    res.status(200).json({
      success: true,
      data: invoices.map((invoice) => ({
        id: invoice._id.toString(),
        invoiceNumber: invoice.invoiceNumber,
        description: invoice.description,
        amount: invoice.amount,
        currency: invoice.currency,
        dueDate: invoice.dueDate,
        status: invoice.status,
        paidAt: invoice.paidAt,
        receiptUrl: invoice.receiptUrl,
        createdAt: invoice.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get client invoices error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getClientInvoiceById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });

      return;
    }

    const { id } = req.params;

    if(typeof id!=="string"){
        res.status(400).json({
            success:false,
            message:"Invalid invoice ID",
        });

        return;
    }

    const invoice = await invoiceService.getClientInvoiceById(
      id,
      req.user.id,
    );

    res.status(200).json({
      success: true,
      data: {
        id: invoice._id.toString(),
        invoiceNumber: invoice.invoiceNumber,
        description: invoice.description,
        amount: invoice.amount,
        currency: invoice.currency,
        dueDate: invoice.dueDate,
        status: invoice.status,
        paidAt: invoice.paidAt,
        receiptUrl: invoice.receiptUrl,
        createdAt: invoice.createdAt,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch invoice";

    if (message === "Invalid invoice ID") {
      res.status(400).json({
        success: false,
        message,
      });

      return;
    }

    if (message === "Invoice not found") {
      res.status(404).json({
        success: false,
        message,
      });

      return;
    }

    if (message === "Invoice access forbidden") {
      res.status(403).json({
        success: false,
        message: "You are not authorized to access this invoice",
      });

      return;
    }

    console.error("Get client invoice error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getAllInvoices = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const invoices = await invoiceService.getAllInvoices();

    res.status(200).json({
      success: true,
      data: invoices.map((invoice) => ({
        id: invoice._id.toString(),
        invoiceNumber: invoice.invoiceNumber,
        client: invoice.clientId,
        description: invoice.description,
        amount: invoice.amount,
        currency: invoice.currency,
        dueDate: invoice.dueDate,
        status: invoice.status,
        paidAt: invoice.paidAt,
        receiptUrl: invoice.receiptUrl,
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Get all invoices error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const getAdminInvoiceById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    if (typeof id !== "string") {
      res.status(400).json({
        success: false,
        message: "Invalid invoice ID",
      });

      return;
    }

    const invoice =
      await invoiceService.getAdminInvoiceById(id);

    res.status(200).json({
      success: true,
      data: {
        id: invoice._id.toString(),
        invoiceNumber: invoice.invoiceNumber,
        client: invoice.clientId,
        description: invoice.description,
        amount: invoice.amount,
        currency: invoice.currency,
        dueDate: invoice.dueDate,
        status: invoice.status,
        stripeCheckoutSessionId:
          invoice.stripeCheckoutSessionId,
        stripePaymentIntentId:
          invoice.stripePaymentIntentId,
        paidAt: invoice.paidAt,
        receiptUrl: invoice.receiptUrl,
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch invoice";

    if (message === "Invalid invoice ID") {
      res.status(400).json({
        success: false,
        message,
      });

      return;
    }

    if (message === "Invoice not found") {
      res.status(404).json({
        success: false,
        message,
      });

      return;
    }

    console.error("Get admin invoice error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};