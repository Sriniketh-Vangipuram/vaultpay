import cloudinary from "../../config/cloudinary.js";

export const uploadReceiptPdf = async (
  pdfBuffer: Buffer,
  invoiceNumber: string,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "vaultpay/receipts",
        public_id: `${invoiceNumber}.pdf`,
        type: "upload",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result?.secure_url) {
          reject(
            new Error("Cloudinary upload did not return a secure URL"),
          );
          return;
        }

        resolve(result.secure_url);
      },
    );

    uploadStream.end(pdfBuffer);
  });
};