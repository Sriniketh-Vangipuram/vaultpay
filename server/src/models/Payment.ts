import mongoose, {
  Document,
  Schema,
} from "mongoose";

export type PaymentStatus =
  | "PENDING"
  | "SUCCEEDED"
  | "FAILED";

export type PaymentProvider =
  | "MOCK"
  | "STRIPE";

export interface IPayment extends Document {
  invoiceId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;

  provider: PaymentProvider;

  providerPaymentId?: string;
  providerCheckoutSessionId?: string;

  amount: number;
  currency: string;
  status: PaymentStatus;

  paidAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
      index: true,
    },

    clientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    provider: {
      type: String,
      enum: ["MOCK", "STRIPE"],
      required: true,
      index: true,
    },

    providerPaymentId: {
      type: String,
      sparse: true,
      unique: true,
      index: true,
    },

    providerCheckoutSessionId: {
      type: String,
      sparse: true,
      unique: true,
      index: true,
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
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "SUCCEEDED",
        "FAILED",
      ],
      required: true,
      default: "PENDING",
      index: true,
    },

    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

paymentSchema.index({
  invoiceId: 1,
  status: 1,
  createdAt: -1,
});

const Payment = mongoose.model<IPayment>(
  "Payment",
  paymentSchema,
);

export default Payment;