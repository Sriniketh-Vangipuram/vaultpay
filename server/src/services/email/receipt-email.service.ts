import { resend, resendFromEmail } from "../../config/email";
import type { IInvoice } from "../../models/Invoice";

interface ReceiptClient {
  name: string;
  email: string;
  companyName?: string;
}

interface SendReceiptEmailInput {
  invoice: IInvoice;
  client: ReceiptClient;
  receiptPdf: Buffer;
}

export const sendReceiptEmail = async ({
  invoice,
  client,
  receiptPdf,
}: SendReceiptEmailInput): Promise<void> => {
  const result = await resend.emails.send({
    from: resendFromEmail,
    to: client.email,
    subject: `Payment Receipt - ${invoice.invoiceNumber}`,
    html: `
      <h2>Payment Receipt</h2>

      <p>Hello ${client.name},</p>

      <p>
        Your payment for invoice
        <strong>${invoice.invoiceNumber}</strong>
        has been successfully received.
      </p>

      <p>
        Amount: <strong>${invoice.currency.toUpperCase()} ${invoice.amount.toFixed(2)}</strong>
      </p>

      <p>
        Please find your payment receipt attached to this email.
      </p>

      <p>Thank you,<br/>Nexus Corporate Services</p>
    `,
    attachments: [
      {
        filename: `${invoice.invoiceNumber}-receipt.pdf`,
        content: receiptPdf.toString("base64"),
      },
    ],
  });

  if (result.error) {
    throw new Error(`Receipt email failed: ${result.error.message}`);
  }

  console.log(`Receipt email sent: ${client.email}`);
};