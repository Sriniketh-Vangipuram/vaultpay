import mongoose from "mongoose";

import Invoice from "../../models/Invoice.js";

export const getClientReceiptUrl = async (
  clientId: string,
  invoiceId: string,
): Promise<string> => {
  if (!mongoose.isValidObjectId(invoiceId)) {
    throw new Error("Invalid invoice ID");
  }

  const invoice = await Invoice.findById(invoiceId).lean();

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  // Zero-trust ownership check.
  if (invoice.clientId.toString() !== clientId) {
    throw new Error("Invoice access forbidden");
  }

  if (invoice.status !== "PAID") {
    throw new Error("Receipt is not available");
  }

  if (!invoice.receiptUrl) {
    throw new Error("Receipt not found");
  }

  return invoice.receiptUrl;
};