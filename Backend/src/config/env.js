// import dotenv from "dotenv";
// dotenv.config();

// export const env = {
//   port: process.env.PORT || 5000,
//   nodeEnv: process.env.NODE_ENV || "development",
//   databaseUrl: process.env.DATABASE_URL,
// };


import "dotenv/config";

export const env = {
  dbName: process.env.DB_NAME,
  dbUser: process.env.DB_USER,
  dbPassword: process.env.DB_PASSWORD,
  dbHost: process.env.DB_HOST || "localhost",
  dbPort: Number(process.env.DB_PORT || 5432),

  nodeEnv: process.env.NODE_ENV || "development",
};

