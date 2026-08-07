require("dotenv").config({ path: "./.env" });

const sslOptions = {
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
};

module.exports = {
  development: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres",
    dialectOptions: sslOptions,
  },
  test: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres",
    dialectOptions: sslOptions,
  },
  production: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres",
    dialectOptions: sslOptions,
  },
};