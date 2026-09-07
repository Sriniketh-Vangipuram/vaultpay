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

export const getClientInvoices = async (
  clientId: string,
) => {
  if (!mongoose.isValidObjectId(clientId)) {
    throw new Error("Invalid client ID");
  }

  const invoices = await Invoice.find({
    clientId,
  })
    .sort({ createdAt: -1 })
    .lean();

  return invoices;
};

export const getClientInvoiceById=async(invoiceId:string,clientId:string,)=>{
    if(!mongoose.isValidObjectId(invoiceId)){
        throw new Error("Invalid invoice ID");
    }

    if(!mongoose.isValidObjectId(clientId)){
        throw new Error("Invalid client ID");
    }

    const invoice=await Invoice.findById(invoiceId).lean();

    if(!invoice){
        throw new Error("Invoice not found");
    }

    if(invoice.clientId.toString()!==clientId){
        throw new Error("Invoice access forbidden");
    }

    return invoice;
};

export const getAllInvoices = async () => {
  const invoices = await Invoice.find()
    .populate({
      path: "clientId",
      select: "name email companyName",
    })
    .sort({ createdAt: -1 })
    .lean();

  return invoices;
};