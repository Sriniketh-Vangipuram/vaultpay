import express from "express";
import cors from "cors";
import helmet from "helmet";

import authRoutes from "./routes/auth.routes.js";
import testRoutes from "./routes/test.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import clientRoutes from "./routes/client.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";


const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

// --------------------------------------------------
// Webhook routes MUST come before express.json()
// --------------------------------------------------

app.use(
  "/api/webhooks",
  express.raw({
    type: "application/json",
  }),
  webhookRoutes,
);


// Normal JSON API routes

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/client", clientRoutes);
app.use("/api/payments",paymentRoutes);
app.use("/api/test", testRoutes);

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "VaultPay API is running",
  });
});

export default app;