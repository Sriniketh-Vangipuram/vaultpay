import { Router } from "express";

import {
  handleMockWebhook,
} from "../controllers/webhook.controller.js";

const router = Router();

router.post(
  "/mock",
  handleMockWebhook,
);

export default router;