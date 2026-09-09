import mongoose, {
  Document,
  Schema,
} from "mongoose";

export type PaymentIdempotencyStatus =
  | "PENDING"
  | "COMPLETED"
  | "FAILED";

export interface IPaymentIdempotency
  extends Document {
  key: string;

  requestHash: string;

  clientId: mongoose.Types.ObjectId;
  invoiceId: mongoose.Types.ObjectId;

  provider: "MOCK" | "STRIPE";

  sessionId?: string;
  checkoutUrl?: string;

  status: PaymentIdempotencyStatus;

  createdAt: Date;
  updatedAt: Date;
}

const paymentIdempotencySchema =
  new Schema<IPaymentIdempotency>(
    {
      key: {
        type: String,
        required: true,
        unique: true,
        index: true,
        trim: true,
      },

      clientId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      invoiceId: {
        type: Schema.Types.ObjectId,
        ref: "Invoice",
        required: true,
        index: true,
      },

      provider: {
        type: String,
        enum: ["MOCK", "STRIPE"],
        required: true,
      },

      sessionId: {
        type: String,
      },

      checkoutUrl: {
        type: String,
      },

      status: {
        type: String,
        enum: [
          "PENDING",
          "COMPLETED",
          "FAILED",
        ],
        required: true,
        default: "PENDING",
        index: true,
      },
      requestHash: {
        type: String,
        required: true,
        index: true,
    },
    },
    {
      timestamps: true,
    },
  );

const PaymentIdempotency =
  mongoose.model<IPaymentIdempotency>(
    "PaymentIdempotency",
    paymentIdempotencySchema,
  );

export default PaymentIdempotency;