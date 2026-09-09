import mongoose, { Document, Schema } from "mongoose";

export type InvoiceStatus =
  | "DRAFT"
  | "PENDING"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

export interface IInvoice extends Document {
  invoiceNumber: string;
  clientId: mongoose.Types.ObjectId;
  description: string;
  amount: number;
  currency: string;
  dueDate: Date;
  status: InvoiceStatus;

  providerCheckoutSessionId?: string;
  providerPaymentId?: string;

  paidAt?: Date;
  receiptUrl?: string;

  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    clientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    currency: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      default: "usd",
    },

    dueDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "DRAFT",
        "PENDING",
        "PAID",
        "OVERDUE",
        "CANCELLED",
      ],
      default: "PENDING",
      index: true,
    },

    providerCheckoutSessionId: {
      type: String,
      sparse: true,
      index: true,
    },

    providerPaymentId: {
      type: String,
      sparse: true,
      index: true,
    },

    paidAt: {
      type: Date,
    },

    receiptUrl: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

invoiceSchema.index({
  clientId: 1,
  status: 1,
  createdAt: -1,
});

const Invoice = mongoose.model<IInvoice>(
  "Invoice",
  invoiceSchema,
);

export default Invoice;