// server.js
import express from "express";
import { env } from "./config/env.js";
import loaders from "./loaders/index.js";
import { unProtectedRouter, protectedRouter } from "./routes/index.js";

const app = express();

async function startServer() {
  await loaders({ expressApp: app });

  // Mount routes
  app.use("/api/v1", unProtectedRouter);
  app.use("/api/v1", protectedRouter);

  // Catch-all 404 handler for unmatched routes
  app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
  });

  if (process.env.NODE_ENV !== "production") {
    app.listen(env.port, () => {
      console.log(`Server listening on port: ${env.port}`);
    });
  }
}

// Initialize setup
startServer();

// CRITICAL: Export the Express app instance for Vercel Serverless Functions
export default app;