// server.js
import express from "express";
import { env } from "./config/env.js";
import loaders from "./loaders/index.js";
import { unProtectedRouter, protectedRouter } from "./routes/index.js";

const app = express();

let isInitialized = false;

// Middleware to ensure all loaders, CORS, and routes are fully ready before processing requests
app.use(async (req, res, next) => {
  if (!isInitialized) {
    await loaders({ expressApp: app });

    // Mount routes inside initialization
    app.use("/api/v1", unProtectedRouter);
    app.use("/api/v1", protectedRouter);

    // Catch-all 404 handler
    app.use((req, res) => {
      res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
    });

    isInitialized = true;
  }
  next();
});

// Local development server listener
if (process.env.NODE_ENV !== "production") {
  loaders({ expressApp: app }).then(() => {
    app.use("/api/v1", unProtectedRouter);
    app.use("/api/v1", protectedRouter);

    app.listen(env.port, () => {
      console.log(`Server listening on port: ${env.port}`);
    });
  });
}

export default app;