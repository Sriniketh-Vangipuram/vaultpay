import PDFDocument from "pdfkit";

interface ReceiptPdfInput {
  invoiceNumber: string;
  clientName: string;
  companyName?: string;
  clientEmail: string;
  description: string;
  amount: number;
  currency: string;
  paidAt: Date;
}

const formatCurrency = (
  amount: number,
  currency: string,
): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

export const generateReceiptPdf = (
  input: ReceiptPdfInput,
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const document = new PDFDocument({
      size: "A4",
      margin: 50,
    });

    const chunks: Buffer[] = [];

    document.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    document.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    document.on("error", reject);

    // -----------------------------------------
    // Header
    // -----------------------------------------

    document
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("NEXUS", {
        align: "left",
      });

    document
      .fontSize(10)
      .font("Helvetica")
      .text("Corporate Services");

    document.moveDown(2);

    // -----------------------------------------
    // Receipt title
    // -----------------------------------------

    document
      .fontSize(28)
      .font("Helvetica-Bold")
      .text("PAYMENT RECEIPT");

    document.moveDown(0.5);

    document
      .fontSize(11)
      .font("Helvetica")
      .text(
        `Receipt for invoice ${input.invoiceNumber}`,
      );

    document.moveDown(2);

    // -----------------------------------------
    // PAID stamp
    // -----------------------------------------

    const stampX = 400;
    const stampY = 145;

    document
      .lineWidth(2)
      .rect(stampX, stampY, 100, 40)
      .stroke();

    document
      .fontSize(18)
      .font("Helvetica-Bold")
      .text(
        "PAID",
        stampX,
        stampY + 10,
        {
          width: 100,
          align: "center",
        },
      );

    // -----------------------------------------
    // Customer information
    // -----------------------------------------

    document
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("BILLED TO");

    document.moveDown(0.4);

    document
      .fontSize(11)
      .font("Helvetica")
      .text(input.clientName);

    if (input.companyName) {
      document.text(input.companyName);
    }

    document.text(input.clientEmail);

    document.moveDown(2);

    // -----------------------------------------
    // Payment information
    // -----------------------------------------

    document
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("PAYMENT DETAILS");

    document.moveDown(0.8);

    document
      .fontSize(11)
      .font("Helvetica");

    document.text(
      `Invoice Number: ${input.invoiceNumber}`,
    );

    document.text(
      `Payment Date: ${formatDate(input.paidAt)}`,
    );

    document.text(
      `Payment Status: PAID`,
    );

    document.moveDown(2);

    // -----------------------------------------
    // Description
    // -----------------------------------------

    document
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("DESCRIPTION");

    document.moveDown(0.5);

    document
      .fontSize(11)
      .font("Helvetica")
      .text(input.description);

    document.moveDown(2);

    // -----------------------------------------
    // Amount
    // -----------------------------------------

    document
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("AMOUNT PAID");

    document.moveDown(0.5);

    document
      .fontSize(24)
      .font("Helvetica-Bold")
      .text(
        formatCurrency(
          input.amount,
          input.currency,
        ),
      );

    document.moveDown(3);

    // -----------------------------------------
    // Footer
    // -----------------------------------------

    document
      .fontSize(10)
      .font("Helvetica")
      .text(
        "Thank you for your business.",
        {
          align: "center",
        },
      );

    document.moveDown(0.5);

    document
      .fontSize(9)
      .text(
        "Nexus Corporate Services",
        {
          align: "center",
        },
      );

    document
      .fontSize(8)
      .fillColor("gray")
      .text(
        "This receipt was generated automatically after payment confirmation.",
        {
          align: "center",
        },
      );

    document.end();
  });
};