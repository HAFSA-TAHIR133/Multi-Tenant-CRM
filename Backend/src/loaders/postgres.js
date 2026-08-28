// import { Sequelize } from "sequelize";
// import { env } from "../config/env.js";

// export const sequelize = new Sequelize(env.databaseUrl, {
//   dialect: "postgres",
//   dialectOptions: {
//     ssl: {
//       require: true,
//       rejectUnauthorized: false, // Required by Neon
//     },
//   },
//   logging: env.nodeEnv === "development" ? console.log : false,
// });

// const postgresLoader = async () => {
//   try {
//     await sequelize.authenticate();
//     console.log("Database connected successfully to Neon!");
//   } catch (error) {
//     console.error("Unable to connect to database:", error);
//     process.exit(1);
//     throw error; // Let Express catch the error gracefully
//   }
// };

// export default postgresLoader;



import { Sequelize } from "sequelize";
import pg from "pg";
import { env } from "../config/env.js";

const isProduction = env.nodeEnv === "production" || process.env.VERCEL;

// Resolve connection strategy: DATABASE_URL takes priority over individual parameters
export const sequelize = env.databaseUrl
  ? new Sequelize(env.databaseUrl, {
      dialect: "postgres",
      dialectModule: pg, // Ensures compatibility with Vercel serverless bundle
      logging: env.nodeEnv === "development" ? console.log : false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false, // Required for Neon / Cloud Postgres
        },
      },
    })
  : new Sequelize(env.dbName, env.dbUser, env.dbPassword, {
      host: env.dbHost,
      port: env.dbPort,
      dialect: "postgres",
      dialectModule: pg,
      logging: env.nodeEnv === "development" ? console.log : false,
      dialectOptions: {},
    });

const postgresLoader = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected successfully!");
  } catch (error) {
    console.error("❌ Unable to connect to database:", error.message);
    
    // Do NOT run process.exit(1) on Vercel/serverless environments
    if (!process.env.VERCEL) {
      process.exit(1);
    }
    throw error;
  }
};

export default postgresLoader;

