import mongoose from "mongoose";

import Invoice from "../../models/Invoice.js";
import InvoiceCounter from "../../models/InvoiceCounter.js";
import User from "../../models/User.js";

interface CreateInvoiceInput {
  clientId: string;
  description: string;
  amount: number;
  currency: string;
  dueDate: Date;
}

const generateInvoiceNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const counterKey = `invoice-${year}`;

  const counter = await InvoiceCounter.findOneAndUpdate(
    { key: counterKey },
    {
      $inc: {
        sequence: 1,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );

  if (!counter) {
    throw new Error("Failed to generate invoice number");
  }

  return `INV-${year}-${counter.sequence
    .toString()
    .padStart(6, "0")}`;
};

export const createInvoice = async (
  input: CreateInvoiceInput,
) => {
  const {
    clientId,
    description,
    amount,
    currency,
    dueDate,
  } = input;

  if (!mongoose.isValidObjectId(clientId)) {
    throw new Error("Invalid client ID");
  }

  const client = await User.findOne({
    _id: clientId,
    role: "CLIENT",
    isActive: true,
  });

  if (!client) {
    throw new Error("Active client not found");
  }

  const invoice = await Invoice.create({
    invoiceNumber: await generateInvoiceNumber(),
    clientId: client._id,
    description,
    amount,
    currency,
    dueDate,
    status: "PENDING",
  });

  return invoice;
};