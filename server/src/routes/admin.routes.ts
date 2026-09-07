import { Router } from "express";

import {
  createInvoice,
  getAdminInvoiceById,
  getAllInvoices,
  updateInvoice,
} from "../controllers/invoice.controller.js";import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/rbac.middleware.js";

const router = Router();

router.post(
  "/invoices",
  authenticate,
  authorize("ADMIN"),
  createInvoice,
);

router.get(
  "/invoices",
  authenticate,
  authorize("ADMIN"),
  getAllInvoices,
);

router.get(
  "/invoices/:id",
  authenticate,
  authorize("ADMIN"),
  getAdminInvoiceById,
);

router.patch(
  "/invoices/:id",
  authenticate,
  authorize("ADMIN"),
  updateInvoice,
);

export default router;