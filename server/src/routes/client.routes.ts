import { Router } from "express";

import { getClientInvoices,getClientInvoiceById } from "../controllers/invoice.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/rbac.middleware.js";

const router = Router();

router.get(
  "/invoices",
  authenticate,
  authorize("CLIENT"),
  getClientInvoices,
);

router.get(
  "/invoices/:id",
  authenticate,
  authorize("CLIENT"),
  getClientInvoiceById,
);

export default router;