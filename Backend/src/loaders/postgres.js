import { Sequelize } from "sequelize";
import { env } from "../config/env.js";

export const sequelize = new Sequelize(env.databaseUrl, {
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // Required by Neon
    },
  },
  logging: env.nodeEnv === "development" ? console.log : false,
});

const postgresLoader = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully to Neon!");
  } catch (error) {
    console.error("Unable to connect to database:", error);
    process.exit(1);
    throw error; // Let Express catch the error gracefully
  }
};

export default postgresLoader;