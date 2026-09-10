import { Request, Response } from "express";

import { getClientReceiptUrl } from "../services/pdf/receipt-download.service.js";

export const getClientReceipt = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const { id } = req.params;

    if(typeof id!=="string"){
        res.status(400).json({
            success:false,
            message:"Invalid invoice ID",
        });

        return;
    }

    const receiptUrl = await getClientReceiptUrl(
      req.user.id,
      id,
    );

    res.status(200).json({
      success: true,
      data: {
        receiptUrl,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to retrieve receipt";

    if (message === "Invalid invoice ID") {
      res.status(400).json({
        success: false,
        message,
      });
      return;
    }

    if (message === "Invoice access forbidden") {
      res.status(403).json({
        success: false,
        message: "Forbidden",
      });
      return;
    }

    if (
      message === "Invoice not found" ||
      message === "Receipt not found"
    ) {
      res.status(404).json({
        success: false,
        message,
      });
      return;
    }

    if (message === "Receipt is not available") {
      res.status(409).json({
        success: false,
        message,
      });
      return;
    }

    console.error("Get receipt error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};