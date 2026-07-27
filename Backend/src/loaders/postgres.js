import { Sequelize } from "sequelize";
import { env } from "../config/env.js";

export const sequelize = new Sequelize(
  env.db.name,
  env.db.user,
  env.db.password,
  {
	host: env.db.host,
	port: env.db.port,
	dialect: env.db.dialect,
	logging: env.nodeEnv === "development" ? console.log : false,
  }
);

const postgresLoader = async () => {
  try {
	await sequelize.authenticate();
	console.log(" PostgreSQL connection has been established successfully.");
  } catch (error) {
	console.error(" Unable to connect to the PostgreSQL database:", error);
	process.exit(1);
  }
};

export default postgresLoader;