import mongoose, { Document, Schema } from "mongoose";

export interface IInvoiceCounter extends Document {
  key: string;
  sequence: number;
}

const invoiceCounterSchema = new Schema<IInvoiceCounter>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },

    sequence: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

const InvoiceCounter = mongoose.model<IInvoiceCounter>(
  "InvoiceCounter",
  invoiceCounterSchema,
);

export default InvoiceCounter;