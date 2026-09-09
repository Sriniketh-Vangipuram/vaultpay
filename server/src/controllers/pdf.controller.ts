import { Request, Response } from "express";

import {
  generateReceiptPdf,
} from "../services/pdf/receipt-pdf.service.js";

export const testReceiptPdf = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const pdf =
      await generateReceiptPdf({
        invoiceNumber: "INV-2026-TEST",
        clientName: "Demo Client",
        companyName: "Demo Company",
        clientEmail: "client@vaultpay.test",
        description:
          "Corporate consulting services",
        amount: 5000,
        currency: "usd",
        paidAt: new Date(),
      });

    res.setHeader(
      "Content-Type",
      "application/pdf",
    );

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="vaultpay-receipt.pdf"',
    );

    res.send(pdf);
  } catch (error) {
    console.error(
      "PDF generation failed:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "PDF generation failed",
    });
  }
};