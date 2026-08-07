// Inside src/config/index.js
import dotenv from "dotenv";
dotenv.config();

const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL,
};

export default config; // ✅ Adds default export for ESM