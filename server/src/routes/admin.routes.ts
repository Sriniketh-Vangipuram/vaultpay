import { Router } from "express";

import { createInvoice } from "../controllers/invoice.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/rbac.middleware.js";

const router = Router();

router.post(
  "/invoices",
  authenticate,
  authorize("ADMIN"),
  createInvoice,
);

export default router;