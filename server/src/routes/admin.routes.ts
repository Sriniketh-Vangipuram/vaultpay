import { Router } from "express";

import { createInvoice,getAllInvoices,getAdminInvoiceById } from "../controllers/invoice.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
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


export default router;