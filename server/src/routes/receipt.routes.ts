import { Router } from "express";

import { getClientReceipt } from "../controllers/receipt.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/rbac.middleware.js";

const router = Router();

router.get(
  "/client/invoices/:id/receipt",
  authenticate,
  authorize("CLIENT"),
  getClientReceipt,
);

export default router;