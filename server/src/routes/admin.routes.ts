import { Router } from "express";

import { createInvoice,getAllInvoices } from "../controllers/invoice.controller.js";
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

export default router;