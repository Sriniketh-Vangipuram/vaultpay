import mongoose, {
  Document,
  Schema,
} from "mongoose";

export interface IWebhookEvent extends Document {
  providerEventId: string;
  eventType: string;
  processed: boolean;
  processedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const webhookEventSchema =
  new Schema<IWebhookEvent>(
    {
      providerEventId: {
        type: String,
        required: true,
        unique: true,
        index: true,
      },

      eventType: {
        type: String,
        required: true,
        trim: true,
      },

      processed: {
        type: Boolean,
        required: true,
        default: false,
        index: true,
      },

      processedAt: {
        type: Date,
      },
    },
    {
      timestamps: true,
    },
  );

const WebhookEvent =
  mongoose.model<IWebhookEvent>(
    "WebhookEvent",
    webhookEventSchema,
  );

export default WebhookEvent;