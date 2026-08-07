import { Sequelize } from "sequelize";
import { env } from "./env.js"; // or process.env

const isProduction = process.env.NODE_ENV === "production";

export const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: "postgres",
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false, // Required for Neon cloud DB
        },
      },
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST || "localhost",
        dialect: "postgres",
        port: process.env.DB_PORT || 5432,
      }
    );