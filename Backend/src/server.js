import express from "express";
import { env } from "./config/env.js";
import loaders from "./loaders/index.js";
import { unProtectedRouter, protectedRouter } from "./routes/index.js";

async function startServer() {
  const app = express();

  await loaders({ expressApp: app });

  app.use("/api/v1", unProtectedRouter);

  app.use("/api/v1", protectedRouter);

  app.listen(env.port, () => {
    console.log(`
      ################################################
        Server listening on port: ${env.port} 
      ################################################
    `);
  });
}

startServer();