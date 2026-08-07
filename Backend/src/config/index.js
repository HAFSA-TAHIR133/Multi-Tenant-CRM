import pkg from "pg";
import { env } from "./env.js";

const { Pool } = pkg;

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: {
    rejectUnauthorized: false, // Required by Neon
  },
});

export default pool;