import "dotenv/config";

import app from "./app.js";

const PORT = Number(process.env.PORT) || 5000;

const server = app.listen(PORT, () => {
  console.log(`VaultPay API running on port ${PORT}`);
});

const shutdown = (signal: string) => {
  console.log(`${signal} received. Shutting down gracefully...`);

  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));