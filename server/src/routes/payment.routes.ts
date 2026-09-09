import { Router } from "express";

import {
  createPaymentCheckout,
} from "../controllers/payment.controller.js";

import {
  authenticate,
} from "../middlewares/auth.middleware.js";

import {
  authorize,
} from "../middlewares/rbac.middleware.js";

const router = Router();

router.post(
  "/create-checkout-session",
  authenticate,
  authorize("CLIENT"),
  createPaymentCheckout,
);

export default router;