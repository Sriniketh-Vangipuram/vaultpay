import { Router } from "express";

import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/rbac.middleware.js";

const router = Router();

router.get(
  "/protected",
  authenticate,
  (_req, res) => {
    res.status(200).json({
      success: true,
      message: "Authenticated request",
    });
  },
);

router.get(
  "/admin-only",
  authenticate,
  authorize("ADMIN"),
  (_req, res) => {
    res.status(200).json({
      success: true,
      message: "Admin access granted",
    });
  },
);

router.get(
  "/client-only",
  authenticate,
  authorize("CLIENT"),
  (_req, res) => {
    res.status(200).json({
      success: true,
      message: "Client access granted",
    });
  },
);

export default router;